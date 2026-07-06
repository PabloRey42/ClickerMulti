import type { PrismaClient, MarketListing, MarketAssetType } from "@prisma/client";
import {
  SPECIES_CATALOG,
  POKEBALL_CATALOG,
  MAX_SAME_SPECIES_OWNED,
  MAX_SHINY_SAME_SPECIES_OWNED,
  type MarketListingView,
  type MarketListingsResponse,
} from "@farm-clicker/shared";
import { lockPlayerState } from "../../lib/battle-db.js";
import { bumpQuestObjective } from "../quests/quests.service.js";

export class CreatureNotFoundError extends Error {}
export class AlreadyListedError extends Error {}
export class InvalidItemError extends Error {}
export class InsufficientItemsError extends Error {}
export class InvalidListingError extends Error {}
export class ListingNotFoundError extends Error {}
export class CannotBuyOwnListingError extends Error {}
export class InsufficientGoldError extends Error {}
export class DuplicateSpeciesLimitError extends Error {}

interface CreateListingInput {
  assetType: MarketAssetType;
  itemKey?: string;
  quantity?: number;
  creatureId?: string;
  askGoldPrice: bigint;
}

async function buildListingView(
  prisma: PrismaClient,
  listing: MarketListing,
  viewerUserId: string,
): Promise<MarketListingView> {
  const seller = await prisma.user.findUniqueOrThrow({ where: { id: listing.sellerId } });

  let itemName: string | null = null;
  if (listing.assetType === "ITEM" && listing.itemKey) {
    itemName = POKEBALL_CATALOG[listing.itemKey]?.name ?? listing.itemKey;
  }

  let creatureName: string | null = null;
  let creatureSpriteFile: string | null = null;
  let creatureLevel: number | null = null;
  if (listing.assetType === "CREATURE" && listing.creatureId) {
    const creature = await prisma.playerCreature.findUnique({ where: { id: listing.creatureId } });
    if (creature) {
      const species = SPECIES_CATALOG[creature.speciesKey];
      creatureName = creature.nickname ?? species.name;
      creatureSpriteFile = species.spriteFile;
      creatureLevel = creature.level;
    }
  }

  return {
    id: listing.id,
    sellerId: listing.sellerId,
    sellerUsername: seller.username,
    assetType: listing.assetType,
    itemKey: listing.itemKey,
    itemName,
    quantity: listing.quantity,
    creatureId: listing.creatureId,
    creatureName,
    creatureSpriteFile,
    creatureLevel,
    askGoldPrice: listing.askGoldPrice,
    status: listing.status,
    createdAt: listing.createdAt.toISOString(),
    isMine: listing.sellerId === viewerUserId,
  };
}

export async function getListings(prisma: PrismaClient, userId: string): Promise<MarketListingsResponse> {
  await bumpQuestObjective(prisma, userId, "open_market");
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });
  const listings = await prisma.marketListing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  const views = await Promise.all(listings.map((listing) => buildListingView(prisma, listing, userId)));
  return { goldBalance: playerState.goldBalance, listings: views };
}

export async function createListing(
  prisma: PrismaClient,
  sellerId: string,
  input: CreateListingInput,
): Promise<MarketListingsResponse> {
  if (input.askGoldPrice <= 0n) throw new InvalidListingError();

  await prisma.$transaction(async (tx) => {
    if (input.assetType === "CREATURE") {
      if (!input.creatureId) throw new InvalidListingError();
      const creature = await tx.playerCreature.findFirst({ where: { id: input.creatureId, userId: sellerId } });
      if (!creature) throw new CreatureNotFoundError();

      const existing = await tx.marketListing.findFirst({
        where: { creatureId: creature.id, status: "ACTIVE" },
      });
      if (existing) throw new AlreadyListedError();

      await tx.marketListing.create({
        data: { sellerId, assetType: "CREATURE", creatureId: creature.id, askGoldPrice: input.askGoldPrice },
      });
    } else {
      if (!input.itemKey || !POKEBALL_CATALOG[input.itemKey]) throw new InvalidItemError();
      const quantity = input.quantity ?? 1;
      if (quantity < 1) throw new InvalidListingError();

      const inventory = await tx.playerInventoryItem.findUnique({
        where: { userId_itemKey: { userId: sellerId, itemKey: input.itemKey } },
      });
      if (!inventory || inventory.quantity < quantity) throw new InsufficientItemsError();

      // Escrow: deduct now so the same balls can't be listed twice or spent elsewhere;
      // refunded on cancel.
      await tx.playerInventoryItem.update({
        where: { userId_itemKey: { userId: sellerId, itemKey: input.itemKey } },
        data: { quantity: { decrement: quantity } },
      });

      await tx.marketListing.create({
        data: { sellerId, assetType: "ITEM", itemKey: input.itemKey, quantity, askGoldPrice: input.askGoldPrice },
      });
    }
  });

  return getListings(prisma, sellerId);
}

