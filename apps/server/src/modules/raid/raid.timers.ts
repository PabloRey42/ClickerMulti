import type { FastifyInstance } from "fastify";
import { resolveRaidLobbyTimers } from "./raid.service.js";

/**
 * In-memory setTimeout accelerators only — NOT the source of truth. If the process restarts
 * these are simply lost; correctness is preserved regardless because raid.service.ts's
 * resolveLobbyTimersIfDue re-derives lifecycle state lazily on every REST call anyway (same
 * "durable, not one-shot" idiom as the evolution-reveal fix) — a lost timer just makes a
 * transition late (caught on the next join/attack/get) instead of wrong. These exist purely
 * so connected participants see the auto-start / battle-timeout happen live via the socket
 * broadcast, instead of only finding out on their next action.
 */
export async function broadcastRaidUpdate(fastify: FastifyInstance, lobbyId: string): Promise<void> {
  try {
    const snapshot = await resolveRaidLobbyTimers(fastify.prisma, lobbyId);
    fastify.io.to(`raid:${lobbyId}`).emit("raid:update", snapshot);
  } catch {
    // Lobby may be gone (e.g. cascaded from an admin account deletion) — nothing to
    // broadcast, not worth crashing a timer callback over.
  }
}

export function scheduleAutoStart(fastify: FastifyInstance, lobbyId: string, startsAt: Date): void {
  const delay = Math.max(0, startsAt.getTime() - Date.now());
  setTimeout(() => void broadcastRaidUpdate(fastify, lobbyId), delay);
}

export function scheduleBattleEnd(fastify: FastifyInstance, lobbyId: string, battleEndsAt: Date): void {
  const delay = Math.max(0, battleEndsAt.getTime() - Date.now());
  setTimeout(() => void broadcastRaidUpdate(fastify, lobbyId), delay);
}
