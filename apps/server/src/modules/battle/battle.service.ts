import type { PrismaClient, Prisma, Species, Creature, WildEncounter } from "@prisma/client";
import {
  applyTypeEffectiveness,
  attackForLevel,
  computeClickGain,
  computeOfflineGain,
  rollCapture,
  wildHpForTier,
  xpToNextLevel,
  BASE_CLICK_DAMAGE,
  XP_PER_VICTORY,
  type CreatureType,
  type AttackResponse,
  type BattleStateResponse,
  type CreatureView,
  type EvolutionEvent,
  type WildEncounterView,
} from "@farm-clicker/shared";

/** Accepts both a plain PrismaClient and an interactive $transaction callback client. */
type Db = PrismaClient | Prisma.TransactionClient;

const WILD_TIER_MIN = 1;
const WILD_TIER_MAX = 3;

async function pickRandomBaseSpecies(prisma: Db): Promise<Species> {
  const baseSpecies = await prisma.species.findMany({ where: { evolutionLevel: { not: null } } });
  return baseSpecies[Math.floor(Math.random() * baseSpecies.length)];
}

export async function createEncounterForUser(
  prisma: Db,
  userId: string,
): Promise<WildEncounter & { species: Species }> {
  const species = await pickRandomBaseSpecies(prisma);
  const tier = WILD_TIER_MIN + Math.floor(Math.random() * (WILD_TIER_MAX - WILD_TIER_MIN + 1));
  const maxHp = wildHpForTier(species.baseHp, tier);

  return prisma.wildEncounter.create({
    data: { userId, speciesId: species.id, currentHp: maxHp, maxHp },
    include: { species: true },
  });
}

async function getOrCreateEncounter(
  prisma: Db,
  userId: string,
): Promise<WildEncounter & { species: Species }> {
  const existing = await prisma.wildEncounter.findUnique({
    where: { userId },
    include: { species: true },
  });
  return existing ?? createEncounterForUser(prisma, userId);
}

function toEncounterView(encounter: WildEncounter & { species: Species }): WildEncounterView {
  return {
    speciesId: encounter.speciesId,
    speciesName: encounter.species.name,
    type: encounter.species.type as CreatureType,
    currentHp: encounter.currentHp,
    maxHp: encounter.maxHp,
  };
}

export function toCreatureView(creature: Creature & { species: Species }): CreatureView {
  const attack = attackForLevel(creature.species.baseAttack, creature.level);
  return {
    id: creature.id,
    speciesId: creature.speciesId,
    speciesName: creature.species.name,
    type: creature.species.type as CreatureType,
    level: creature.level,
    xp: creature.xp,
    xpToNextLevel: xpToNextLevel(creature.level),
    attack,
    canEvolveInto:
      creature.species.evolutionLevel !== null && creature.level >= creature.species.evolutionLevel
        ? creature.species.evolvesToId
        : null,
  };
}

/** Sum of all owned creatures' attack, type-adjusted against the current wild defender. */
async function computeTotalAutoAttack(
  prisma: Db,
  userId: string,
  defenderType: CreatureType,
): Promise<bigint> {
  const creatures = await prisma.creature.findMany({ where: { userId }, include: { species: true } });
  return creatures.reduce((total, creature) => {
    const attack = attackForLevel(creature.species.baseAttack, creature.level);
    return total + applyTypeEffectiveness(attack, creature.species.type as CreatureType, defenderType);
  }, 0n);
}

export async function getBattleState(prisma: PrismaClient, userId: string): Promise<BattleStateResponse> {
  const encounter = await getOrCreateEncounter(prisma, userId);
  const totalAutoAttack = await computeTotalAutoAttack(
    prisma,
    userId,
    encounter.species.type as CreatureType,
  );
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });

  return {
    currencyBalance: playerState.currencyBalance,
    totalAutoAttack,
    encounter: toEncounterView(encounter),
  };
}

