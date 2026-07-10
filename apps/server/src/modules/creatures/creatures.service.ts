import type { PrismaClient } from "@prisma/client";
import {
  SPECIES_CATALOG,
  STARTER_SPECIES_KEYS,
  MAX_TEAM_SIZE,
  MAX_SAME_SPECIES_OWNED,
  MAX_SHINY_SAME_SPECIES_OWNED,
  STONE_CATALOG,
  creatureMaxHp,
  resolveStoneEvolution,
  type PlayerCreatureView,
  type SpeciesView,
  type UseStoneResponse,
} from "@farm-clicker/shared";
import {
  buildCreatureView,
  applyPendingEvolution,
  lockInventoryItem,
  renumberTeamSlots,
  enforceSpeciesCaps,
  resolveActiveCreature,
  ackEvolutionReveal as ackEvolutionRevealTx,
} from "../../lib/battle-db.js";
import { bumpQuestObjective } from "../quests/quests.service.js";

export class CreatureNotFoundError extends Error {}
export class CreatureFaintedError extends Error {}
export class CreatureNotOnTeamError extends Error {}
export class TeamFullError extends Error {}
export class InvalidStarterError extends Error {}
export class StarterAlreadyChosenError extends Error {}
export class InvalidStoneError extends Error {}
export class NoStoneEvolutionError extends Error {}
export class InsufficientStonesError extends Error {}
export class DuplicateSpeciesLimitError extends Error {}
export class InvalidTeamOrderError extends Error {}

export function getStarterOptions(): SpeciesView[] {
  return STARTER_SPECIES_KEYS.map((key) => {
    const species = SPECIES_CATALOG[key];
    return {
      key: species.key,
      name: species.name,
      dexNumber: species.dexNumber,
      types: species.types,
      baseAttack: species.baseAttack,
      baseHp: species.baseHp,
      spriteFile: species.spriteFile,
    };
  });
}

export async function chooseStarter(
  prisma: PrismaClient,
  userId: string,
  speciesKey: string,
): Promise<PlayerCreatureView> {
  if (!(STARTER_SPECIES_KEYS as readonly string[]).includes(speciesKey)) throw new InvalidStarterError();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.playerCreature.findFirst({ where: { userId } });
    if (existing) throw new StarterAlreadyChosenError();

    const species = SPECIES_CATALOG[speciesKey];
    const created = await tx.playerCreature.create({
      data: {
        userId,
        speciesKey,
        currentHp: creatureMaxHp(species.baseHp, 1),
        isOnTeam: true,
        isActive: true,
        teamSlot: 0,
      },
    });
    return buildCreatureView(created);
  });
}

export async function listCreatures(prisma: PrismaClient, userId: string): Promise<PlayerCreatureView[]> {
  await bumpQuestObjective(prisma, userId, "open_collection");

  const creatures = await prisma.$transaction(async (tx) => {
    // Reconcile the per-species ownership cap (2 non-shiny + 1 shiny), keeping only the
    // highest-level copies — evolutions and older saves can leave a species over the cap. Done
    // before the listing so pruned creatures never show up. If anything was removed, compact
    // the team and re-resolve the active creature (the deleted one may have been on the team /
    // active).
    if (await enforceSpeciesCaps(tx, userId)) {
      await renumberTeamSlots(tx, userId);
      await resolveActiveCreature(tx, userId);
    }

    let rows = await tx.playerCreature.findMany({
      where: { userId },
      orderBy: [{ teamSlot: "asc" }, { caughtAt: "asc" }],
    });

    // Retroactively catches up any creature whose level already qualifies for an evolution it
    // never went through (e.g. it reached that level before this feature shipped, or before its
    // species' evolution was added to the catalog) — see applyPendingEvolution's doc comment.
    // Cheap no-op for the common case. This can itself push a species over the cap (evolving
    // into one already at the limit), so re-run enforceSpeciesCaps afterward and re-fetch if
    // anything evolved — otherwise a stale catch-up here would silently leave the player owning
    // more than the cap until some *other* action happened to trigger reconciliation.
    let evolvedAny = false;
    for (const creature of rows) {
      const { evolution } = await applyPendingEvolution(tx, creature);
      if (evolution.length > 0) evolvedAny = true;
    }

    if (evolvedAny) {
      if (await enforceSpeciesCaps(tx, userId)) {
        await renumberTeamSlots(tx, userId);
        await resolveActiveCreature(tx, userId);
      }
      rows = await tx.playerCreature.findMany({
        where: { userId },
        orderBy: [{ teamSlot: "asc" }, { caughtAt: "asc" }],
      });
    }

    return rows;
  });

  // buildCreatureView derives evolvedNow from the durable pendingEvolutionFrom column (not from
  // applyPendingEvolution's own per-call result), so the reveal keeps surfacing on every fetch
  // until the client acks it.
  return creatures.map(buildCreatureView);
}

