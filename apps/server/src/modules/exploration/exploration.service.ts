import type { PrismaClient, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import {
  CITY_MAPS,
  SPECIES_CATALOG,
  POKEBALL_CATALOG,
  MAX_TEAM_SIZE,
  SPECIALIZATION_POINTS_PER_CLEAR,
  nextComboStacks,
  comboMultiplier,
  typeMultiplier,
  computeAttackDamage,
  rollCapture,
  creatureMaxHp,
  creatureAttack,
  goldReward,
  xpReward,
  buildLeagueRoster,
  leagueRankBonusMultiplier,
  specializationBonusMultiplier,
  type EncounterTableEntry,
  type RouteHotspot,
  type DungeonHotspot,
  type ExplorationStateResponse,
  type AttackResponse,
  type CaptureResponse,
  type FinishEncounterResponse,
} from "@farm-clicker/shared";
import {
  lockPlayerState,
  lockActiveCreature,
  lockWildEncounter,
  buildCreatureView,
  buildEncounterView,
  applyXpGain,
} from "../../lib/battle-db.js";

export class RouteNotFoundError extends Error {}
export class NoActiveCreatureError extends Error {}
export class ActiveCreatureFaintedError extends Error {}
export class NoEncounterError extends Error {}
export class EncounterNotDefeatedError extends Error {}
export class InvalidPokeballError extends Error {}
export class InsufficientPokeballsError extends Error {}

/** All species keys, used to deterministically build a League trainer roster for a rank. */
export const ALL_SPECIES_KEYS = Object.keys(SPECIES_CATALOG);

function findEncounterHotspot(routeKey: string): RouteHotspot | DungeonHotspot | undefined {
  for (const city of Object.values(CITY_MAPS)) {
    for (const hotspot of city.hotspots) {
      if ((hotspot.kind === "route" || hotspot.kind === "dungeon") && hotspot.id === routeKey) {
        return hotspot;
      }
    }
  }
  return undefined;
}

function pickWeightedEntry(entries: EncounterTableEntry[], roll: number): EncounterTableEntry {
  const total = entries.reduce((sum, e) => sum + e.rarityWeight, 0);
  let cursor = roll * total;
  for (const entry of entries) {
    cursor -= entry.rarityWeight;
    if (cursor <= 0) return entry;
  }
  return entries[entries.length - 1];
}

function rollEncounterData(hotspot: RouteHotspot | DungeonHotspot, routeKey: string) {
  const entry = pickWeightedEntry(hotspot.encounterTable, Math.random());
  const level = entry.minLevel + Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1));
  const species = SPECIES_CATALOG[entry.speciesKey];
  const maxHp = creatureMaxHp(species.baseHp, level);
  return { routeKey, speciesKey: entry.speciesKey, level, currentHp: maxHp, maxHp };
}

/** Routes have infinite wild creatures — once a fight ends (finish/capture/flee) a new one
 * is rolled immediately on the same route instead of leaving the player with nothing to
 * fight. Only leaving the route entirely (back to the city map) ends the session. */
async function rerollOrClearEncounter(
  tx: Prisma.TransactionClient,
  userId: string,
  routeKey: string,
): Promise<void> {
  const hotspot = findEncounterHotspot(routeKey);
  if (hotspot && hotspot.encounterTable.length > 0) {
    await tx.wildEncounter.update({ where: { userId }, data: rollEncounterData(hotspot, routeKey) });
  } else {
    await tx.wildEncounter.delete({ where: { userId } });
  }
}

export async function buildExplorationState(
  prisma: PrismaClient,
  userId: string,
): Promise<ExplorationStateResponse> {
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });
  const activeCreature = await prisma.playerCreature.findFirst({ where: { userId, isActive: true } });
  const encounter = await prisma.wildEncounter.findUnique({ where: { userId } });

  return {
    goldBalance: playerState.goldBalance,
    activeCreature: activeCreature ? buildCreatureView(activeCreature) : null,
    encounter: encounter ? buildEncounterView(encounter) : null,
  };
}

export async function getExplorationState(prisma: PrismaClient, userId: string): Promise<ExplorationStateResponse> {
  return buildExplorationState(prisma, userId);
}

export async function enterRoute(
  prisma: PrismaClient,
  userId: string,
  routeKey: string,
): Promise<ExplorationStateResponse> {
  const hotspot = findEncounterHotspot(routeKey);
  if (!hotspot || hotspot.encounterTable.length === 0) throw new RouteNotFoundError();

  await prisma.$transaction(async (tx) => {
    await lockPlayerState(tx, userId);

    // An in-progress encounter (e.g. awaiting a team switch after a faint) always takes
    // precedence, even if nobody is currently active — that's exactly the state a player
    // needs to get back into to pick a replacement and keep fighting.
    const existingEncounter = await tx.wildEncounter.findUnique({ where: { userId } });
    if (existingEncounter) return;

    const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (!activeCreature) throw new NoActiveCreatureError();
    if (activeCreature.currentHp <= 0) throw new ActiveCreatureFaintedError();

    await tx.wildEncounter.create({ data: { userId, ...rollEncounterData(hotspot, routeKey) } });
  });

  return buildExplorationState(prisma, userId);
}

