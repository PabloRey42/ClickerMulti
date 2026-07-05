import type { PrismaClient } from "@prisma/client";
import {
  SPECIES_CATALOG,
  STARTER_SPECIES_KEYS,
  MAX_TEAM_SIZE,
  creatureMaxHp,
  type PlayerCreatureView,
  type SpeciesView,
} from "@farm-clicker/shared";
import { buildCreatureView } from "../../lib/battle-db.js";

export class CreatureNotFoundError extends Error {}
export class CreatureFaintedError extends Error {}
export class CreatureNotOnTeamError extends Error {}
export class TeamFullError extends Error {}
export class InvalidStarterError extends Error {}
export class StarterAlreadyChosenError extends Error {}

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
      },
    });
    return buildCreatureView(created);
  });
}

export async function listCreatures(prisma: PrismaClient, userId: string): Promise<PlayerCreatureView[]> {
  const creatures = await prisma.playerCreature.findMany({ where: { userId }, orderBy: { caughtAt: "asc" } });
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
      await tx.playerCreature.update({ where: { id: creatureId }, data: { isOnTeam: true } });
      return;
    }

    if (!onTeam && target.isOnTeam) {
      await tx.playerCreature.update({
        where: { id: creatureId },
        data: { isOnTeam: false, isActive: false },
      });

      if (target.isActive) {
        const replacement = await tx.playerCreature.findFirst({
          where: { userId, isOnTeam: true, currentHp: { gt: 0 }, id: { not: creatureId } },
        });
        if (replacement) {
          await tx.playerCreature.update({ where: { id: replacement.id }, data: { isActive: true } });
        }
      }
    }
  });

  return listCreatures(prisma, userId);
}
