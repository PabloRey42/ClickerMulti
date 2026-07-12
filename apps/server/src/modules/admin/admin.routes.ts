import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAX_LEVEL } from "@farm-clicker/shared";
import { sendJson } from "../../lib/json.js";
import { requireAdmin } from "../../lib/admin-auth.js";
import {
  listUsers,
  getUserDetail,
  setGold,
  setPassword,
  setForceShinyMode,
  setShinyCharm,
  giveCreature,
  setCreatureShiny,
  deleteCreature,
  setInventoryItem,
  deleteUser,
  UserNotFoundError,
  InvalidSpeciesError,
  CreatureNotFoundError,
  InvalidItemError,
} from "./admin.service.js";
import {
  adminForceLobbyTimeout,
  adminSetBossHp,
  RaidLobbyNotFoundError,
  RaidLobbyNotInProgressError,
} from "../raid/raid.service.js";
import { broadcastRaidUpdate } from "../raid/raid.timers.js";

const userParamsSchema = z.object({ userId: z.string().min(1) });
const creatureParamsSchema = z.object({ userId: z.string().min(1), creatureId: z.string().min(1) });
const itemParamsSchema = z.object({ userId: z.string().min(1), itemKey: z.string().min(1) });
const raidLobbyParamsSchema = z.object({ lobbyId: z.string().min(1) });

const goldBodySchema = z.object({ goldBalance: z.string().regex(/^\d+$/) });
const forceShinyBodySchema = z.object({ enabled: z.boolean() });
const shinyCharmBodySchema = z.object({ enabled: z.boolean() });
const passwordBodySchema = z.object({ password: z.string().min(8).max(100) });
const creatureBodySchema = z.object({ speciesKey: z.string().min(1), level: z.number().int().min(1).max(MAX_LEVEL) });
const creatureShinyBodySchema = z.object({ isShiny: z.boolean() });
const itemBodySchema = z.object({ quantity: z.number().int().min(0).max(999999) });
const raidBossHpBodySchema = z.object({ bossCurrentHp: z.number().int().min(0) });

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);
  fastify.addHook("preHandler", requireAdmin);

  fastify.get("/admin/users", async (_request, reply) => {
    sendJson(reply, { users: await listUsers(fastify.prisma) });
  });

  fastify.get("/admin/users/:userId", async (request, reply) => {
    const parsed = userParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    try {
      sendJson(reply, await getUserDetail(fastify.prisma, parsed.data.userId));
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      throw err;
    }
  });

  fastify.patch("/admin/users/:userId/gold", async (request, reply) => {
    const params = userParamsSchema.safeParse(request.params);
    const body = goldBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      sendJson(reply, await setGold(fastify.prisma, params.data.userId, BigInt(body.data.goldBalance)));
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      throw err;
    }
  });

  fastify.patch("/admin/users/:userId/force-shiny", async (request, reply) => {
    const params = userParamsSchema.safeParse(request.params);
    const body = forceShinyBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      sendJson(reply, await setForceShinyMode(fastify.prisma, params.data.userId, body.data.enabled));
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      throw err;
    }
  });

  fastify.patch("/admin/users/:userId/shiny-charm", async (request, reply) => {
    const params = userParamsSchema.safeParse(request.params);
    const body = shinyCharmBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      sendJson(reply, await setShinyCharm(fastify.prisma, params.data.userId, body.data.enabled));
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      throw err;
    }
  });

  fastify.patch("/admin/users/:userId/password", async (request, reply) => {
    const params = userParamsSchema.safeParse(request.params);
    const body = passwordBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      sendJson(reply, await setPassword(fastify.prisma, params.data.userId, body.data.password));
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      throw err;
    }
  });

  fastify.post("/admin/users/:userId/creatures", async (request, reply) => {
    const params = userParamsSchema.safeParse(request.params);
    const body = creatureBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      sendJson(
        reply,
        await giveCreature(fastify.prisma, params.data.userId, body.data.speciesKey, body.data.level),
      );
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      if (err instanceof InvalidSpeciesError) return reply.code(400).send({ error: "invalid_species" });
      throw err;
    }
  });

  fastify.patch("/admin/users/:userId/creatures/:creatureId/shiny", async (request, reply) => {
    const params = creatureParamsSchema.safeParse(request.params);
    const body = creatureShinyBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      sendJson(
        reply,
        await setCreatureShiny(fastify.prisma, params.data.userId, params.data.creatureId, body.data.isShiny),
      );
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      if (err instanceof CreatureNotFoundError) return reply.code(404).send({ error: "creature_not_found" });
      throw err;
    }
  });

  fastify.delete("/admin/users/:userId/creatures/:creatureId", async (request, reply) => {
    const parsed = creatureParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    try {
      sendJson(reply, await deleteCreature(fastify.prisma, parsed.data.userId, parsed.data.creatureId));
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      if (err instanceof CreatureNotFoundError) return reply.code(404).send({ error: "creature_not_found" });
      throw err;
    }
  });

  fastify.patch("/admin/users/:userId/items/:itemKey", async (request, reply) => {
    const params = itemParamsSchema.safeParse(request.params);
    const body = itemBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      sendJson(
        reply,
        await setInventoryItem(fastify.prisma, params.data.userId, params.data.itemKey, body.data.quantity),
      );
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      if (err instanceof InvalidItemError) return reply.code(400).send({ error: "invalid_item" });
      throw err;
    }
  });

  // QA escape hatches for raids: this dev machine has no local Docker/DB, so raids can only
  // ever be played end-to-end on the VPS, and waiting out real 2min/3min timers on every
  // playtest iteration isn't practical — these fast-forward the current deadline or set the
  // boss HP directly, reusing raid.service.ts's own lock/self-heal/broadcast path.
  fastify.patch("/admin/raids/:lobbyId/force-timeout", async (request, reply) => {
    const parsed = raidLobbyParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    try {
      const lobby = await adminForceLobbyTimeout(fastify.prisma, parsed.data.lobbyId);
      await broadcastRaidUpdate(fastify, lobby.id);
      sendJson(reply, lobby);
    } catch (err) {
      if (err instanceof RaidLobbyNotFoundError) return reply.code(404).send({ error: "raid_lobby_not_found" });
      throw err;
    }
  });

  fastify.patch("/admin/raids/:lobbyId/set-boss-hp", async (request, reply) => {
    const params = raidLobbyParamsSchema.safeParse(request.params);
    const body = raidBossHpBodySchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

    try {
      const lobby = await adminSetBossHp(fastify.prisma, params.data.lobbyId, body.data.bossCurrentHp);
      await broadcastRaidUpdate(fastify, lobby.id);
      sendJson(reply, lobby);
    } catch (err) {
      if (err instanceof RaidLobbyNotFoundError) return reply.code(404).send({ error: "raid_lobby_not_found" });
      if (err instanceof RaidLobbyNotInProgressError) {
        return reply.code(409).send({ error: "raid_lobby_not_in_progress" });
      }
      throw err;
    }
  });

  fastify.delete("/admin/users/:userId", async (request, reply) => {
    const parsed = userParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    try {
      await deleteUser(fastify.prisma, parsed.data.userId);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof UserNotFoundError) return reply.code(404).send({ error: "user_not_found" });
      throw err;
    }
  });
}
