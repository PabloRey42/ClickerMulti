import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import redisPlugin from "./plugins/redis.js";
import jwtPlugin from "./plugins/jwt.js";
import socketioPlugin from "./plugins/socketio.js";
import authRoutes from "./modules/auth/auth.routes.js";
import explorationRoutes from "./modules/exploration/exploration.routes.js";
import creaturesRoutes from "./modules/creatures/creatures.routes.js";
import shopRoutes from "./modules/shop/shop.routes.js";
import leagueRoutes from "./modules/league/league.routes.js";
import marketRoutes from "./modules/market/market.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import questsRoutes from "./modules/quests/quests.routes.js";
import statsRoutes from "./modules/stats/stats.routes.js";
import easterEggRoutes from "./modules/easterEgg/easterEgg.routes.js";

const fastify = Fastify({ logger: true });

try {
  await fastify.register(cors, { origin: env.CORS_ORIGIN });
  await fastify.register(redisPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(rateLimit, { global: false, redis: fastify.redis });
  await fastify.register(socketioPlugin);

  await fastify.register(authRoutes, { prefix: "/api" });
  await fastify.register(explorationRoutes, { prefix: "/api" });
  await fastify.register(creaturesRoutes, { prefix: "/api" });
  await fastify.register(shopRoutes, { prefix: "/api" });
  await fastify.register(leagueRoutes, { prefix: "/api" });
  await fastify.register(marketRoutes, { prefix: "/api" });
  await fastify.register(adminRoutes, { prefix: "/api" });
  await fastify.register(questsRoutes, { prefix: "/api" });
  await fastify.register(statsRoutes, { prefix: "/api" });
  await fastify.register(easterEggRoutes, { prefix: "/api" });

  fastify.get("/api/health", async () => ({ status: "ok" }));

  await fastify.listen({ port: env.SERVER_PORT, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
