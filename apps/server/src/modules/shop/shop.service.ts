import type { PrismaClient } from "@prisma/client";
import { POKEBALL_CATALOG, type ShopCatalogResponse, type BuyPokeballResponse } from "@farm-clicker/shared";
import { lockPlayerState } from "../../lib/battle-db.js";

export class InvalidPokeballError extends Error {}
export class InsufficientGoldError extends Error {}

export async function getShopCatalog(prisma: PrismaClient, userId: string): Promise<ShopCatalogResponse> {
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });
  const items = await prisma.playerInventoryItem.findMany({ where: { userId } });
  const ownedByKey = new Map(items.map((i) => [i.itemKey, i.quantity]));

  const pokeballs = Object.values(POKEBALL_CATALOG).map((p) => ({
    key: p.key,
    name: p.name,
    catchMultiplier: p.catchMultiplier,
    goldCost: p.goldCost,
    owned: ownedByKey.get(p.key) ?? 0,
  }));

  return { goldBalance: playerState.goldBalance, pokeballs };
}

export async function buyPokeball(
  prisma: PrismaClient,
  userId: string,
  itemKey: string,
): Promise<BuyPokeballResponse> {
  const pokeball = POKEBALL_CATALOG[itemKey];
  if (!pokeball) throw new InvalidPokeballError();

  return prisma.$transaction(async (tx) => {
    const playerState = await lockPlayerState(tx, userId);
    if (playerState.goldBalance < pokeball.goldCost) throw new InsufficientGoldError();

    const updatedState = await tx.playerState.update({
      where: { userId },
      data: { goldBalance: playerState.goldBalance - pokeball.goldCost },
    });
    const inventory = await tx.playerInventoryItem.upsert({
      where: { userId_itemKey: { userId, itemKey } },
      update: { quantity: { increment: 1 } },
      create: { userId, itemKey, quantity: 1 },
    });

    return { goldBalance: updatedState.goldBalance, itemKey, owned: inventory.quantity };
  });
}
