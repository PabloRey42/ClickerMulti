import type { PrismaClient, Prisma, RaidLobby } from "@prisma/client";
import {
  SPECIES_CATALOG,
  MAX_TEAM_SIZE,
  typeMultiplier,
  computeAttackDamage,
  creatureAttack,
  creatureMaxHp,
  goldReward,
  xpReward,
  leagueRankBonusMultiplier,
  computeSkillTreeBonuses,
  findRaidHotspot,
  findRaidBossByKey,
  type SkillTreeBonuses,
  type RaidLobbySnapshot,
  type RaidLobbySummary,
  type RaidAttackResponse,
} from "@farm-clicker/shared";
import {
  lockActiveCreature,
  renumberTeamSlots,
  resolveActiveCreature,
  applyXpGain,
} from "../../lib/battle-db.js";
import { lockRaidLobby, buildRaidLobbySnapshot } from "../../lib/raid-db.js";

export class RaidHotspotNotFoundError extends Error {}
export class RaidLobbyNotFoundError extends Error {}
export class RaidAlreadyInActiveLobbyError extends Error {}
export class RaidLobbyFullError extends Error {}
export class RaidLobbyNotJoinableError extends Error {}
export class RaidNotParticipantError extends Error {}
export class RaidNotCreatorError extends Error {}
export class RaidNotEnoughParticipantsError extends Error {}
export class RaidLobbyNotInProgressError extends Error {}
export class RaidNoActiveCreatureError extends Error {}
export class RaidActiveCreatureFaintedError extends Error {}

async function getSkillTreeBonuses(tx: Prisma.TransactionClient, userId: string): Promise<SkillTreeBonuses> {
  const rows = await tx.playerSkillBranch.findMany({ where: { userId } });
  const tiers = Object.fromEntries(rows.map((r) => [r.branch, r.tier]));
  return computeSkillTreeBonuses(tiers);
}

async function assertNotInActiveLobby(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const existing = await tx.raidParticipant.findFirst({
    where: { userId, lobby: { status: { in: ["WAITING", "IN_PROGRESS"] } } },
  });
  if (existing) throw new RaidAlreadyInActiveLobbyError();
}

/** The single source of truth for lobby lifecycle transitions — always called immediately
 * after locking a RaidLobby row, before any other logic runs. Re-derives WAITING/IN_PROGRESS
 * from wall-clock time rather than trusting a single in-memory setTimeout firing (see
 * raid.timers.ts): if the auto-start deadline has passed, starts the battle (or expires the
 * lobby if it never reached minParticipants); if the battle timer has passed, resolves a
 * loss. Same "durable, not one-shot" idiom as PlayerCreature.pendingEvolutionFrom — a missed
 * or lost timer fire just makes the transition late (caught on the next read/mutation), never
 * wrong. */
async function resolveLobbyTimersIfDue(tx: Prisma.TransactionClient, lobby: RaidLobby): Promise<RaidLobby> {
  const config = findRaidBossByKey(lobby.raidBossKey);
  if (!config) return lobby;
  const now = new Date();

  if (lobby.status === "WAITING" && now >= lobby.startsAt) {
    const count = await tx.raidParticipant.count({ where: { lobbyId: lobby.id } });
    if (count >= config.minParticipants) {
      return tx.raidLobby.update({
        where: { id: lobby.id },
        data: { status: "IN_PROGRESS", battleEndsAt: new Date(now.getTime() + config.battleDurationMs) },
      });
    }
    return tx.raidLobby.update({ where: { id: lobby.id }, data: { status: "EXPIRED", resolvedAt: now } });
  }

  if (lobby.status === "IN_PROGRESS" && lobby.battleEndsAt && now >= lobby.battleEndsAt) {
    return tx.raidLobby.update({ where: { id: lobby.id }, data: { status: "LOST", resolvedAt: now } });
  }

  return lobby;
}

async function loadAndResolve(tx: Prisma.TransactionClient, lobbyId: string): Promise<RaidLobby> {
  const lobby = await lockRaidLobby(tx, lobbyId);
  if (!lobby) throw new RaidLobbyNotFoundError();
  return resolveLobbyTimersIfDue(tx, lobby);
}

/** Grants gold/XP and rolls the independent 1/1000 capture chance for every participant still
 * on the lobby — "fought" is simply "was still a participant when the raid resolved", since
 * leaving mid-battle is disallowed (see leaveLobby). Skips enforceSpeciesCaps entirely for a
 * successful roll: a raid-caught legendary is a rare trophy, not a normal capture, and must
 * never compete with (or get pruned by) the regular MAX_SAME_SPECIES_OWNED cap. */
