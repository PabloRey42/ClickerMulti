import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import {
  listCreatures,
  activateCreature,
  setTeamMembership,
  clearTeamExceptActive,
  reorderTeam,
  getStarterOptions,
  chooseStarter,
  useEvolutionStone,
  ackEvolutionReveal,
  CreatureNotFoundError,
  CreatureFaintedError,
  CreatureNotOnTeamError,
  TeamFullError,
  InvalidStarterError,
  StarterAlreadyChosenError,
  InvalidStoneError,
  NoStoneEvolutionError,
  InsufficientStonesError,
  InvalidTeamOrderError,
} from "./creatures.service.js";

const creatureParamsSchema = z.object({ id: z.string().min(1) });
const chooseStarterSchema = z.object({ speciesKey: z.string().min(1) });
const teamBodySchema = z.object({ onTeam: z.boolean() });
const useStoneSchema = z.object({ stoneKey: z.string().min(1) });
const reorderTeamSchema = z.object({ creatureIds: z.array(z.string().min(1)).min(1) });

export default async function creaturesRoutes(fastify: FastifyInstance) {
  fastify.get("/creatures", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await listCreatures(fastify.prisma, userId));
  });

  fastify.get("/creatures/starter-options", { preHandler: fastify.authenticate }, async (_request, reply) => {
    sendJson(reply, getStarterOptions());
  });

  fastify.post("/creatures/starter", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = chooseStarterSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { sub: userId } = request.user;
    try {
      sendJson(reply, await chooseStarter(fastify.prisma, userId, parsed.data.speciesKey));
    } catch (err) {
      if (err instanceof InvalidStarterError) return reply.code(400).send({ error: "invalid_starter" });
      if (err instanceof StarterAlreadyChosenError) {
        return reply.code(409).send({ error: "starter_already_chosen" });
      }
      throw err;
    }
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
        if (err instanceof CreatureNotOnTeamError) return reply.code(409).send({ error: "creature_not_on_team" });
        if (err instanceof CreatureFaintedError) return reply.code(409).send({ error: "creature_fainted" });
        throw err;
      }
    },
  );

  fastify.post(
    "/creatures/:id/team",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const params = creatureParamsSchema.safeParse(request.params);
      const body = teamBodySchema.safeParse(request.body);
      if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await setTeamMembership(fastify.prisma, userId, params.data.id, body.data.onTeam));
      } catch (err) {
        if (err instanceof CreatureNotFoundError) return reply.code(404).send({ error: "creature_not_found" });
        if (err instanceof TeamFullError) return reply.code(409).send({ error: "team_full" });
        throw err;
      }
    },
  );

  fastify.post("/creatures/team/clear", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await clearTeamExceptActive(fastify.prisma, userId));
  });

  fastify.post("/creatures/team/reorder", { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = reorderTeamSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });

    const { sub: userId } = request.user;
    try {
      sendJson(reply, await reorderTeam(fastify.prisma, userId, body.data.creatureIds));
    } catch (err) {
      if (err instanceof InvalidTeamOrderError) return reply.code(400).send({ error: "invalid_team_order" });
      throw err;
    }
  });

  fastify.post(
    "/creatures/:id/use-stone",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const params = creatureParamsSchema.safeParse(request.params);
      const body = useStoneSchema.safeParse(request.body);
      if (!params.success || !body.success) return reply.code(400).send({ error: "invalid_body" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await useEvolutionStone(fastify.prisma, userId, params.data.id, body.data.stoneKey));
      } catch (err) {
        if (err instanceof CreatureNotFoundError) return reply.code(404).send({ error: "creature_not_found" });
        if (err instanceof InvalidStoneError) return reply.code(400).send({ error: "invalid_stone" });
        if (err instanceof NoStoneEvolutionError) return reply.code(409).send({ error: "no_stone_evolution" });
        if (err instanceof InsufficientStonesError) return reply.code(409).send({ error: "insufficient_stones" });
        throw err;
      }
    },
  );

  fastify.post(
    "/creatures/:id/ack-evolution",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = creatureParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

      const { sub: userId } = request.user;
      await ackEvolutionReveal(fastify.prisma, userId, parsed.data.id);
      reply.code(204).send();
    },
  );
}
