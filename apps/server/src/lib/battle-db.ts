import type { Prisma, PlayerState, PlayerCreature, WildEncounter } from "@prisma/client";
import {
  SPECIES_CATALOG,
  creatureMaxHp,
  creatureAttack,
  xpToNextLevel,
  type PlayerCreatureView,
  type WildEncounterView,
} from "@farm-clicker/shared";

/** Row-locks PlayerState so concurrent battle actions from the same user can't race. */
export async function lockPlayerState(tx: Prisma.TransactionClient, userId: string): Promise<PlayerState> {
  const rows = await tx.$queryRaw<PlayerState[]>`
    SELECT * FROM "PlayerState" WHERE "userId" = ${userId} FOR UPDATE
  `;
  return rows[0];
}

export async function lockActiveCreature(tx: Prisma.TransactionClient, userId: string): Promise<PlayerCreature | null> {
  const rows = await tx.$queryRaw<PlayerCreature[]>`
    SELECT * FROM "PlayerCreature" WHERE "userId" = ${userId} AND "isActive" = true FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function lockWildEncounter(tx: Prisma.TransactionClient, userId: string): Promise<WildEncounter | null> {
  const rows = await tx.$queryRaw<WildEncounter[]>`
    SELECT * FROM "WildEncounter" WHERE "userId" = ${userId} FOR UPDATE
  `;
  return rows[0] ?? null;
}

export function buildCreatureView(creature: PlayerCreature): PlayerCreatureView {
  const species = SPECIES_CATALOG[creature.speciesKey];
  return {
    id: creature.id,
    speciesKey: creature.speciesKey,
    name: species.name,
    dexNumber: species.dexNumber,
    types: species.types,
    spriteFile: species.spriteFile,
    nickname: creature.nickname,
    level: creature.level,
    xp: creature.xp,
    xpToNextLevel: xpToNextLevel(creature.level),
    currentHp: creature.currentHp,
    maxHp: creatureMaxHp(species.baseHp, creature.level),
    attack: creatureAttack(species.baseAttack, creature.level),
    isOnTeam: creature.isOnTeam,
    isActive: creature.isActive,
    caughtAt: creature.caughtAt.toISOString(),
  };
}

export function buildEncounterView(encounter: WildEncounter): WildEncounterView {
  const species = SPECIES_CATALOG[encounter.speciesKey];
  return {
    routeKey: encounter.routeKey,
    speciesKey: encounter.speciesKey,
    name: species.name,
    types: species.types,
    spriteFile: species.spriteFile,
    level: encounter.level,
    currentHp: encounter.currentHp,
    maxHp: encounter.maxHp,
    isLeagueBattle: encounter.isLeagueBattle,
  };
}

/** Applies XP to a creature, rolling level-ups (and a full heal on each level gained). */
export async function applyXpGain(
  tx: Prisma.TransactionClient,
  creature: PlayerCreature,
  xpGained: number,
): Promise<{ leveledUp: boolean }> {
  let xp = creature.xp + xpGained;
  let level = creature.level;
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }

  const leveledUp = level > creature.level;
  const species = SPECIES_CATALOG[creature.speciesKey];
  const currentHp = leveledUp ? creatureMaxHp(species.baseHp, level) : creature.currentHp;

  await tx.playerCreature.update({ where: { id: creature.id }, data: { xp, level, currentHp } });
  return { leveledUp };
}
