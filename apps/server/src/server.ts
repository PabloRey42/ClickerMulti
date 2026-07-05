import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import redisPlugin from "./plugins/redis.js";
import jwtPlugin from "./plugins/jwt.js";
import socketioPlugin from "./plugins/socketio.js";
import authRoutes from "./modules/auth/auth.routes.js";
import battleRoutes from "./modules/battle/battle.routes.js";
import collectionRoutes from "./modules/collection/collection.routes.js";

const fastify = Fastify({ logger: true });

try {
  await fastify.register(cors, { origin: env.CORS_ORIGIN });
  await fastify.register(redisPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(rateLimit, { global: false, redis: fastify.redis });
  await fastify.register(socketioPlugin);

  await fastify.register(authRoutes, { prefix: "/api" });
  await fastify.register(battleRoutes, { prefix: "/api" });
  await fastify.register(collectionRoutes, { prefix: "/api" });

  fastify.get("/api/health", async () => ({ status: "ok" }));

  await fastify.listen({ port: env.SERVER_PORT, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