async function resolveRaidVictory(tx: Prisma.TransactionClient, lobby: RaidLobby): Promise<RaidLobby> {
  const config = findRaidBossByKey(lobby.raidBossKey)!;
  const now = new Date();
  const updated = await tx.raidLobby.update({ where: { id: lobby.id }, data: { status: "WON", resolvedAt: now } });

  const participants = await tx.raidParticipant.findMany({ where: { lobbyId: lobby.id } });
  for (const participant of participants) {
    const gold = goldReward(config.level);
    const xp = xpReward(config.level);

    const activeCreature = await tx.playerCreature.findFirst({ where: { userId: participant.userId, isActive: true } });
    if (activeCreature) await applyXpGain(tx, activeCreature, xp);

    await tx.playerState.update({
      where: { userId: participant.userId },
      data: {
        goldBalance: { increment: gold },
        totalGoldEarned: { increment: gold },
        totalXpEarned: { increment: xp },
      },
    });

    const caught = Math.random() < config.captureChance;
    if (caught) {
      const species = SPECIES_CATALOG[config.speciesKey];
      const teamCount = await tx.playerCreature.count({ where: { userId: participant.userId, isOnTeam: true } });
      await tx.playerCreature.create({
        data: {
          userId: participant.userId,
          speciesKey: config.speciesKey,
          level: config.level,
          currentHp: creatureMaxHp(species.baseHp, config.level),
          isOnTeam: teamCount < MAX_TEAM_SIZE,
        },
      });
      await renumberTeamSlots(tx, participant.userId);
    }
    await tx.raidParticipant.update({ where: { id: participant.id }, data: { caughtBoss: caught } });
  }

  return updated;
}

export async function listOpenLobbiesForHotspot(prisma: PrismaClient, hotspotId: string): Promise<RaidLobbySummary[]> {
  const lobbies = await prisma.raidLobby.findMany({
    where: { hotspotId, status: "WAITING" },
    include: { creator: true, _count: { select: { participants: true } } },
    orderBy: { createdAt: "asc" },
  });
  return lobbies.map((l) => ({
    id: l.id,
    creatorUsername: l.creator.username,
    participantCount: l._count.participants,
    minParticipants: findRaidBossByKey(l.raidBossKey)?.minParticipants ?? 2,
    createdAt: l.createdAt.toISOString(),
    startsAt: l.startsAt.toISOString(),
  }));
}

export async function createLobby(prisma: PrismaClient, userId: string, hotspotId: string): Promise<RaidLobbySnapshot> {
  const hotspot = findRaidHotspot(hotspotId);
  if (!hotspot) throw new RaidHotspotNotFoundError();
  const config = findRaidBossByKey(hotspot.raidBossKey)!;

  const lobby = await prisma.$transaction(async (tx) => {
    await assertNotInActiveLobby(tx, userId);

    const now = new Date();
    const created = await tx.raidLobby.create({
      data: {
        raidBossKey: hotspot.raidBossKey,
        hotspotId: hotspot.id,
        cityMapId: config.cityMapId,
        creatorId: userId,
        bossMaxHp: config.bossMaxHp,
        bossCurrentHp: config.bossMaxHp,
        startsAt: new Date(now.getTime() + config.lobbyWaitMs),
      },
    });
    await tx.raidParticipant.create({ data: { lobbyId: created.id, userId } });
    return created;
  });

  return prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
}

export async function getLobby(prisma: PrismaClient, userId: string, lobbyId: string): Promise<RaidLobbySnapshot> {
  return prisma.$transaction(async (tx) => {
    const lobby = await loadAndResolve(tx, lobbyId);
    const participant = await tx.raidParticipant.findUnique({ where: { lobbyId_userId: { lobbyId, userId } } });
    if (!participant) throw new RaidNotParticipantError();
    return buildRaidLobbySnapshot(tx, lobby);
  });
}

export async function joinLobby(prisma: PrismaClient, userId: string, lobbyId: string): Promise<RaidLobbySnapshot> {
  const lobby = await prisma.$transaction(async (tx) => {
    const resolved = await loadAndResolve(tx, lobbyId);
    if (resolved.status !== "WAITING") throw new RaidLobbyNotJoinableError();
    await assertNotInActiveLobby(tx, userId);

    const config = findRaidBossByKey(resolved.raidBossKey)!;
    const count = await tx.raidParticipant.count({ where: { lobbyId } });
    if (count >= config.maxParticipants) throw new RaidLobbyFullError();

    await tx.raidParticipant.create({ data: { lobbyId, userId } });
    return resolved;
  });
  return prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
}

