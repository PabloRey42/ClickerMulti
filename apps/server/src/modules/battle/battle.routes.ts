import type { FastifyInstance } from "fastify";
import { MAX_CLICKS_PER_SECOND } from "@farm-clicker/shared";
import { sendJson } from "../../lib/json.js";
import { getBattleState, processAttack } from "./battle.service.js";

export default async function battleRoutes(fastify: FastifyInstance) {
  fastify.get("/battle/state", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    const state = await getBattleState(fastify.prisma, userId);
    sendJson(reply, state);
  });

  fastify.post(
    "/battle/attack",
    {
      preHandler: fastify.authenticate,
      // IP-based (not per-user): @fastify/rate-limit's onRequest hook runs before our
      // preHandler auth check, so request.user isn't populated yet at key-generation time.
      config: {
        rateLimit: {
          max: MAX_CLICKS_PER_SECOND,
          timeWindow: "1 second",
        },
      },
    },
    async (request, reply) => {
      const { sub: userId } = request.user;
      const result = await processAttack(fastify.prisma, userId);
      sendJson(reply, result);
    },
  );
}
