import type { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";
import {
  CITY_MAPS,
  SPECIES_CATALOG,
  POKEBALL_CATALOG,
  nextComboStacks,
  comboMultiplier,
  typeMultiplier,
  computeAttackDamage,
  rollCapture,
  creatureMaxHp,
  creatureAttack,
  goldReward,
  xpReward,
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

async function buildExplorationState(
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
    const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (!activeCreature) throw new NoActiveCreatureError();
    if (activeCreature.currentHp <= 0) throw new ActiveCreatureFaintedError();

    const existingEncounter = await tx.wildEncounter.findUnique({ where: { userId } });
    if (existingEncounter) return;

    const entry = pickWeightedEntry(hotspot.encounterTable, Math.random());
    const level = entry.minLevel + Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1));
    const species = SPECIES_CATALOG[entry.speciesKey];
    const maxHp = creatureMaxHp(species.baseHp, level);

    await tx.wildEncounter.create({
      data: { userId, routeKey, speciesKey: entry.speciesKey, level, currentHp: maxHp, maxHp },
    });
  });

  return buildExplorationState(prisma, userId);
}

export async function attackEncounter(prisma: PrismaClient, userId: string): Promise<AttackResponse> {
  let damageDealt = 0;
  let damageTaken = 0;
  let victory = false;
  let fainted = false;

  await prisma.$transaction(async (tx) => {
    const lockedState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    const activeCreature = await lockActiveCreature(tx, userId);
    if (!activeCreature) throw new NoActiveCreatureError();

    const now = new Date();
    const stacks = nextComboStacks(lockedState.comboStacks, lockedState.lastClickAt, now);
    const multiplier = comboMultiplier(stacks);

    const playerSpecies = SPECIES_CATALOG[activeCreature.speciesKey];
    const wildSpecies = SPECIES_CATALOG[encounter.speciesKey];

    const playerAttack = creatureAttack(playerSpecies.baseAttack, activeCreature.level);
    damageDealt = computeAttackDamage(
      playerAttack,
      multiplier,
      typeMultiplier(playerSpecies.elementalType, wildSpecies.elementalType),
    );
    const wildHpAfter = Math.max(0, encounter.currentHp - damageDealt);

    await tx.playerState.update({ where: { userId }, data: { comboStacks: stacks, lastClickAt: now } });

    if (wildHpAfter <= 0) {
      victory = true;
      await tx.wildEncounter.update({ where: { userId }, data: { currentHp: 0 } });
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

    await tx.playerCreature.update({ where: { id: activeCreature.id }, data: { currentHp: playerHpAfter } });
    if (fainted) {
      await tx.wildEncounter.delete({ where: { userId } });
    } else {
      await tx.wildEncounter.update({ where: { userId }, data: { currentHp: wildHpAfter } });
    }
  });

  const state = await buildExplorationState(prisma, userId);
  return { state, damageDealt, damageTaken, victory, fainted };
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
      const created = await tx.playerCreature.create({
        data: {
          userId,
          speciesKey: encounter.speciesKey,
          level: encounter.level,
          currentHp: creatureMaxHp(species.baseHp, encounter.level),
        },
      });
      createdCreatureId = created.id;

      const goldGained = goldReward(encounter.level) / 2n;
      const xpGained = Math.floor(xpReward(encounter.level) / 2);
      const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
      if (activeCreature) await applyXpGain(tx, activeCreature, xpGained);
      await tx.playerState.update({ where: { userId }, data: { goldBalance: { increment: goldGained } } });

      await tx.wildEncounter.delete({ where: { userId } });
    }
  });

  const state = await buildExplorationState(prisma, userId);
  const creature = createdCreatureId
    ? buildCreatureView((await prisma.playerCreature.findUniqueOrThrow({ where: { id: createdCreatureId } })))
    : null;
  return { success, state, creature };
}

export async function finishEncounter(prisma: PrismaClient, userId: string): Promise<FinishEncounterResponse> {
  let goldGained = 0n;
  let xpGained = 0;

  await prisma.$transaction(async (tx) => {
    const playerState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    if (encounter.currentHp > 0) throw new EncounterNotDefeatedError();

    goldGained = goldReward(encounter.level);
    xpGained = xpReward(encounter.level);

    const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (activeCreature) await applyXpGain(tx, activeCreature, xpGained);

    await tx.playerState.update({
      where: { userId },
      data: { goldBalance: playerState.goldBalance + goldGained },
    });
    await tx.wildEncounter.delete({ where: { userId } });
  });

  const state = await buildExplorationState(prisma, userId);
  return { state, goldGained, xpGained };
}

export async function fleeEncounter(prisma: PrismaClient, userId: string): Promise<ExplorationStateResponse> {
  await prisma.$transaction(async (tx) => {
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    await tx.wildEncounter.delete({ where: { userId } });
  });

  return buildExplorationState(prisma, userId);
}

export async function healActiveCreature(prisma: PrismaClient, userId: string) {
  await prisma.$transaction(async (tx) => {
    const creature = await lockActiveCreature(tx, userId);
    if (!creature) throw new NoActiveCreatureError();
    const species = SPECIES_CATALOG[creature.speciesKey];
    await tx.playerCreature.update({
      where: { id: creature.id },
      data: { currentHp: creatureMaxHp(species.baseHp, creature.level) },
    });
  });

  return buildExplorationState(prisma, userId);
}
