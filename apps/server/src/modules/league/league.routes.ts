import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import {
  getLeagueState,
  challengeLeague,
  investSkillNode,
  InvalidSkillBranchError,
  SkillBranchMaxedError,
  NoSkillPointsError,
} from "./league.service.js";
import { NoActiveCreatureError, ActiveCreatureFaintedError } from "../exploration/exploration.service.js";

const investBodySchema = z.object({ branch: z.string().min(1) });

export default async function leagueRoutes(fastify: FastifyInstance) {
  fastify.get("/league/state", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getLeagueState(fastify.prisma, userId));
  });

  fastify.post("/league/challenge", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    try {
      sendJson(reply, await challengeLeague(fastify.prisma, userId));
    } catch (err) {
      if (err instanceof NoActiveCreatureError) return reply.code(409).send({ error: "no_active_creature" });
      if (err instanceof ActiveCreatureFaintedError) {
        return reply.code(409).send({ error: "active_creature_fainted" });
      }
      throw err;
    }
  });

  fastify.post("/league/skill-tree/invest", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = investBodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { sub: userId } = request.user;
    try {
      sendJson(reply, await investSkillNode(fastify.prisma, userId, parsed.data.branch));
    } catch (err) {
      if (err instanceof InvalidSkillBranchError) return reply.code(400).send({ error: "invalid_skill_branch" });
      if (err instanceof SkillBranchMaxedError) return reply.code(409).send({ error: "skill_branch_maxed" });
      if (err instanceof NoSkillPointsError) return reply.code(409).send({ error: "no_skill_points" });
      throw err;
    }
  });
}