/** Only allowed while WAITING — leaving mid-battle would let a player dodge the boss's
 * counter-damage right before a losing exchange, and would complicate "who fought" for
 * resolveRaidVictory's reward loop. If the creator leaves, reassigns the next-earliest
 * joiner so the lobby isn't stranded without anyone who can manually start it; if the lobby
 * empties out entirely it's left alone and simply self-expires at its startsAt deadline via
 * the usual lazy resolution. */
export async function leaveLobby(prisma: PrismaClient, userId: string, lobbyId: string): Promise<RaidLobbySnapshot> {
  const lobby = await prisma.$transaction(async (tx) => {
    const resolved = await loadAndResolve(tx, lobbyId);
    const participant = await tx.raidParticipant.findUnique({ where: { lobbyId_userId: { lobbyId, userId } } });
    if (!participant) throw new RaidNotParticipantError();
    if (resolved.status !== "WAITING") throw new RaidLobbyNotJoinableError();

    await tx.raidParticipant.delete({ where: { lobbyId_userId: { lobbyId, userId } } });

    if (resolved.creatorId === userId) {
      const next = await tx.raidParticipant.findFirst({ where: { lobbyId }, orderBy: { joinedAt: "asc" } });
      if (next) {
        return tx.raidLobby.update({ where: { id: lobbyId }, data: { creatorId: next.userId } });
      }
    }
    return resolved;
  });
  return prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
}

export async function startLobby(prisma: PrismaClient, userId: string, lobbyId: string): Promise<RaidLobbySnapshot> {
  const lobby = await prisma.$transaction(async (tx) => {
    const resolved = await loadAndResolve(tx, lobbyId);
    if (resolved.status !== "WAITING") throw new RaidLobbyNotJoinableError();
    if (resolved.creatorId !== userId) throw new RaidNotCreatorError();

    const config = findRaidBossByKey(resolved.raidBossKey)!;
    const count = await tx.raidParticipant.count({ where: { lobbyId } });
    if (count < config.minParticipants) throw new RaidNotEnoughParticipantsError();

    const now = new Date();
    return tx.raidLobby.update({
      where: { id: lobbyId },
      data: { status: "IN_PROGRESS", battleEndsAt: new Date(now.getTime() + config.battleDurationMs) },
    });
  });
  return prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
}

/** One full click-exchange, same per-click model as attackEncounter (packages/shared's
 * combat formulas reused as-is): the attacker's active creature damages the shared boss HP
 * pool (serialized via lockRaidLobby's row lock — concurrent attackers on the same lobby
 * execute strictly one at a time), and if the boss survives it counters onto that SAME
 * player's active creature. Deliberately not a server-authoritative tick loop — every other
 * participant just sees the shared bossCurrentHp drop via the next raid:update broadcast. */
