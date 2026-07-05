import type { PrismaClient } from "@prisma/client";
import type { PlayerCreatureView } from "@farm-clicker/shared";
import { buildCreatureView } from "../../lib/battle-db.js";

export class CreatureNotFoundError extends Error {}
export class CreatureFaintedError extends Error {}

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
    if (target.currentHp <= 0) throw new CreatureFaintedError();

    await tx.playerCreature.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
    const updated = await tx.playerCreature.update({ where: { id: creatureId }, data: { isActive: true } });
    return buildCreatureView(updated);
  });
}