/** Advances a League run: either lines up the next trainer opponent, or — if the whole
 * roster is cleared — bumps rank (never resets) and grants specialization points. */
async function resolveLeagueVictory(
  tx: Prisma.TransactionClient,
  userId: string,
  encounter: { leagueOpponentIndex: number },
): Promise<{ cleared: boolean }> {
  const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
  const rank = progress?.rank ?? 0;
  const roster = buildLeagueRoster(rank, ALL_SPECIES_KEYS);
  const nextIndex = encounter.leagueOpponentIndex + 1;

  if (nextIndex >= roster.length) {
    await tx.playerLeagueProgress.upsert({
      where: { userId },
      update: { rank: rank + 1, unspentPoints: { increment: SPECIALIZATION_POINTS_PER_CLEAR } },
      create: { userId, rank: rank + 1, unspentPoints: SPECIALIZATION_POINTS_PER_CLEAR },
    });
    await tx.wildEncounter.delete({ where: { userId } });
    return { cleared: true };
  }

  const next = roster[nextIndex];
  const species = SPECIES_CATALOG[next.speciesKey];
  const maxHp = creatureMaxHp(species.baseHp, next.level);
  await tx.wildEncounter.update({
    where: { userId },
    data: { speciesKey: next.speciesKey, level: next.level, currentHp: maxHp, maxHp, leagueOpponentIndex: nextIndex },
  });
  return { cleared: false };
}

export async function attackEncounter(prisma: PrismaClient, userId: string): Promise<AttackResponse> {
  let damageDealt = 0;
  let damageTaken = 0;
  let victory = false;
  let fainted = false;
  let canSwitch = false;
  let leagueCleared = false;

  await prisma.$transaction(async (tx) => {
    const lockedState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    const activeCreature = await lockActiveCreature(tx, userId);
    if (!activeCreature) throw new NoActiveCreatureError();

    const now = new Date();
    const stacks = nextComboStacks(lockedState.comboStacks, lockedState.lastClickAt, now);
    const comboMult = comboMultiplier(stacks);

    const playerSpecies = SPECIES_CATALOG[activeCreature.speciesKey];
    const wildSpecies = SPECIES_CATALOG[encounter.speciesKey];

    // Permanent bonuses: League rank boosts every attack; specialization boosts attacks
    // from creatures whose type matches the invested type. Both apply everywhere, not
    // just in League fights, so clearing the League actually makes the player stronger.
    const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
    const specialization = await tx.playerSpecialization.findUnique({
      where: { userId_elementalType: { userId, elementalType: playerSpecies.elementalType } },
    });
    const bonusMultiplier = leagueRankBonusMultiplier(progress?.rank ?? 0).mul(
      specializationBonusMultiplier(specialization?.pointsInvested ?? 0),
    );

    const playerAttack = creatureAttack(playerSpecies.baseAttack, activeCreature.level);
    damageDealt = computeAttackDamage(
      playerAttack,
      comboMult.mul(bonusMultiplier),
      typeMultiplier(playerSpecies.elementalType, wildSpecies.elementalType),
    );
    const wildHpAfter = Math.max(0, encounter.currentHp - damageDealt);

    await tx.playerState.update({ where: { userId }, data: { comboStacks: stacks, lastClickAt: now } });

    if (wildHpAfter <= 0) {
      victory = true;
      if (encounter.isLeagueBattle) {
        const result = await resolveLeagueVictory(tx, userId, encounter);
        leagueCleared = result.cleared;
      } else {
        await tx.wildEncounter.update({ where: { userId }, data: { currentHp: 0 } });
      }
      return;
    }

    const wildAttack = creatureAttack(wildSpecies.baseAttack, encounter.level);
    damageTaken = computeAttackDamage(
      wildAttack,
      new Decimal(1),
      typeMultiplier(wildSpecies.elementalType, playerSpecies.elementalType),
    );
    const playerHpAfter = Math.max(0, activeCreature.currentHp - damageTaken);
    fainted = playerHpAfter <= 0;

    await tx.playerCreature.update({
      where: { id: activeCreature.id },
      data: { currentHp: playerHpAfter, isActive: fainted ? false : true },
    });

    if (!fainted) {
      await tx.wildEncounter.update({ where: { userId }, data: { currentHp: wildHpAfter } });
      return;
    }

    const healthyTeammates = await tx.playerCreature.count({
      where: { userId, isOnTeam: true, currentHp: { gt: 0 }, id: { not: activeCreature.id } },
    });
    canSwitch = healthyTeammates > 0;

    if (canSwitch) {
      await tx.wildEncounter.update({ where: { userId }, data: { currentHp: wildHpAfter } });
    } else {
      await tx.wildEncounter.delete({ where: { userId } });
    }
  });

  const state = await buildExplorationState(prisma, userId);
  return { state, damageDealt, damageTaken, victory, fainted, canSwitch, leagueCleared };
}

