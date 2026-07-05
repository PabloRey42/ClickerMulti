import fp from "fastify-plugin";
import { Redis } from "ioredis";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const redis = new Redis(env.REDIS_URL);

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async (instance) => {
    instance.redis.disconnect();
  });
});
