import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import { getQuestState, bumpQuestObjective } from "./quests.service.js";

/** Only navigation events with no natural server call of their own go through this ping —
 * everything else (entering a route, winning a fight, buying a potion, ...) is bumped
 * directly from the service function where that action already happens server-side. */
const pingBodySchema = z.object({ type: z.enum(["visit_world_map"]) });

export default async function questsRoutes(fastify: FastifyInstance) {
  fastify.get("/quests", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getQuestState(fastify.prisma, userId));
  });

  fastify.post("/quests/ping", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = pingBodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { sub: userId } = request.user;
    await bumpQuestObjective(fastify.prisma, userId, parsed.data.type);
    sendJson(reply, await getQuestState(fastify.prisma, userId));
  });
}
