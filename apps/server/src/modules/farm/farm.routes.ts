import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MAX_CLICKS_PER_SECOND } from "@farm-clicker/shared";
import { sendJson } from "../../lib/json.js";
import {
  buyGenerator,
  clickFarm,
  getFarmState,
  GeneratorNotFoundError,
  InsufficientFundsError,
} from "./farm.service.js";

const buyParamsSchema = z.object({ key: z.string().min(1) });

export default async function farmRoutes(fastify: FastifyInstance) {
  fastify.get("/farm/state", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    const state = await getFarmState(fastify.prisma, userId);
    sendJson(reply, state);
  });

  fastify.post(
    "/farm/click",
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
      const result = await clickFarm(fastify.prisma, userId);
      sendJson(reply, result);
    },
  );

  fastify.post(
    "/farm/generators/:key/buy",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = buyParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_params" });
      }

      const { sub: userId } = request.user;
      try {
        const result = await buyGenerator(fastify.prisma, userId, parsed.data.key);
        sendJson(reply, result);
      } catch (err) {
        if (err instanceof GeneratorNotFoundError) {
          return reply.code(404).send({ error: "generator_not_found" });
        }
        if (err instanceof InsufficientFundsError) {
          return reply.code(409).send({ error: "insufficient_funds" });
        }
        throw err;
      }
    },
  );
}
