import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import { getShopCatalog, buyPokeball, InvalidPokeballError, InsufficientGoldError } from "./shop.service.js";

const buyParamsSchema = z.object({ key: z.string().min(1) });

export default async function shopRoutes(fastify: FastifyInstance) {
  fastify.get("/shop/pokeballs", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getShopCatalog(fastify.prisma, userId));
  });

  fastify.post(
    "/shop/pokeballs/:key/buy",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = buyParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await buyPokeball(fastify.prisma, userId, parsed.data.key));
      } catch (err) {
        if (err instanceof InvalidPokeballError) return reply.code(404).send({ error: "invalid_pokeball" });
        if (err instanceof InsufficientGoldError) return reply.code(409).send({ error: "insufficient_gold" });
        throw err;
      }
    },
  );
}
