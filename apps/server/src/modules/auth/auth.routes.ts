import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { AuthResponse } from "@farm-clicker/shared";
import {
  consumeRefreshToken,
  createUserWithPlayerState,
  issueRefreshToken,
  verifyPassword,
} from "./auth.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }

    try {
      const user = await createUserWithPlayerState(fastify.prisma, parsed.data);
      const accessToken = await reply.jwtSign({ sub: user.id, username: user.username, email: user.email });
      const refreshToken = await issueRefreshToken(fastify.prisma, user.id);

      const body: AuthResponse = {
        user: { id: user.id, email: user.email, username: user.username },
        accessToken,
        refreshToken,
      };
      return reply.code(201).send(body);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return reply.code(409).send({ error: "email_or_username_taken" });
      }
      throw err;
    }
  });

  fastify.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }

    const user = await fastify.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const accessToken = await reply.jwtSign({ sub: user.id, username: user.username, email: user.email });
    const refreshToken = await issueRefreshToken(fastify.prisma, user.id);

    const body: AuthResponse = {
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
      refreshToken,
    };
    return reply.send(body);
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }

    const session = await consumeRefreshToken(fastify.prisma, parsed.data.refreshToken);
    if (!session) {
      return reply.code(401).send({ error: "invalid_refresh_token" });
    }

    const accessToken = await reply.jwtSign({ sub: session.userId, username: session.username, email: session.email });
    return reply.send({ accessToken });
  });
}
