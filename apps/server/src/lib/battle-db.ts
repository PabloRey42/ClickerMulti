import type { Prisma, PlayerState, PlayerCreature, WildEncounter, PlayerInventoryItem } from "@prisma/client";
import {
  SPECIES_CATALOG,
  MAX_LEVEL,
  MAX_SAME_SPECIES_OWNED,
  MAX_SHINY_SAME_SPECIES_OWNED,
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

/** Compacts the current team's teamSlot values to a contiguous 0..n-1 sequence (by existing
 * teamSlot, falling back to caughtAt for members that never had one — e.g. just added via a
 * capture/gift create call that didn't set it). Safe to call after any team-membership change:
 * a fresh capture auto-added to the team, or a removal that would otherwise leave a gap a
 * later addition could collide with (two members ending up with the same teamSlot). Doesn't
 * touch isActive — only the explicit drag-and-drop reorder (reorderTeam) decides who's active. */
export async function renumberTeamSlots(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const team = await tx.playerCreature.findMany({
    where: { userId, isOnTeam: true },
    orderBy: [{ teamSlot: "asc" }, { caughtAt: "asc" }],
  });
  await Promise.all(
    team.map((member, index) =>
      member.teamSlot === index
        ? Promise.resolve()
        : tx.playerCreature.update({ where: { id: member.id }, data: { teamSlot: index } }),
    ),
  );
}

/** Enforces the game's rule that the active creature is ALWAYS the topmost living team member
 * (top of the drag-and-drop sidebar = active — see creatures.service.ts's reorderTeam). Makes
 * that creature the sole `isActive` one, clearing any stale flag. If the whole team is fainted,
 * the topmost team member (any HP) is kept active so the player never lands in a "no active
 * creature" dead end while they still own a team — they just get told to heal. Returns whether a
 * *living* replacement exists (used to decide "keep fighting" vs "team wiped"). */
export async function resolveActiveCreature(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<{ hasLiving: boolean }> {
  const living = await tx.playerCreature.findFirst({
    where: { userId, isOnTeam: true, currentHp: { gt: 0 } },
    orderBy: [{ teamSlot: "asc" }, { caughtAt: "asc" }],
  });
  const active =
    living ??
    (await tx.playerCreature.findFirst({
      where: { userId, isOnTeam: true },
      orderBy: [{ teamSlot: "asc" }, { caughtAt: "asc" }],
    }));

  await tx.playerCreature.updateMany({
    where: { userId, isActive: true, ...(active ? { id: { not: active.id } } : {}) },
    data: { isActive: false },
  });
  if (active && !active.isActive) {
    await tx.playerCreature.update({ where: { id: active.id }, data: { isActive: true } });
  }
  return { hasLiving: living !== null };
}

/** Enforces the per-species ownership cap — MAX_SAME_SPECIES_OWNED non-shiny, plus
 * MAX_SHINY_SAME_SPECIES_OWNED shiny counted separately — by keeping only the highest-level
 * copies of each species and deleting the rest ("si on a plus que la limite, garde uniquement
 * les plus hauts niveaux"). Needed because the cap isn't enforced on evolution (a creature can
 * evolve into a species you already own the max of) and older saves predate it, so this
 * reconciles the collection on read. A creature currently listed on the market is never deleted
 * (that would null its listing) — it's tolerated as temporary overflow until the listing
 * resolves. Returns whether anything was deleted (so the caller can fix up team slots/active). */
export async function enforceSpeciesCaps(tx: Prisma.TransactionClient, userId: string): Promise<boolean> {
  const all = await tx.playerCreature.findMany({ where: { userId } });

  const groups = new Map<string, PlayerCreature[]>();
  for (const c of all) {
    const key = `${c.speciesKey}|${c.isShiny}`;
    const arr = groups.get(key);
    if (arr) arr.push(c);
    else groups.set(key, [c]);
  }

  const excessIds: string[] = [];
  for (const members of groups.values()) {
    const cap = members[0].isShiny ? MAX_SHINY_SAME_SPECIES_OWNED : MAX_SAME_SPECIES_OWNED;
    if (members.length <= cap) continue;
    // Rank best-first: highest level, then keep the active/team ones on ties, then most XP, then
    // oldest. Everything past the cap gets pruned.
    const ranked = [...members].sort(
      (a, b) =>
        b.level - a.level ||
        Number(b.isActive) - Number(a.isActive) ||
        Number(b.isOnTeam) - Number(a.isOnTeam) ||
        b.xp - a.xp ||
        a.caughtAt.getTime() - b.caughtAt.getTime(),
    );
    for (const c of ranked.slice(cap)) excessIds.push(c.id);
  }
  if (excessIds.length === 0) return false;

  // Never delete a creature that's actively listed for sale — that would null the listing.
  const listed = await tx.marketListing.findMany({
    where: { creatureId: { in: excessIds }, status: "ACTIVE" },
    select: { creatureId: true },
  });
  const listedIds = new Set(listed.map((l) => l.creatureId));
  const deletable = excessIds.filter((id) => !listedIds.has(id));
  if (deletable.length === 0) return false;

  await tx.playerCreature.deleteMany({ where: { id: { in: deletable } } });
  return true;
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
