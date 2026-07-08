import type { Prisma, PlayerState, PlayerCreature, WildEncounter, PlayerInventoryItem } from "@prisma/client";
import {
  SPECIES_CATALOG,
  MAX_LEVEL,
  creatureMaxHp,
  creatureAttack,
  xpToNextLevel,
  resolveEvolutionSteps,
  type PlayerCreatureView,
  type WildEncounterView,
  type EvolutionStep,
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

export async function lockInventoryItem(
  tx: Prisma.TransactionClient,
  userId: string,
  itemKey: string,
): Promise<PlayerInventoryItem | null> {
  const rows = await tx.$queryRaw<PlayerInventoryItem[]>`
    SELECT * FROM "PlayerInventoryItem" WHERE "userId" = ${userId} AND "itemKey" = ${itemKey} FOR UPDATE
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
    isShiny: creature.isShiny,
    caughtAt: creature.caughtAt.toISOString(),
    // Derived from the durable pendingEvolutionFrom column (not a per-call result) so a
    // reveal the client hasn't acknowledged yet (POST /creatures/:id/ack-evolution) keeps
    // showing up on every fetch — including ones from a different tab or a later session —
    // until it's actually been shown. See the column's doc comment in schema.prisma.
    evolvedNow: creature.pendingEvolutionFrom
      ? [{ fromSpeciesKey: creature.pendingEvolutionFrom, toSpeciesKey: creature.speciesKey }]
      : [],
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
    isShiny: encounter.isShiny,
    isLeagueBattle: encounter.isLeagueBattle,
    startedAt: encounter.startedAt.toISOString(),
  };
}

/** Applies XP to a creature, rolling level-ups (and a full heal on each level gained), and
 * evolves it (speciesKey change) as soon as the new level crosses its species' evolution
 * threshold — a multi-level jump in one XP grant can cross more than one threshold in a row
 * (`resolveEvolutionSteps` walks the whole chain), so the client gets every step to animate
 * in sequence. Level never goes past MAX_LEVEL — once there, further XP is simply discarded. */
export async function applyXpGain(
  tx: Prisma.TransactionClient,
  creature: PlayerCreature,
  xpGained: number,
): Promise<{ leveledUp: boolean; evolution: EvolutionStep[] }> {
  let xp = creature.xp + xpGained;
  let level = creature.level;
  while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp = 0;
  }

  const leveledUp = level > creature.level;
  const evolution = leveledUp ? resolveEvolutionSteps(creature.speciesKey, level) : [];
  const speciesKey = evolution.length > 0 ? evolution[evolution.length - 1].toSpeciesKey : creature.speciesKey;
  const finalSpecies = SPECIES_CATALOG[speciesKey];
  const currentHp = leveledUp ? creatureMaxHp(finalSpecies.baseHp, level) : creature.currentHp;

  await tx.playerCreature.update({ where: { id: creature.id }, data: { xp, level, currentHp, speciesKey } });
  return { leveledUp, evolution };
}

/** Catches a creature up to whatever evolution its *current* level already qualifies for —
 * covers creatures that reached a level before this feature existed (or before their
 * species' evolution level was added), so a player logging back in still sees them evolve
 * instead of silently sitting on an outdated speciesKey forever. No-op (no write) once a
 * creature is already at the right speciesKey for its level — safe to call on every fetch.
 *
 * Sets `pendingEvolutionFrom` to the creature's original (pre-catch-up) speciesKey rather
 * than clearing it here — this mutation only needs to run once (the DB is now correct), but
 * the *reveal* still needs to survive until the client actually shows it (see
 * `buildCreatureView`/ack-evolution). Preserves an already-set `pendingEvolutionFrom` instead
 * of overwriting it, in the unlikely case this ever needed to run twice before being acked. */
export async function applyPendingEvolution(
  tx: Prisma.TransactionClient,
  creature: PlayerCreature,
): Promise<{ creature: PlayerCreature; evolution: EvolutionStep[] }> {
  const evolution = resolveEvolutionSteps(creature.speciesKey, creature.level);
  if (evolution.length === 0) return { creature, evolution };

  const speciesKey = evolution[evolution.length - 1].toSpeciesKey;
  const finalSpecies = SPECIES_CATALOG[speciesKey];
  const updated = await tx.playerCreature.update({
    where: { id: creature.id },
    data: {
      speciesKey,
      currentHp: creatureMaxHp(finalSpecies.baseHp, creature.level),
      pendingEvolutionFrom: creature.pendingEvolutionFrom ?? creature.speciesKey,
    },
  });
  return { creature: updated, evolution };
}

/** Clears the durable reveal flag once the client has actually shown the animation for it. */
export async function ackEvolutionReveal(tx: Prisma.TransactionClient, userId: string, creatureId: string) {
  await tx.playerCreature.updateMany({
    where: { id: creatureId, userId },
    data: { pendingEvolutionFrom: null },
  });
}
