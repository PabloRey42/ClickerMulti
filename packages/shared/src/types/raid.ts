import type { PlayerCreatureView } from "./creature.js";

export type RaidLobbyStatus = "WAITING" | "IN_PROGRESS" | "WON" | "LOST" | "EXPIRED";

export interface RaidParticipantView {
  userId: string;
  username: string;
  joinedAt: string;
  damageDealt: number;
  isCreator: boolean;
  /** Only meaningful once the lobby has resolved WON — each participant's own independent
   * 1/1000 roll result. */
  caughtBoss: boolean;
  activeCreature: PlayerCreatureView | null;
  team: PlayerCreatureView[];
}

export interface RaidLobbySnapshot {
  id: string;
  raidBossKey: string;
  hotspotId: string;
  cityMapId: string;
  status: RaidLobbyStatus;
  bossMaxHp: number;
  bossCurrentHp: number;
  createdAt: string;
  startsAt: string;
  battleEndsAt: string | null;
  resolvedAt: string | null;
  creatorId: string;
  minParticipants: number;
  participants: RaidParticipantView[];
}

/** Minimal row for the lobby browser list (before joining) — deliberately doesn't expose
 * participants/teams to non-participants. */
export interface RaidLobbySummary {
  id: string;
  creatorUsername: string;
  participantCount: number;
  minParticipants: number;
  createdAt: string;
  startsAt: string;
}

export interface RaidAttackResponse {
  lobby: RaidLobbySnapshot;
  damageDealt: number;
  damageTaken: number;
  fainted: boolean;
  canSwitch: boolean;
}

/** Admin panel row — every currently active lobby across every hotspot, so the admin can
 * find a lobby's id to act on without needing it pasted from a URL or server logs. */
export interface AdminRaidLobbySummary {
  id: string;
  raidBossKey: string;
  status: RaidLobbyStatus;
  creatorUsername: string;
  participantCount: number;
  bossCurrentHp: number;
  bossMaxHp: number;
  createdAt: string;
  startsAt: string;
  battleEndsAt: string | null;
}
