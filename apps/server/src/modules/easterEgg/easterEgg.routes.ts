import type { FastifyInstance } from "fastify";
import { sendJson } from "../../lib/json.js";
import { claimDynavoltEasterEgg, DynavoltAlreadyClaimedError } from "./easterEgg.service.js";

export default async function easterEggRoutes(fastify: FastifyInstance) {
  fastify.post("/easter-eggs/dynavolt", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    try {
      sendJson(reply, await claimDynavoltEasterEgg(fastify.prisma, userId));
    } catch (err) {
      if (err instanceof DynavoltAlreadyClaimedError) {
        return reply.code(409).send({ error: "dynavolt_already_claimed" });
      }
      throw err;
    }
  });
}
