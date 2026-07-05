import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import {
  getLeagueState,
  challengeLeague,
  investSpecializationPoint,
  InvalidSpecializationTypeError,
  NoSpecializationPointsError,
} from "./league.service.js";
import { NoActiveCreatureError, ActiveCreatureFaintedError } from "../exploration/exploration.service.js";

const specializeBodySchema = z.object({ elementalType: z.string().min(1) });

export default async function leagueRoutes(fastify: FastifyInstance) {
  fastify.get("/league/state", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getLeagueState(fastify.prisma, userId));
  });

  fastify.post("/league/challenge", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    try {
      sendJson(reply, await challengeLeague(fastify.prisma, userId));
    } catch (err) {
      if (err instanceof NoActiveCreatureError) return reply.code(409).send({ error: "no_active_creature" });
      if (err instanceof ActiveCreatureFaintedError) {
        return reply.code(409).send({ error: "active_creature_fainted" });
      }
      throw err;
    }
  });

  fastify.post("/league/specialize", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = specializeBodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { sub: userId } = request.user;
    try {
      sendJson(reply, await investSpecializationPoint(fastify.prisma, userId, parsed.data.elementalType));
    } catch (err) {
      if (err instanceof InvalidSpecializationTypeError) {
        return reply.code(400).send({ error: "invalid_specialization_type" });
      }
      if (err instanceof NoSpecializationPointsError) {
        return reply.code(409).send({ error: "no_specialization_points" });
      }
      throw err;
    }
  });
}
