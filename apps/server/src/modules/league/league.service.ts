import type { PrismaClient } from "@prisma/client";
import {
  SPECIES_CATALOG,
  ELEMENTAL_TYPES,
  buildLeagueRoster,
  creatureMaxHp,
  type LeagueStateResponse,
  type ExplorationStateResponse,
} from "@farm-clicker/shared";
import { lockPlayerState } from "../../lib/battle-db.js";
import {
  ALL_SPECIES_KEYS,
  buildExplorationState,
  NoActiveCreatureError,
  ActiveCreatureFaintedError,
} from "../exploration/exploration.service.js";

export class InvalidSpecializationTypeError extends Error {}
export class NoSpecializationPointsError extends Error {}

export async function getLeagueState(prisma: PrismaClient, userId: string): Promise<LeagueStateResponse> {
  const progress = await prisma.playerLeagueProgress.findUnique({ where: { userId } });
  const rank = progress?.rank ?? 0;
  const unspentPoints = progress?.unspentPoints ?? 0;

  const specs = await prisma.playerSpecialization.findMany({ where: { userId } });
  const specialization = Object.fromEntries(specs.map((s) => [s.elementalType, s.pointsInvested]));

  const roster = buildLeagueRoster(rank, ALL_SPECIES_KEYS);
  const opponentPreview = roster.map((o) => {
    const species = SPECIES_CATALOG[o.speciesKey];
    return { speciesKey: o.speciesKey, name: species.name, spriteFile: species.spriteFile, level: o.level };
  });

  const encounter = await prisma.wildEncounter.findUnique({ where: { userId } });
  const inProgress = encounter?.isLeagueBattle ?? false;

  return { rank, unspentPoints, specialization, opponentPreview, inProgress };
}

export async function challengeLeague(prisma: PrismaClient, userId: string): Promise<ExplorationStateResponse> {
  await prisma.$transaction(async (tx) => {
    await lockPlayerState(tx, userId);

    // Resume whatever's already in progress (league or route) rather than rerolling.
    const existingEncounter = await tx.wildEncounter.findUnique({ where: { userId } });
    if (existingEncounter) return;

    const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (!activeCreature) throw new NoActiveCreatureError();
    if (activeCreature.currentHp <= 0) throw new ActiveCreatureFaintedError();

    const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
    const rank = progress?.rank ?? 0;
    const roster = buildLeagueRoster(rank, ALL_SPECIES_KEYS);
    const first = roster[0];
    const species = SPECIES_CATALOG[first.speciesKey];
    const maxHp = creatureMaxHp(species.baseHp, first.level);

    await tx.wildEncounter.create({
      data: {
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

export async function investSpecializationPoint(
  prisma: PrismaClient,
  userId: string,
  elementalType: string,
): Promise<LeagueStateResponse> {
  if (!(ELEMENTAL_TYPES as string[]).includes(elementalType)) throw new InvalidSpecializationTypeError();

  await prisma.$transaction(async (tx) => {
    const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
    const unspentPoints = progress?.unspentPoints ?? 0;
    if (unspentPoints < 1) throw new NoSpecializationPointsError();

    await tx.playerLeagueProgress.update({ where: { userId }, data: { unspentPoints: { decrement: 1 } } });
    await tx.playerSpecialization.upsert({
      where: { userId_elementalType: { userId, elementalType } },
      update: { pointsInvested: { increment: 1 } },
      create: { userId, elementalType, pointsInvested: 1 },
    });
  });

  return getLeagueState(prisma, userId);
}
