import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import {
  getQuestState,
  bumpQuestObjective,
  acceptQuest,
  claimQuest,
  QuestNotFoundError,
  QuestLockedError,
  QuestAlreadyStartedError,
  AnotherQuestActiveError,
  QuestNotReadyError,
} from "./quests.service.js";

/** Only navigation events with no natural server call of their own go through this ping —
 * everything else (entering a route, winning a fight, buying a potion, ...) is bumped
 * directly from the service function where that action already happens server-side. */
const pingBodySchema = z.object({ type: z.enum(["visit_world_map"]) });
const questParamsSchema = z.object({ questKey: z.string().min(1) });

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

  fastify.post("/quests/:questKey/accept", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = questParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    const { sub: userId } = request.user;
    try {
      sendJson(reply, await acceptQuest(fastify.prisma, userId, parsed.data.questKey));
    } catch (err) {
      if (err instanceof QuestNotFoundError) return reply.code(404).send({ error: "quest_not_found" });
      if (err instanceof QuestLockedError) return reply.code(409).send({ error: "quest_locked" });
      if (err instanceof QuestAlreadyStartedError) return reply.code(409).send({ error: "quest_already_started" });
      if (err instanceof AnotherQuestActiveError) return reply.code(409).send({ error: "another_quest_active" });
      throw err;
    }
  });

  fastify.post("/quests/:questKey/claim", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = questParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

    const { sub: userId } = request.user;
    try {
      sendJson(reply, await claimQuest(fastify.prisma, userId, parsed.data.questKey));
    } catch (err) {
      if (err instanceof QuestNotFoundError) return reply.code(404).send({ error: "quest_not_found" });
      if (err instanceof QuestNotReadyError) return reply.code(409).send({ error: "quest_not_ready" });
      throw err;
    }
  });
}
