import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import { getShopCatalog, buyItem, InvalidItemError, InsufficientGoldError } from "./shop.service.js";

const buyParamsSchema = z.object({ key: z.string().min(1) });
const buyBodySchema = z.object({ quantity: z.number().int().min(1).max(99).default(1) });

export default async function shopRoutes(fastify: FastifyInstance) {
  fastify.get("/shop/pokeballs", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getShopCatalog(fastify.prisma, userId));
  });

  fastify.post(
    "/shop/items/:key/buy",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = buyParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });
      const body = buyBodySchema.safeParse(request.body ?? {});
      if (!body.success) return reply.code(400).send({ error: "invalid_body" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await buyItem(fastify.prisma, userId, parsed.data.key, body.data.quantity));
      } catch (err) {
        if (err instanceof InvalidItemError) return reply.code(404).send({ error: "invalid_item" });
        if (err instanceof InsufficientGoldError) return reply.code(409).send({ error: "insufficient_gold" });
        throw err;
      }
    },
  );
}
