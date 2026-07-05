import fp from "fastify-plugin";
import { Server as SocketIOServer } from "socket.io";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import type { AccessTokenPayload } from "./jwt.js";

declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

/**
 * Wired up now (JWT-authenticated handshake) so chat/guild-boss modules can plug into
 * `fastify.io` later without touching the connection/auth boilerplate again.
 */
export default fp(async (fastify: FastifyInstance) => {
  const io = new SocketIOServer(fastify.server, {
    cors: { origin: env.CORS_ORIGIN },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error("missing_token");
      socket.data.user = fastify.jwt.verify<AccessTokenPayload>(token);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    fastify.log.info({ userId: socket.data.user?.sub }, "socket connected");
  });

  fastify.decorate("io", io);

  fastify.addHook("onClose", (instance, done) => {
    instance.io.close();
    done();
  });
});