export async function attackBoss(prisma: PrismaClient, userId: string, lobbyId: string): Promise<RaidAttackResponse> {
  let damageDealt = 0;
  let damageTaken = 0;
  let fainted = false;
  let canSwitch = false;

  const lobby = await prisma.$transaction(async (tx) => {
    const resolved = await loadAndResolve(tx, lobbyId);
    const participant = await tx.raidParticipant.findUnique({ where: { lobbyId_userId: { lobbyId, userId } } });
    if (!participant) throw new RaidNotParticipantError();
    if (resolved.status !== "IN_PROGRESS") throw new RaidLobbyNotInProgressError();

    const activeCreature = await lockActiveCreature(tx, userId);
    if (!activeCreature) throw new RaidNoActiveCreatureError();
    if (activeCreature.currentHp <= 0) throw new RaidActiveCreatureFaintedError();

    const config = findRaidBossByKey(resolved.raidBossKey)!;
    const bossSpecies = SPECIES_CATALOG[config.speciesKey];
    const attackerSpecies = SPECIES_CATALOG[activeCreature.speciesKey];

    const skillBonuses = await getSkillTreeBonuses(tx, userId);
    const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
    const bonusMultiplier = leagueRankBonusMultiplier(progress?.rank ?? 0).mul(skillBonuses.attack);

    const attackerAttack = creatureAttack(attackerSpecies.baseAttack, activeCreature.level);
    damageDealt = computeAttackDamage(
      attackerAttack,
      bonusMultiplier,
      typeMultiplier(attackerSpecies.types, bossSpecies.types),
    );
    const bossHpAfter = Math.max(0, resolved.bossCurrentHp - damageDealt);

    await tx.raidParticipant.update({
      where: { lobbyId_userId: { lobbyId, userId } },
      data: { damageDealt: { increment: damageDealt } },
    });

    if (bossHpAfter <= 0) {
      const defeated = await tx.raidLobby.update({ where: { id: lobbyId }, data: { bossCurrentHp: 0 } });
      return resolveRaidVictory(tx, defeated);
    }

    const damageResult = computeAttackDamage(
      config.bossAttack,
      skillBonuses.defense,
      typeMultiplier(bossSpecies.types, attackerSpecies.types),
    );
    damageTaken = damageResult;
    const playerHpAfter = Math.max(0, activeCreature.currentHp - damageTaken);
    fainted = playerHpAfter <= 0;

    await tx.playerCreature.update({
      where: { id: activeCreature.id },
      data: { currentHp: playerHpAfter, isActive: fainted ? false : true },
    });

    if (fainted) {
      const { hasLiving } = await resolveActiveCreature(tx, userId);
      canSwitch = hasLiving;
    }

    return tx.raidLobby.update({ where: { id: lobbyId }, data: { bossCurrentHp: bossHpAfter } });
  });

  const snapshot = await prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
  return { lobby: snapshot, damageDealt, damageTaken, fainted, canSwitch };
}

/** Thin wrapper used by both the timer fast-path (raid.timers.ts) and the admin escape
 * hatches below — just re-derives lifecycle state and rebuilds the snapshot for broadcast. */
export async function resolveRaidLobbyTimers(prisma: PrismaClient, lobbyId: string): Promise<RaidLobbySnapshot> {
  const lobby = await prisma.$transaction(async (tx) => {
    const locked = await lockRaidLobby(tx, lobbyId);
    if (!locked) throw new RaidLobbyNotFoundError();
    return resolveLobbyTimersIfDue(tx, locked);
  });
  return prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
}

/** QA escape hatch: fast-forwards whichever deadline is currently active (auto-start while
 * WAITING, or the battle timer while IN_PROGRESS) to "now" and immediately resolves it —
 * this machine has no local Docker/DB, so raids can only ever be played end-to-end on the
 * VPS, and waiting out real 2min/3min timers on every playtest iteration isn't practical. */
export async function adminForceLobbyTimeout(prisma: PrismaClient, lobbyId: string): Promise<RaidLobbySnapshot> {
  const lobby = await prisma.$transaction(async (tx) => {
    const locked = await lockRaidLobby(tx, lobbyId);
    if (!locked) throw new RaidLobbyNotFoundError();
    const now = new Date();
    if (locked.status === "WAITING") {
      await tx.raidLobby.update({ where: { id: lobbyId }, data: { startsAt: now } });
    } else if (locked.status === "IN_PROGRESS") {
      await tx.raidLobby.update({ where: { id: lobbyId }, data: { battleEndsAt: now } });
    }
    const refreshed = await lockRaidLobby(tx, lobbyId);
    return resolveLobbyTimersIfDue(tx, refreshed!);
  });
  return prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
}

/** QA escape hatch: directly sets the shared boss HP (e.g. down to ~0 to instantly test the
 * victory/capture-roll/animation flow without grinding through the real HP pool). */
export async function adminSetBossHp(prisma: PrismaClient, lobbyId: string, bossCurrentHp: number): Promise<RaidLobbySnapshot> {
  const lobby = await prisma.$transaction(async (tx) => {
    let locked = await lockRaidLobby(tx, lobbyId);
    if (!locked) throw new RaidLobbyNotFoundError();
    locked = await resolveLobbyTimersIfDue(tx, locked);
    if (locked.status !== "IN_PROGRESS") throw new RaidLobbyNotInProgressError();

    const clamped = Math.max(0, Math.min(locked.bossMaxHp, bossCurrentHp));
    const updated = await tx.raidLobby.update({ where: { id: lobbyId }, data: { bossCurrentHp: clamped } });
    if (clamped <= 0) return resolveRaidVictory(tx, updated);
    return updated;
  });
  return prisma.$transaction((tx) => buildRaidLobbySnapshot(tx, lobby));
}
