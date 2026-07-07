import type { PrismaClient, Prisma } from "@prisma/client";
import {
  SPECIES_CATALOG,
  SKILL_TREE_BRANCH_IDS,
  SKILL_TREE_TIERS_PER_BRANCH,
  isValidSkillBranch,
  isSkillTreeComplete,
  buildLeagueRoster,
  creatureMaxHp,
  type LeagueStateResponse,
  type SkillBranchId,
  type ExplorationStateResponse,
} from "@farm-clicker/shared";
import { lockPlayerState } from "../../lib/battle-db.js";
import {
  ALL_SPECIES_KEYS,
  buildExplorationState,
  NoActiveCreatureError,
  ActiveCreatureFaintedError,
} from "../exploration/exploration.service.js";

export class InvalidSkillBranchError extends Error {}
export class SkillBranchMaxedError extends Error {}
export class NoSkillPointsError extends Error {}

async function loadSkillTreeTiers(
  prisma: PrismaClient | Prisma.TransactionClient,
  userId: string,
): Promise<Record<SkillBranchId, number>> {
  const rows = await prisma.playerSkillBranch.findMany({ where: { userId } });
  const tiers = Object.fromEntries(SKILL_TREE_BRANCH_IDS.map((b) => [b, 0])) as Record<SkillBranchId, number>;
  for (const row of rows) {
    if (isValidSkillBranch(row.branch)) tiers[row.branch] = row.tier;
  }
  return tiers;
}

export async function getLeagueState(prisma: PrismaClient, userId: string): Promise<LeagueStateResponse> {
  const progress = await prisma.playerLeagueProgress.findUnique({ where: { userId } });
  const rank = progress?.rank ?? 0;
  const unspentPoints = progress?.unspentPoints ?? 0;

  const skillTree = await loadSkillTreeTiers(prisma, userId);
  const playerState = await prisma.playerState.findUnique({ where: { userId } });

  const roster = buildLeagueRoster(rank, ALL_SPECIES_KEYS);
  const opponentPreview = roster.map((o) => {
    const species = SPECIES_CATALOG[o.speciesKey];
    return { speciesKey: o.speciesKey, name: species.name, spriteFile: species.spriteFile, level: o.level };
  });

  const encounter = await prisma.wildEncounter.findUnique({ where: { userId } });
  const inProgress = encounter?.isLeagueBattle ?? false;

  return {
    rank,
    unspentPoints,
    skillTree,
    hasShinyCharm: playerState?.hasShinyCharm ?? false,
    opponentPreview,
    inProgress,
  };
}

export async function challengeLeague(prisma: PrismaClient, userId: string): Promise<ExplorationStateResponse> {
  await prisma.$transaction(async (tx) => {
    await lockPlayerState(tx, userId);

    // Resume an already-in-progress League run rather than rerolling it. A stale *route*
    // encounter (abandoned wild fight) must NOT block starting the League — it gets
    // overwritten below, same as entering a different route abandons the old one.
    const existingEncounter = await tx.wildEncounter.findUnique({ where: { userId } });
    if (existingEncounter?.isLeagueBattle) return;

    const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (!activeCreature) throw new NoActiveCreatureError();
    if (activeCreature.currentHp <= 0) throw new ActiveCreatureFaintedError();

    const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
    const rank = progress?.rank ?? 0;
    const roster = buildLeagueRoster(rank, ALL_SPECIES_KEYS);
    const first = roster[0];
    const species = SPECIES_CATALOG[first.speciesKey];
    const maxHp = creatureMaxHp(species.baseHp, first.level);

    await tx.wildEncounter.upsert({
      where: { userId },
      update: {
        routeKey: "league",
        speciesKey: first.speciesKey,
        level: first.level,
        currentHp: maxHp,
        maxHp,
        isShiny: false,
        isLeagueBattle: true,
        leagueOpponentIndex: 0,
      },
      create: {
        userId,
        routeKey: "league",
        speciesKey: first.speciesKey,
        level: first.level,
        currentHp: maxHp,
        maxHp,
        isLeagueBattle: true,
        leagueOpponentIndex: 0,
      },
    });
  });

  return buildExplorationState(prisma, userId);
}

/** Spends one League skill point unlocking the next tier of a branch (attack/defense/
 * capture/gold/xp). Branches unlock strictly in order (tier N+1 requires tier N already
 * owned) and cap at SKILL_TREE_TIERS_PER_BRANCH. Once every branch is maxed, the player
 * permanently earns the Charme Shiny (PlayerState.hasShinyCharm) — checked fresh on every
 * investment rather than only the "last" one, so it stays correct even if branches are
 * finished in an unexpected order. */
export async function investSkillNode(
  prisma: PrismaClient,
  userId: string,
  branch: string,
): Promise<LeagueStateResponse> {
  if (!isValidSkillBranch(branch)) throw new InvalidSkillBranchError();

  await prisma.$transaction(async (tx) => {
    const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
    const unspentPoints = progress?.unspentPoints ?? 0;
    if (unspentPoints < 1) throw new NoSkillPointsError();

    const row = await tx.playerSkillBranch.findUnique({ where: { userId_branch: { userId, branch } } });
    const currentTier = row?.tier ?? 0;
    if (currentTier >= SKILL_TREE_TIERS_PER_BRANCH) throw new SkillBranchMaxedError();

    await tx.playerLeagueProgress.update({ where: { userId }, data: { unspentPoints: { decrement: 1 } } });
    await tx.playerSkillBranch.upsert({
      where: { userId_branch: { userId, branch } },
      update: { tier: { increment: 1 } },
      create: { userId, branch, tier: 1 },
    });

    const tiers = await loadSkillTreeTiers(tx, userId);
    tiers[branch] = currentTier + 1;
    if (isSkillTreeComplete(tiers)) {
      await tx.playerState.update({ where: { userId }, data: { hasShinyCharm: true } });
    }
  });

  return getLeagueState(prisma, userId);
}
