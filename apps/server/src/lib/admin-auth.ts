import type { FastifyReply, FastifyRequest } from "fastify";

/** Single hardcoded admin account — no role system, just a gate on this one address. */
export const ADMIN_EMAIL = "admin@admin.com";

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.user.email !== ADMIN_EMAIL) {
    await reply.code(403).send({ error: "forbidden" });
  }
}
