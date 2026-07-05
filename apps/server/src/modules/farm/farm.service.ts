import type { PrismaClient, Prisma, PlayerState } from "@prisma/client";
import Decimal from "decimal.js";
import {
  computeClickGain,
  computeOfflineGain,
  nextComboStacks,
  comboMultiplier,
  generatorCost,
  BASE_CLICK_POWER,
  AFFECTION_PER_CLICK,
  type FarmStateResponse,
  type ClickResponse,
  type BuyGeneratorResponse,
  type GeneratorView,
} from "@farm-clicker/shared";

/** Accepts both a plain PrismaClient and an interactive $transaction callback client. */
type Db = PrismaClient | Prisma.TransactionClient;

export class GeneratorNotFoundError extends Error {}
export class InsufficientFundsError extends Error {}

/** Row-locks the PlayerState so concurrent clicks/buys from the same user can't race. */
async function lockPlayerState(tx: Prisma.TransactionClient, userId: string): Promise<PlayerState> {
  const rows = await tx.$queryRaw<PlayerState[]>`
    SELECT * FROM "PlayerState" WHERE "userId" = ${userId} FOR UPDATE
  `;
  return rows[0];
}

async function computeProductionPerSec(tx: Db, userId: string): Promise<bigint> {
  const owned = await tx.playerGenerator.findMany({ where: { userId }, include: { generator: true } });
  return owned.reduce((total, o) => total + o.generator.baseProduction * BigInt(o.quantity), 0n);
}

/** Credits idle production owed since lastTickAt, capped server-side. Does not persist. */
function settleIdleProduction(state: PlayerState, productionPerSec: bigint, now: Date) {
  const { gained } = computeOfflineGain(productionPerSec, state.lastTickAt, now);
  return { resourceBalance: state.resourceBalance + gained, lastTickAt: now };
}

async function buildStateView(tx: Db, userId: string, state: PlayerState): Promise<FarmStateResponse> {
  const generators = await tx.generator.findMany({ orderBy: { sortOrder: "asc" } });
  const owned = await tx.playerGenerator.findMany({ where: { userId } });
  const ownedByGeneratorId = new Map(owned.map((o) => [o.generatorId, o.quantity]));

  const productionPerSec = generators.reduce(
    (total, g) => total + g.baseProduction * BigInt(ownedByGeneratorId.get(g.id) ?? 0),
    0n,
  );

  const generatorViews: GeneratorView[] = generators.map((g) => ({
    key: g.key,
    name: g.name,
    cost: generatorCost(g.baseCost, g.costGrowth.toString(), ownedByGeneratorId.get(g.id) ?? 0),
    baseProduction: g.baseProduction,
    owned: ownedByGeneratorId.get(g.id) ?? 0,
  }));

  return {
    resourceBalance: state.resourceBalance,
    affectionBalance: state.affectionBalance,
    productionPerSec,
    comboStacks: state.comboStacks,
    comboMultiplier: comboMultiplier(state.comboStacks).toFixed(2),
    generators: generatorViews,
  };
}

export async function getFarmState(prisma: PrismaClient, userId: string): Promise<FarmStateResponse> {
  return prisma.$transaction(async (tx) => {
    const state = await lockPlayerState(tx, userId);
    const productionPerSec = await computeProductionPerSec(tx, userId);
    const now = new Date();
    const { resourceBalance, lastTickAt } = settleIdleProduction(state, productionPerSec, now);

    const updated = await tx.playerState.update({
      where: { userId },
      data: { resourceBalance, lastTickAt },
    });

    return buildStateView(tx, userId, updated);
  });
}

export async function clickFarm(prisma: PrismaClient, userId: string): Promise<ClickResponse> {
  return prisma.$transaction(async (tx) => {
    const state = await lockPlayerState(tx, userId);
    const productionPerSec = await computeProductionPerSec(tx, userId);
    const now = new Date();

    const { resourceBalance: settledBalance, lastTickAt } = settleIdleProduction(state, productionPerSec, now);

    const stacks = nextComboStacks(state.comboStacks, state.lastClickAt, now);
    const multiplier = comboMultiplier(stacks);
    const baseGain = computeClickGain(BASE_CLICK_POWER, productionPerSec);
    const gain = BigInt(new Decimal(baseGain.toString()).mul(multiplier).floor().toFixed(0));

    const updated = await tx.playerState.update({
      where: { userId },
      data: {
        resourceBalance: settledBalance + gain,
        affectionBalance: state.affectionBalance + AFFECTION_PER_CLICK,
        comboStacks: stacks,
        lastClickAt: now,
        lastTickAt,
      },
    });

    return { state: await buildStateView(tx, userId, updated), gain };
  });
}

export async function buyGenerator(
  prisma: PrismaClient,
  userId: string,
  generatorKey: string,
): Promise<BuyGeneratorResponse> {
  return prisma.$transaction(async (tx) => {
    const state = await lockPlayerState(tx, userId);
    const productionPerSec = await computeProductionPerSec(tx, userId);
    const now = new Date();
    const { resourceBalance: settledBalance, lastTickAt } = settleIdleProduction(state, productionPerSec, now);

    const generator = await tx.generator.findUnique({ where: { key: generatorKey } });
    if (!generator) throw new GeneratorNotFoundError();

    const existing = await tx.playerGenerator.findUnique({
      where: { userId_generatorId: { userId, generatorId: generator.id } },
    });
    const owned = existing?.quantity ?? 0;
    const cost = generatorCost(generator.baseCost, generator.costGrowth.toString(), owned);

    if (settledBalance < cost) throw new InsufficientFundsError();

    await tx.playerGenerator.upsert({
      where: { userId_generatorId: { userId, generatorId: generator.id } },
      update: { quantity: { increment: 1 } },
      create: { userId, generatorId: generator.id, quantity: 1 },
    });

    const updated = await tx.playerState.update({
      where: { userId },
      data: { resourceBalance: settledBalance - cost, lastTickAt },
    });

    return { state: await buildStateView(tx, userId, updated), cost };
  });
}
