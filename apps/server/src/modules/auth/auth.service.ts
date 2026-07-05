import { randomBytes, createHash } from "node:crypto";
import argon2 from "argon2";
import type { PrismaClient } from "@prisma/client";
import { parseDurationMs } from "../../lib/duration.js";
import { env } from "../../config/env.js";

const STARTER_POKEBALLS = 3;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserWithPlayerState(
  prisma: PrismaClient,
  params: { email: string; username: string; password: string },
) {
  const passwordHash = await hashPassword(params.password);

  const user = await prisma.user.create({
    data: {
      email: params.email,
      username: params.username,
      passwordHash,
      playerState: { create: {} },
      inventoryItems: {
        create: { itemKey: "pokeball_basic", quantity: STARTER_POKEBALLS },
      },
    },
  });

  return user;
}

/** Issues an opaque refresh token, storing only its hash so a DB leak can't be replayed. */
export async function issueRefreshToken(prisma: PrismaClient, userId: string): Promise<string> {
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + parseDurationMs(env.REFRESH_TOKEN_TTL));

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  return token;
}

export async function consumeRefreshToken(
  prisma: PrismaClient,
  token: string,
): Promise<{ userId: string; username: string } | null> {
  const tokenHash = hashToken(token);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    return null;
  }

  return { userId: record.userId, username: record.user.username };
}
