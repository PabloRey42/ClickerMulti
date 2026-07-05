import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendJson } from "../../lib/json.js";
import {
  getListings,
  createListing,
  cancelListing,
  buyListing,
  CreatureNotFoundError,
  AlreadyListedError,
  InvalidItemError,
  InsufficientItemsError,
  InvalidListingError,
  ListingNotFoundError,
  CannotBuyOwnListingError,
  InsufficientGoldError,
} from "./market.service.js";

const listingParamsSchema = z.object({ id: z.string().min(1) });

const createListingBodySchema = z.object({
  assetType: z.enum(["ITEM", "CREATURE"]),
  itemKey: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  creatureId: z.string().min(1).optional(),
  askGoldPrice: z.string().regex(/^\d+$/),
});

export default async function marketRoutes(fastify: FastifyInstance) {
  fastify.get("/market/listings", { preHandler: fastify.authenticate }, async (request, reply) => {
    const { sub: userId } = request.user;
    sendJson(reply, await getListings(fastify.prisma, userId));
  });

  fastify.post("/market/listings", { preHandler: fastify.authenticate }, async (request, reply) => {
    const parsed = createListingBodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    const { sub: userId } = request.user;
    try {
      sendJson(
        reply,
        await createListing(fastify.prisma, userId, {
          ...parsed.data,
          askGoldPrice: BigInt(parsed.data.askGoldPrice),
        }),
      );
    } catch (err) {
      if (err instanceof CreatureNotFoundError) return reply.code(404).send({ error: "creature_not_found" });
      if (err instanceof AlreadyListedError) return reply.code(409).send({ error: "already_listed" });
      if (err instanceof InvalidItemError) return reply.code(400).send({ error: "invalid_item" });
      if (err instanceof InsufficientItemsError) return reply.code(409).send({ error: "insufficient_items" });
      if (err instanceof InvalidListingError) return reply.code(400).send({ error: "invalid_listing" });
      throw err;
    }
  });

  fastify.post(
    "/market/listings/:id/buy",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = listingParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await buyListing(fastify.prisma, userId, parsed.data.id));
      } catch (err) {
        if (err instanceof ListingNotFoundError) return reply.code(404).send({ error: "listing_not_found" });
        if (err instanceof CannotBuyOwnListingError) {
          return reply.code(409).send({ error: "cannot_buy_own_listing" });
        }
        if (err instanceof InsufficientGoldError) return reply.code(409).send({ error: "insufficient_gold" });
        throw err;
      }
    },
  );

  fastify.post(
    "/market/listings/:id/cancel",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = listingParamsSchema.safeParse(request.params);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_params" });

      const { sub: userId } = request.user;
      try {
        sendJson(reply, await cancelListing(fastify.prisma, userId, parsed.data.id));
      } catch (err) {
        if (err instanceof ListingNotFoundError) return reply.code(404).send({ error: "listing_not_found" });
        throw err;
      }
    },
  );
}
