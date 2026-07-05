import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import { listCreatures, activateCreature, CreatureNotFoundError, CreatureFaintedError } from "./creatures.service.js";

const creatureParamsSchema = z.object({ id: z.string().min(1) });

export default async function creaturesRoutes(fastify: FastifyInstance) {
  fastify.get("/creatures", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await listCreatures(fastify.prisma, userId));
  });

  fastify.post(
    "/creatures/:id/activate",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = creatureParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await activateCreature(fastify.prisma, userId, parsed.data.id));
      } catch (err) {
        if (err instanceof CreatureNotFoundError) return reply.code(404).send({ error: "creature_not_found" });
        if (err instanceof CreatureFaintedError) return reply.code(409).send({ error: "creature_fainted" });
        throw err;
      }
    },
  );
}