export async function cancelListing(
  prisma: PrismaClient,
  userId: string,
  listingId: string,
): Promise<MarketListingsResponse> {
  await prisma.$transaction(async (tx) => {
    const listing = await tx.marketListing.findFirst({
      where: { id: listingId, sellerId: userId, status: "ACTIVE" },
    });
    if (!listing) throw new ListingNotFoundError();

    await tx.marketListing.update({ where: { id: listingId }, data: { status: "CANCELLED" } });

    if (listing.assetType === "ITEM" && listing.itemKey) {
      await tx.playerInventoryItem.upsert({
        where: { userId_itemKey: { userId, itemKey: listing.itemKey } },
        update: { quantity: { increment: listing.quantity ?? 1 } },
        create: { userId, itemKey: listing.itemKey, quantity: listing.quantity ?? 1 },
      });
    }
    // CREATURE listings need no refund — the creature was never moved out of its owner.
  });

  return getListings(prisma, userId);
}

export async function buyListing(
  prisma: PrismaClient,
  buyerId: string,
  listingId: string,
): Promise<MarketListingsResponse> {
  await prisma.$transaction(async (tx) => {
    const listing = await tx.marketListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE") throw new ListingNotFoundError();
    if (listing.sellerId === buyerId) throw new CannotBuyOwnListingError();

    // Lock both parties' PlayerState in a consistent order (userId ascending) so two
    // players trading concurrently can never deadlock against each other.
    const [firstId, secondId] = [listing.sellerId, buyerId].sort();
    await lockPlayerState(tx, firstId);
    await lockPlayerState(tx, secondId);

    const buyerState = await tx.playerState.findUniqueOrThrow({ where: { userId: buyerId } });
    if (buyerState.goldBalance < listing.askGoldPrice) throw new InsufficientGoldError();

    await tx.playerState.update({
      where: { userId: buyerId },
      data: { goldBalance: { decrement: listing.askGoldPrice } },
    });
    await tx.playerState.update({
      where: { userId: listing.sellerId },
      data: { goldBalance: { increment: listing.askGoldPrice } },
    });

    if (listing.assetType === "CREATURE" && listing.creatureId) {
      const creature = await tx.playerCreature.findUniqueOrThrow({ where: { id: listing.creatureId } });
      const speciesCap = creature.isShiny ? MAX_SHINY_SAME_SPECIES_OWNED : MAX_SAME_SPECIES_OWNED;
      const ownedCount = await tx.playerCreature.count({
        where: { userId: buyerId, speciesKey: creature.speciesKey, isShiny: creature.isShiny },
      });
      if (ownedCount >= speciesCap) throw new DuplicateSpeciesLimitError();

      await tx.playerCreature.update({
        where: { id: listing.creatureId },
        data: { userId: buyerId, isActive: false, isOnTeam: false },
      });
    } else if (listing.itemKey) {
      await tx.playerInventoryItem.upsert({
        where: { userId_itemKey: { userId: buyerId, itemKey: listing.itemKey } },
        update: { quantity: { increment: listing.quantity ?? 1 } },
        create: { userId: buyerId, itemKey: listing.itemKey, quantity: listing.quantity ?? 1 },
      });
    }

    await tx.marketListing.update({
      where: { id: listingId },
      data: { status: "SOLD", soldAt: new Date(), buyerId },
    });
  });

  return getListings(prisma, buyerId);
}
