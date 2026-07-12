import type { Prisma, RaidLobby, RaidParticipant, User } from "@prisma/client";
import { findRaidBossByKey, type RaidParticipantView, type RaidLobbySnapshot } from "@farm-clicker/shared";
import { buildCreatureView } from "./battle-db.js";

/** Row-locks RaidLobby so concurrent participant actions (attacks, joins, timer resolution)
 * against the same lobby can't race — the single serialization point for a raid's shared
 * boss HP pool. */
export async function lockRaidLobby(tx: Prisma.TransactionClient, lobbyId: string): Promise<RaidLobby | null> {
  const rows = await tx.$queryRaw<RaidLobby[]>`
    SELECT * FROM "RaidLobby" WHERE "id" = ${lobbyId} FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function buildRaidParticipantView(
  tx: Prisma.TransactionClient,
  participant: RaidParticipant & { user: User },
  creatorId: string,
): Promise<RaidParticipantView> {
  const team = await tx.playerCreature.findMany({
    where: { userId: participant.userId, isOnTeam: true },
    orderBy: [{ teamSlot: "asc" }, { caughtAt: "asc" }],
  });
  const active = team.find((c) => c.isActive) ?? null;

  return {
    userId: participant.userId,
    username: participant.user.username,
    joinedAt: participant.joinedAt.toISOString(),
    damageDealt: participant.damageDealt,
    isCreator: participant.userId === creatorId,
    caughtBoss: participant.caughtBoss,
    activeCreature: active ? buildCreatureView(active) : null,
    team: team.map(buildCreatureView),
  };
}

export async function buildRaidLobbySnapshot(tx: Prisma.TransactionClient, lobby: RaidLobby): Promise<RaidLobbySnapshot> {
  const config = findRaidBossByKey(lobby.raidBossKey);
  const participants = await tx.raidParticipant.findMany({
    where: { lobbyId: lobby.id },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  return {
    id: lobby.id,
    raidBossKey: lobby.raidBossKey,
    hotspotId: lobby.hotspotId,
    cityMapId: lobby.cityMapId,
    status: lobby.status,
    bossMaxHp: lobby.bossMaxHp,
    bossCurrentHp: lobby.bossCurrentHp,
    createdAt: lobby.createdAt.toISOString(),
    startsAt: lobby.startsAt.toISOString(),
    battleEndsAt: lobby.battleEndsAt?.toISOString() ?? null,
    resolvedAt: lobby.resolvedAt?.toISOString() ?? null,
    creatorId: lobby.creatorId,
    minParticipants: config?.minParticipants ?? 2,
    participants: await Promise.all(participants.map((p) => buildRaidParticipantView(tx, p, lobby.creatorId))),
  };
}