export async function activateCreature(
  prisma: PrismaClient,
  userId: string,
  creatureId: string,
): Promise<PlayerCreatureView> {
  return prisma.$transaction(async (tx) => {
    const target = await tx.playerCreature.findFirst({ where: { id: creatureId, userId } });
    if (!target) throw new CreatureNotFoundError();
    if (!target.isOnTeam) throw new CreatureNotOnTeamError();
    if (target.currentHp <= 0) throw new CreatureFaintedError();

    await tx.playerCreature.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
    const updated = await tx.playerCreature.update({ where: { id: creatureId }, data: { isActive: true } });
    return buildCreatureView(updated);
  });
}

/** Adds/removes a creature from the player's team (max MAX_TEAM_SIZE). Removing the
 * active creature auto-promotes another healthy teammate, if any, to active. */
export async function setTeamMembership(
  prisma: PrismaClient,
  userId: string,
  creatureId: string,
  onTeam: boolean,
): Promise<PlayerCreatureView[]> {
  await prisma.$transaction(async (tx) => {
    const target = await tx.playerCreature.findFirst({ where: { id: creatureId, userId } });
    if (!target) throw new CreatureNotFoundError();

    if (onTeam && !target.isOnTeam) {
      const teamCount = await tx.playerCreature.count({ where: { userId, isOnTeam: true } });
      if (teamCount >= MAX_TEAM_SIZE) throw new TeamFullError();
      await tx.playerCreature.update({ where: { id: creatureId }, data: { isOnTeam: true, teamSlot: teamCount } });
      return;
    }

    if (!onTeam && target.isOnTeam) {
      await tx.playerCreature.update({
        where: { id: creatureId },
        data: { isOnTeam: false, isActive: false, teamSlot: null },
      });

      if (target.isActive) {
        // Promote the topmost living teammate (top of the sidebar = active), not an arbitrary one.
        const replacement = await tx.playerCreature.findFirst({
          where: { userId, isOnTeam: true, currentHp: { gt: 0 }, id: { not: creatureId } },
          orderBy: [{ teamSlot: "asc" }, { caughtAt: "asc" }],
        });
        if (replacement) {
          await tx.playerCreature.update({ where: { id: replacement.id }, data: { isActive: true } });
        }
      }

      await renumberTeamSlots(tx, userId);
    }
  });

  return listCreatures(prisma, userId);
}

/** Removes every creature from the team except the active one — a player must always
 * have an active creature to battle, so it's kept on the team rather than cleared too. */
export async function clearTeamExceptActive(prisma: PrismaClient, userId: string): Promise<PlayerCreatureView[]> {
  await prisma.$transaction(async (tx) => {
    let active = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (!active) {
      const fallback = await tx.playerCreature.findFirst({
        where: { userId, isOnTeam: true },
        orderBy: { caughtAt: "asc" },
      });
      if (!fallback) return;
      active = await tx.playerCreature.update({ where: { id: fallback.id }, data: { isActive: true } });
    }

    await tx.playerCreature.updateMany({
      where: { userId, isOnTeam: true, id: { not: active.id } },
      data: { isOnTeam: false, isActive: false, teamSlot: null },
    });
    await tx.playerCreature.update({ where: { id: active.id }, data: { teamSlot: 0 } });
  });

  return listCreatures(prisma, userId);
}

/** Persists a client-driven drag-and-drop reorder of the team sidebar. Whoever ends up on
 * top (index 0) becomes the active creature — that's the sidebar's whole rule, so this is
 * now the only way to change who's active outside of a mid-battle switch (activateCreature),
 * which intentionally doesn't touch team order. */
