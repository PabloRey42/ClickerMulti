import type { FastifyInstance } from "fastify";
import type { CollectionResponse } from "@farm-clicker/shared";
import { sendJson } from "../../lib/json.js";
import { toCreatureView } from "../battle/battle.service.js";

export default async function collectionRoutes(fastify: FastifyInstance) {
  fastify.get("/collection", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    const creatures = await fastify.prisma.creature.findMany({
      where: { userId },
      include: { species: true },
      orderBy: { caughtAt: "asc" },
    });

    const body: CollectionResponse = creatures.map(toCreatureView);
    sendJson(reply, body);
  });
}
