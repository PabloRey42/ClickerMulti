import type { PrismaClient } from "@prisma/client";
import {
  SPECIES_CATALOG,
  POKEBALL_CATALOG,
  POTION_CATALOG,
  creatureMaxHp,
  type AdminUserSummary,
  type AdminUserDetail,
} from "@farm-clicker/shared";
import { buildCreatureView } from "../../lib/battle-db.js";
import { hashPassword } from "../auth/auth.service.js";

export class UserNotFoundError extends Error {}
export class InvalidSpeciesError extends Error {}
export class CreatureNotFoundError extends Error {}
export class InvalidItemError extends Error {}

function isValidItemKey(itemKey: string): boolean {
  return itemKey in POKEBALL_CATALOG || itemKey in POTION_CATALOG;
}

export async function listUsers(prisma: PrismaClient): Promise<AdminUserSummary[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      playerState: true,
      playerCreatures: { select: { id: true } },
      leagueProgress: true,
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    createdAt: u.createdAt.toISOString(),
    goldBalance: u.playerState?.goldBalance ?? 0n,
    creatureCount: u.playerCreatures.length,
    leagueRank: u.leagueProgress?.rank ?? 0,
  }));
}

export async function getUserDetail(prisma: PrismaClient, userId: string): Promise<AdminUserDetail> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      playerState: true,
      playerCreatures: { orderBy: { caughtAt: "asc" } },
      inventoryItems: true,
      leagueProgress: true,
      specializations: true,
    },
  });
  if (!user || !user.playerState) throw new UserNotFoundError();

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    goldBalance: user.playerState.goldBalance,
    autoHealEnabled: user.playerState.autoHealEnabled,
    leagueRank: user.leagueProgress?.rank ?? 0,
    unspentPoints: user.leagueProgress?.unspentPoints ?? 0,
    creatures: user.playerCreatures.map(buildCreatureView),
    inventoryItems: user.inventoryItems.map((i) => ({ itemKey: i.itemKey, quantity: i.quantity })),
    specializations: user.specializations.map((s) => ({
      elementalType: s.elementalType as AdminUserDetail["specializations"][number]["elementalType"],
      pointsInvested: s.pointsInvested,
    })),
  };
}

async function assertUserExists(prisma: PrismaClient, userId: string): Promise<void> {
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) throw new UserNotFoundError();
}

export async function setGold(prisma: PrismaClient, userId: string, goldBalance: bigint): Promise<AdminUserDetail> {
  await assertUserExists(prisma, userId);
  await prisma.playerState.update({ where: { userId }, data: { goldBalance } });
  return getUserDetail(prisma, userId);
}

/** Also revokes existing refresh tokens so the old password can't keep an existing
 * session alive — the player has to log back in with the new one. */
export async function setPassword(prisma: PrismaClient, userId: string, newPassword: string): Promise<AdminUserDetail> {
  await assertUserExists(prisma, userId);
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  return getUserDetail(prisma, userId);
}

export async function giveCreature(
  prisma: PrismaClient,
  userId: string,
  speciesKey: string,
  level: number,
): Promise<AdminUserDetail> {
  await assertUserExists(prisma, userId);
  const species = SPECIES_CATALOG[speciesKey];
  if (!species) throw new InvalidSpeciesError();

  await prisma.playerCreature.create({
    data: {
      userId,
      speciesKey,
      level,
      currentHp: creatureMaxHp(species.baseHp, level),
    },
  });
  return getUserDetail(prisma, userId);
}

export async function deleteCreature(
  prisma: PrismaClient,
  userId: string,
  creatureId: string,
): Promise<AdminUserDetail> {
  await assertUserExists(prisma, userId);
  const creature = await prisma.playerCreature.findFirst({ where: { id: creatureId, userId } });
  if (!creature) throw new CreatureNotFoundError();

  await prisma.playerCreature.delete({ where: { id: creatureId } });
  return getUserDetail(prisma, userId);
}

export async function setInventoryItem(
  prisma: PrismaClient,
  userId: string,
  itemKey: string,
  quantity: number,
): Promise<AdminUserDetail> {
  await assertUserExists(prisma, userId);
  if (!isValidItemKey(itemKey)) throw new InvalidItemError();

  if (quantity <= 0) {
    await prisma.playerInventoryItem.deleteMany({ where: { userId, itemKey } });
  } else {
    await prisma.playerInventoryItem.upsert({
      where: { userId_itemKey: { userId, itemKey } },
      update: { quantity },
      create: { userId, itemKey, quantity },
    });
  }
  return getUserDetail(prisma, userId);
}

export async function deleteUser(prisma: PrismaClient, userId: string): Promise<void> {
  await assertUserExists(prisma, userId);
  await prisma.user.delete({ where: { id: userId } });
}
