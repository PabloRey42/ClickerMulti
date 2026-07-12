import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAX_CLICKS_PER_SECOND } from "@farm-clicker/shared";
import { sendJson } from "../../lib/json.js";
import {
  listOpenLobbiesForHotspot,
  createLobby,
  getLobby,
  joinLobby,
  leaveLobby,
  startLobby,
  attackBoss,
  RaidHotspotNotFoundError,
  RaidLobbyNotFoundError,
  RaidAlreadyInActiveLobbyError,
  RaidLobbyFullError,
  RaidLobbyNotJoinableError,
  RaidNotParticipantError,
  RaidNotCreatorError,
  RaidNotEnoughParticipantsError,
  RaidLobbyNotInProgressError,
  RaidNoActiveCreatureError,
  RaidActiveCreatureFaintedError,
} from "./raid.service.js";
import { scheduleAutoStart, scheduleBattleEnd, broadcastRaidUpdate } from "./raid.timers.js";

const hotspotParamsSchema = z.object({ hotspotId: z.string().min(1) });
const lobbyParamsSchema = z.object({ lobbyId: z.string().min(1) });

function mapRaidError(err: unknown): { status: number; error: string } | undefined {
  if (err instanceof RaidHotspotNotFoundError) return { status: 404, error: "raid_hotspot_not_found" };
  if (err instanceof RaidLobbyNotFoundError) return { status: 404, error: "raid_lobby_not_found" };
  if (err instanceof RaidAlreadyInActiveLobbyError) return { status: 409, error: "raid_already_in_active_lobby" };
  if (err instanceof RaidLobbyFullError) return { status: 409, error: "raid_lobby_full" };
  if (err instanceof RaidLobbyNotJoinableError) return { status: 409, error: "raid_lobby_not_joinable" };
  if (err instanceof RaidNotParticipantError) return { status: 403, error: "raid_not_participant" };
  if (err instanceof RaidNotCreatorError) return { status: 403, error: "raid_not_creator" };
  if (err instanceof RaidNotEnoughParticipantsError) return { status: 409, error: "raid_not_enough_participants" };
  if (err instanceof RaidLobbyNotInProgressError) return { status: 409, error: "raid_lobby_not_in_progress" };
  if (err instanceof RaidNoActiveCreatureError) return { status: 409, error: "no_active_creature" };
  if (err instanceof RaidActiveCreatureFaintedError) return { status: 409, error: "active_creature_fainted" };
  return undefined;
}

export default async function raidRoutes(fastify: FastifyInstance) {
  fastify.get("/raids/hotspot/:hotspotId", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = hotspotParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });
    sendJson(reply, await listOpenLobbiesForHotspot(fastify.prisma, parsed.data.hotspotId));
  });

  fastify.post("/raids/hotspot/:hotspotId", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = hotspotParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    const { sub: userId } = request.user;
    try {
      const lobby = await createLobby(fastify.prisma, userId, parsed.data.hotspotId);
      scheduleAutoStart(fastify, lobby.id, new Date(lobby.startsAt));
      sendJson(reply, lobby);
    } catch (err) {
      const mapped = mapRaidError(err);
      if (mapped) return reply.code(mapped.status).send({ error: mapped.error });
      throw err;
    }
  });

  fastify.get("/raids/:lobbyId", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = lobbyParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    const { sub: userId } = request.user;
    try {
      sendJson(reply, await getLobby(fastify.prisma, userId, parsed.data.lobbyId));
    } catch (err) {
      const mapped = mapRaidError(err);
      if (mapped) return reply.code(mapped.status).send({ error: mapped.error });
      throw err;
    }
  });

  fastify.post("/raids/:lobbyId/join", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = lobbyParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    const { sub: userId } = request.user;
    try {
      const lobby = await joinLobby(fastify.prisma, userId, parsed.data.lobbyId);
      await broadcastRaidUpdate(fastify, lobby.id);
      sendJson(reply, lobby);
    } catch (err) {
      const mapped = mapRaidError(err);
      if (mapped) return reply.code(mapped.status).send({ error: mapped.error });
      throw err;
    }
  });

  fastify.post("/raids/:lobbyId/leave", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = lobbyParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    const { sub: userId } = request.user;
    try {
      const lobby = await leaveLobby(fastify.prisma, userId, parsed.data.lobbyId);
      await broadcastRaidUpdate(fastify, lobby.id);
      sendJson(reply, lobby);
    } catch (err) {
      const mapped = mapRaidError(err);
      if (mapped) return reply.code(mapped.status).send({ error: mapped.error });
      throw err;
    }
  });

  fastify.post("/raids/:lobbyId/start", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = lobbyParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    const { sub: userId } = request.user;
    try {
      const lobby = await startLobby(fastify.prisma, userId, parsed.data.lobbyId);
      if (lobby.battleEndsAt) scheduleBattleEnd(fastify, lobby.id, new Date(lobby.battleEndsAt));
      await broadcastRaidUpdate(fastify, lobby.id);
      sendJson(reply, lobby);
    } catch (err) {
      const mapped = mapRaidError(err);
      if (mapped) return reply.code(mapped.status).send({ error: mapped.error });
      throw err;
    }
  });

  fastify.post(
    "/raids/:lobbyId/attack",
    {
      preHandler: fastify.authenticate,
      config: { rateLimit: { max: MAX_CLICKS_PER_SECOND, timeWindow: "1 second" } },
    },
    async (request, reply) => {
      const parsed = lobbyParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

      const { sub: userId } = request.user;
      try {
        const result = await attackBoss(fastify.prisma, userId, parsed.data.lobbyId);
        await broadcastRaidUpdate(fastify, result.lobby.id);
        sendJson(reply, result);
      } catch (err) {
        const mapped = mapRaidError(err);
        if (mapped) return reply.code(mapped.status).send({ error: mapped.error });
        throw err;
      }
    },
  );
}
