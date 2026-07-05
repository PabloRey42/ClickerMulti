import type { FastifyReply } from "fastify";
import { stringifyWithBigInt } from "@farm-clicker/shared";

/** Fastify's default serializer can't handle BigInt fields (e.g. currency amounts). */
export function sendJson(reply: FastifyReply, payload: unknown): void {
  reply.type("application/json").send(stringifyWithBigInt(payload));
}
