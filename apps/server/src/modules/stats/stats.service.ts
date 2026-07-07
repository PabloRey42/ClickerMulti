import type { PrismaClient } from "@prisma/client";
import type { PlayerStatsResponse } from "@farm-clicker/shared";

export async function getPlayerStats(prisma: PrismaClient, userId: string): Promise<PlayerStatsResponse> {
  const [playerState, creaturesOwned, questsCompleted, leagueProgress] = await Promise.all([
    prisma.playerState.findUniqueOrThrow({ where: { userId } }),
    prisma.playerCreature.count({ where: { userId } }),
    prisma.playerQuestProgress.count({ where: { userId, status: "CLAIMED" } }),
    prisma.playerLeagueProgress.findUnique({ where: { userId } }),
  ]);

  return {
    totalClicks: playerState.totalClicks,
    totalPokemonDefeated: playerState.totalPokemonDefeated,
    totalCaptures: playerState.totalCaptures,
    totalShinyCaptures: playerState.totalShinyCaptures,
    totalGoldEarned: playerState.totalGoldEarned,
    totalXpEarned: playerState.totalXpEarned,
    creaturesOwned,
    leagueRank: leagueProgress?.rank ?? 0,
    questsCompleted,
    hasDynavoltEasterEgg: playerState.hasDynavoltEasterEgg,
  };
}