export async function reorderTeam(
  prisma: PrismaClient,
  userId: string,
  orderedCreatureIds: string[],
): Promise<PlayerCreatureView[]> {
  await prisma.$transaction(async (tx) => {
    const team = await tx.playerCreature.findMany({ where: { userId, isOnTeam: true } });
    const teamIds = new Set(team.map((c) => c.id));
    const uniqueOrderedIds = new Set(orderedCreatureIds);
    if (
      orderedCreatureIds.length !== team.length ||
      uniqueOrderedIds.size !== team.length ||
      orderedCreatureIds.some((id) => !teamIds.has(id))
    ) {
      throw new InvalidTeamOrderError();
    }

    await Promise.all(
      orderedCreatureIds.map((id, index) =>
        tx.playerCreature.update({ where: { id }, data: { teamSlot: index, isActive: index === 0 } }),
      ),
    );
  });

  return listCreatures(prisma, userId);
}

/** Player-initiated evolution via a shop-bought stone — the counterpart to the automatic
 * level-based system in battle-db.ts's applyXpGain, for the species that have no real level
 * to auto-evolve at (Vulpix, Eevee, Poliwhirl, Gloom...). Consumes one stone from inventory
 * and evolves the target creature in the same transaction; both row-locked first (inventory
 * via lockInventoryItem, same FOR UPDATE idiom as lockPlayerState/lockActiveCreature) so a
 * double-click can't spend the same last stone twice. */
export async function useEvolutionStone(
  prisma: PrismaClient,
  userId: string,
  creatureId: string,
  stoneKey: string,
): Promise<UseStoneResponse> {
  if (!STONE_CATALOG[stoneKey]) throw new InvalidStoneError();

  return prisma.$transaction(async (tx) => {
    const creature = await tx.playerCreature.findFirst({ where: { id: creatureId, userId } });
    if (!creature) throw new CreatureNotFoundError();

    const targetKey = resolveStoneEvolution(creature.speciesKey, stoneKey);
    if (!targetKey) throw new NoStoneEvolutionError();

    // A stone evolution is a deliberate, player-chosen action (unlike passive level-up
    // evolution — see applyXpGain's doc comment) — reject it up front instead of silently
    // evolving and then having enforceSpeciesCaps delete some other creature to compensate.
    const speciesCap = creature.isShiny ? MAX_SHINY_SAME_SPECIES_OWNED : MAX_SAME_SPECIES_OWNED;
    const ownedCount = await tx.playerCreature.count({
      where: { userId, speciesKey: targetKey, isShiny: creature.isShiny, id: { not: creature.id } },
    });
    if (ownedCount >= speciesCap) throw new DuplicateSpeciesLimitError();

    const inventory = await lockInventoryItem(tx, userId, stoneKey);
    if (!inventory || inventory.quantity < 1) throw new InsufficientStonesError();

    await tx.playerInventoryItem.update({
      where: { userId_itemKey: { userId, itemKey: stoneKey } },
      data: { quantity: { decrement: 1 } },
    });

    const targetSpecies = SPECIES_CATALOG[targetKey];
    const updated = await tx.playerCreature.update({
      where: { id: creature.id },
      data: { speciesKey: targetKey, currentHp: creatureMaxHp(targetSpecies.baseHp, creature.level) },
    });

    return {
      creature: buildCreatureView(updated),
      evolution: [{ fromSpeciesKey: creature.speciesKey, toSpeciesKey: targetKey }],
    };
  });
}

/** Called by the client once it has actually displayed a retroactive evolution reveal
 * (queued from `listCreatures`'s `evolvedNow`) — clears `pendingEvolutionFrom` so it stops
 * being reported on future fetches. Silently no-ops on an unknown/already-cleared creature
 * id rather than erroring — the client fires this best-effort right after the animation, and
 * there's nothing meaningful to recover from if it's already gone. */
export async function ackEvolutionReveal(prisma: PrismaClient, userId: string, creatureId: string): Promise<void> {
  await ackEvolutionRevealTx(prisma, userId, creatureId);
}
