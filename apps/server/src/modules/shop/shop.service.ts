import type { PrismaClient } from "@prisma/client";
import {
  POKEBALL_CATALOG,
  POTION_CATALOG,
  type ShopCatalogResponse,
  type BuyItemResponse,
} from "@farm-clicker/shared";
import { lockPlayerState } from "../../lib/battle-db.js";
import { bumpQuestObjective } from "../quests/quests.service.js";

export class InvalidItemError extends Error {}
export class InsufficientGoldError extends Error {}

export async function getShopCatalog(prisma: PrismaClient, userId: string): Promise<ShopCatalogResponse> {
  await bumpQuestObjective(prisma, userId, "open_shop");
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });
  const items = await prisma.playerInventoryItem.findMany({ where: { userId } });
  const ownedByKey = new Map(items.map((i) => [i.itemKey, i.quantity]));

  const pokeballs = Object.values(POKEBALL_CATALOG).map((p) => ({
    key: p.key,
    name: p.name,
    catchMultiplier: p.catchMultiplier,
    goldCost: p.goldCost,
    spriteFile: p.spriteFile,
    owned: ownedByKey.get(p.key) ?? 0,
  }));

  const potions = Object.values(POTION_CATALOG).map((p) => ({
    key: p.key,
    name: p.name,
    healAmount: p.healAmount,
    goldCost: p.goldCost,
    spriteFile: p.spriteFile,
    owned: ownedByKey.get(p.key) ?? 0,
  }));

  return { goldBalance: playerState.goldBalance, pokeballs, potions };
}

function findShopItem(itemKey: string): { goldCost: bigint } | undefined {
  return POKEBALL_CATALOG[itemKey] ?? POTION_CATALOG[itemKey];
}

export async function buyItem(
  prisma: PrismaClient,
  userId: string,
  itemKey: string,
  quantity = 1,
): Promise<BuyItemResponse> {
  const item = findShopItem(itemKey);
  if (!item) throw new InvalidItemError();

  const totalCost = item.goldCost * BigInt(quantity);

  return prisma.$transaction(async (tx) => {
    const playerState = await lockPlayerState(tx, userId);
    if (playerState.goldBalance < totalCost) throw new InsufficientGoldError();

    const updatedState = await tx.playerState.update({
      where: { userId },
      data: { goldBalance: playerState.goldBalance - totalCost },
    });
    const inventory = await tx.playerInventoryItem.upsert({
      where: { userId_itemKey: { userId, itemKey } },
      update: { quantity: { increment: quantity } },
      create: { userId, itemKey, quantity },
    });

    if (itemKey in POTION_CATALOG) {
      await bumpQuestObjective(tx, userId, "own_potion");
    }

    return { goldBalance: updatedState.goldBalance, itemKey, owned: inventory.quantity };
  });
}
