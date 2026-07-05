import { MAX_OFFLINE_SECONDS } from "./constants.js";

/**
 * Idle production owed since lastTickAt, capped so offline time can't accrue forever.
 * Always computed server-side against a server-trusted timestamp.
 */
export function computeOfflineGain(
  productionPerSec: bigint,
  lastTickAt: Date,
  now: Date = new Date(),
): { gained: bigint; elapsedSeconds: number } {
  const rawElapsedMs = now.getTime() - lastTickAt.getTime();
  const rawElapsedSeconds = Math.max(0, Math.floor(rawElapsedMs / 1000));
  const elapsedSeconds = Math.min(rawElapsedSeconds, MAX_OFFLINE_SECONDS);
  const gained = productionPerSec * BigInt(elapsedSeconds);
  return { gained, elapsedSeconds };
}
