import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAX_CLICKS_PER_SECOND } from "@farm-clicker/shared";
import { sendJson } from "../../lib/json.js";
import {
  getExplorationState,
  enterRoute,
  attackEncounter,
  captureEncounter,
  finishEncounter,
  fleeEncounter,
  healActiveCreature,
  RouteNotFoundError,
  NoActiveCreatureError,
  ActiveCreatureFaintedError,
  NoEncounterError,
  EncounterNotDefeatedError,
  InvalidPokeballError,
  InsufficientPokeballsError,
} from "./exploration.service.js";

const routeParamsSchema = z.object({ routeKey: z.string().min(1) });
const captureBodySchema = z.object({ pokeballKey: z.string().min(1) });

export default async function explorationRoutes(fastify: FastifyInstance) {
  fastify.get("/exploration/state", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getExplorationState(fastify.prisma, userId));
  });

  fastify.post(
    "/exploration/routes/:routeKey/enter",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = routeParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await enterRoute(fastify.prisma, userId, parsed.data.routeKey));
      } catch (err) {
        if (err instanceof RouteNotFoundError) return reply.code(404).send({ error: "route_not_found" });
        if (err instanceof NoActiveCreatureError) return reply.code(409).send({ error: "no_active_creature" });
        if (err instanceof ActiveCreatureFaintedError) {
          return reply.code(409).send({ error: "active_creature_fainted" });
        }
        throw err;
      }
    },
  );

  fastify.post(
    "/exploration/encounter/attack",
    {
      preHandler: fastify.authenticate,
      // IP-based (not per-user): rate-limit's onRequest hook runs before our preHandler
      // auth check, so request.user isn't populated yet at key-generation time.
      config: { rateLimit: { max: MAX_CLICKS_PER_SECOND, timeWindow: "1 second" } },
    },
    async (request, reply) => {
      const { sub: userId } = request.user;
      try {
        sendJson(reply, await attackEncounter(fastify.prisma, userId));
      } catch (err) {
        if (err instanceof NoEncounterError) return reply.code(409).send({ error: "no_encounter" });
        if (err instanceof NoActiveCreatureError) return reply.code(409).send({ error: "no_active_creature" });
        throw err;
      }
    },
  );

  fastify.post(
    "/exploration/encounter/capture",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = captureBodySchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await captureEncounter(fastify.prisma, userId, parsed.data.pokeballKey));
      } catch (err) {
        if (err instanceof InvalidPokeballError) return reply.code(400).send({ error: "invalid_pokeball" });
        if (err instanceof NoEncounterError) return reply.code(409).send({ error: "no_encounter" });
        if (err instanceof EncounterNotDefeatedError) {
          return reply.code(409).send({ error: "encounter_not_defeated" });
        }
        if (err instanceof InsufficientPokeballsError) {
          return reply.code(409).send({ error: "insufficient_pokeballs" });
        }
        throw err;
      }
    },
  );

  fastify.post(
    "/exploration/encounter/finish",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const { sub: userId } = request.user;
      try {
        sendJson(reply, await finishEncounter(fastify.prisma, userId));
      } catch (err) {
        if (err instanceof NoEncounterError) return reply.code(409).send({ error: "no_encounter" });
        if (err instanceof EncounterNotDefeatedError) {
          return reply.code(409).send({ error: "encounter_not_defeated" });
        }
        throw err;
      }
    },
  );

  fastify.post("/exploration/encounter/flee", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    try {
      sendJson(reply, await fleeEncounter(fastify.prisma, userId));
    } catch (err) {
      if (err instanceof NoEncounterError) return reply.code(409).send({ error: "no_encounter" });
      throw err;
    }
  });

  fastify.post("/exploration/heal", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    try {
      sendJson(reply, await healActiveCreature(fastify.prisma, userId));
    } catch (err) {
      if (err instanceof NoActiveCreatureError) return reply.code(409).send({ error: "no_active_creature" });
      throw err;
    }
  });
}