export async function captureEncounter(
  prisma: PrismaClient,
  userId: string,
  pokeballKey: string,
): Promise<CaptureResponse> {
  const pokeball = POKEBALL_CATALOG[pokeballKey];
  if (!pokeball) throw new InvalidPokeballError();

  let success = false;
  let createdCreatureId: string | null = null;
  let xpGained = 0;
  let leveledUp = false;

  await prisma.$transaction(async (tx) => {
    await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    if (encounter.currentHp > 0) throw new EncounterNotDefeatedError();

    const inventory = await tx.playerInventoryItem.findUnique({
      where: { userId_itemKey: { userId, itemKey: pokeballKey } },
    });
    if (!inventory || inventory.quantity < 1) throw new InsufficientPokeballsError();

    await tx.playerInventoryItem.update({
      where: { userId_itemKey: { userId, itemKey: pokeballKey } },
      data: { quantity: { decrement: 1 } },
    });

    const species = SPECIES_CATALOG[encounter.speciesKey];
    success = rollCapture(Math.random(), species.baseCaptureRate, pokeball.catchMultiplier, 0);

    if (success) {
      const teamCount = await tx.playerCreature.count({ where: { userId, isOnTeam: true } });
      const created = await tx.playerCreature.create({
        data: {
          userId,
          speciesKey: encounter.speciesKey,
          level: encounter.level,
          currentHp: creatureMaxHp(species.baseHp, encounter.level),
          isOnTeam: teamCount < MAX_TEAM_SIZE,
        },
      });
      createdCreatureId = created.id;

      const goldGained = goldReward(encounter.level) / 2n;
      xpGained = Math.floor(xpReward(encounter.level) / 2);
      const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
      if (activeCreature) {
        const xpResult = await applyXpGain(tx, activeCreature, xpGained);
        leveledUp = xpResult.leveledUp;
      }
      await tx.playerState.update({ where: { userId }, data: { goldBalance: { increment: goldGained } } });

      await rerollOrClearEncounter(tx, userId, encounter.routeKey);
    }
  });

  const state = await buildExplorationState(prisma, userId);
  const creature = createdCreatureId
    ? buildCreatureView((await prisma.playerCreature.findUniqueOrThrow({ where: { id: createdCreatureId } })))
    : null;
  return { success, state, creature, xpGained, leveledUp };
}

export async function finishEncounter(prisma: PrismaClient, userId: string): Promise<FinishEncounterResponse> {
  let goldGained = 0n;
  let xpGained = 0;
  let leveledUp = false;

  await prisma.$transaction(async (tx) => {
    const playerState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    if (encounter.currentHp > 0) throw new EncounterNotDefeatedError();

    goldGained = goldReward(encounter.level);
    xpGained = xpReward(encounter.level);

    const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (activeCreature) {
      const xpResult = await applyXpGain(tx, activeCreature, xpGained);
      leveledUp = xpResult.leveledUp;
    }

    await tx.playerState.update({
      where: { userId },
      data: { goldBalance: playerState.goldBalance + goldGained },
    });
    await rerollOrClearEncounter(tx, userId, encounter.routeKey);
  });

  const state = await buildExplorationState(prisma, userId);
  return { state, goldGained, xpGained, leveledUp };
}

export async function fleeEncounter(prisma: PrismaClient, userId: string): Promise<ExplorationStateResponse> {
  await prisma.$transaction(async (tx) => {
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    await rerollOrClearEncounter(tx, userId, encounter.routeKey);
  });

  return buildExplorationState(prisma, userId);
}

/** Heals the player's whole team, not just whoever's active — mirrors a real Pokémon
 * Center. This also has to work when nobody is active (e.g. the last fight ended with
 * the active Pokémon fainting and no switch has happened yet), which "heal the active
 * one" could never handle. */
export async function healTeam(prisma: PrismaClient, userId: string) {
  await prisma.$transaction(async (tx) => {
    const team = await tx.playerCreature.findMany({ where: { userId, isOnTeam: true } });
    for (const member of team) {
      const species = SPECIES_CATALOG[member.speciesKey];
      await tx.playerCreature.update({
        where: { id: member.id },
        data: { currentHp: creatureMaxHp(species.baseHp, member.level) },
      });
    }
  });

  return buildExplorationState(prisma, userId);
}