/** Flat gold reward tied to the defeated species' base HP - simple, deterministic. */
function goldRewardFor(species: Species): bigint {
  return BigInt(species.baseHp);
}

export async function processAttack(prisma: PrismaClient, userId: string): Promise<AttackResponse> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<WildEncounter[]>`
      SELECT * FROM "WildEncounter" WHERE "userId" = ${userId} FOR UPDATE
    `;
    let encounterRow = rows[0];
    if (!encounterRow) {
      encounterRow = await createEncounterForUser(tx, userId);
    }

    const species = await tx.species.findUniqueOrThrow({ where: { id: encounterRow.speciesId } });
    const defenderType = species.type as CreatureType;
    const totalAutoAttack = await computeTotalAutoAttack(tx, userId, defenderType);

    const now = new Date();
    const { gained: idleDamage } = computeOfflineGain(totalAutoAttack, encounterRow.lastTickAt, now);
    const clickDamage = computeClickGain(BASE_CLICK_DAMAGE, totalAutoAttack);
    const damageDealt = idleDamage + clickDamage;
    const remainingHp = encounterRow.currentHp - damageDealt;

    if (remainingHp > 0n) {
      const updated = await tx.wildEncounter.update({
        where: { id: encounterRow.id },
        data: { currentHp: remainingHp, lastTickAt: now },
        include: { species: true },
      });
      return {
        damageDealt,
        encounter: toEncounterView(updated),
        defeated: false,
        captured: false,
        goldEarned: 0n,
        evolutions: [],
      };
    }

    // Defeated: grant gold, roll capture, distribute XP/evolutions, then spawn the next encounter.
    const goldEarned = goldRewardFor(species);
    const captured = rollCapture(Math.random());

    await tx.playerState.update({
      where: { userId },
      data: { currencyBalance: { increment: goldEarned } },
    });

    const ownedOfSpecies = await tx.creature.findMany({ where: { userId, speciesId: species.id } });
    if (captured && ownedOfSpecies.length === 0) {
      await tx.creature.create({ data: { userId, speciesId: species.id } });
    }

    const evolutions: EvolutionEvent[] = [];
    const ownedCreatures = await tx.creature.findMany({ where: { userId }, include: { species: true } });
    for (const creature of ownedCreatures) {
      const bonusForDuplicateCatch = captured && creature.speciesId === species.id ? XP_PER_VICTORY : 0n;
      let xp = creature.xp + XP_PER_VICTORY + bonusForDuplicateCatch;
      let level = creature.level;
      let currentSpecies = creature.species;

      while (xp >= xpToNextLevel(level)) {
        xp -= xpToNextLevel(level);
        level += 1;

        if (currentSpecies.evolutionLevel !== null && level >= currentSpecies.evolutionLevel && currentSpecies.evolvesToId) {
          const nextSpecies = await tx.species.findUniqueOrThrow({ where: { id: currentSpecies.evolvesToId } });
          evolutions.push({
            creatureId: creature.id,
            fromSpeciesName: currentSpecies.name,
            toSpeciesName: nextSpecies.name,
          });
          currentSpecies = nextSpecies;
        }
      }

      await tx.creature.update({
        where: { id: creature.id },
        data: { xp, level, speciesId: currentSpecies.id },
      });
    }

    const nextEncounterSpecies = await pickRandomBaseSpecies(tx);
    const tier = WILD_TIER_MIN + Math.floor(Math.random() * (WILD_TIER_MAX - WILD_TIER_MIN + 1));
    const maxHp = wildHpForTier(nextEncounterSpecies.baseHp, tier);
    const nextEncounter = await tx.wildEncounter.update({
      where: { id: encounterRow.id },
      data: { speciesId: nextEncounterSpecies.id, currentHp: maxHp, maxHp, lastTickAt: now },
      include: { species: true },
    });

    return {
      damageDealt,
      encounter: toEncounterView(nextEncounter),
      defeated: true,
      captured,
      goldEarned,
      evolutions,
    };
  });
}
