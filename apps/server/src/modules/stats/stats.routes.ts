import type { FastifyInstance } from "fastify";
import { sendJson } from "../../lib/json.js";
import { getPlayerStats } from "./stats.service.js";

export default async function statsRoutes(fastify: FastifyInstance) {
  fastify.get("/stats", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getPlayerStats(fastify.prisma, userId));
  });
}
