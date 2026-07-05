/** Part of the click damage that comes from a share of total auto-attack/sec (see click.ts). */
export const CLICK_PRODUCTION_SHARE_NUM = 15n;
export const CLICK_PRODUCTION_SHARE_DEN = 100n;

/** Flat damage every trainer deals on a click, before the auto-attack share is added. */
export const BASE_CLICK_DAMAGE = 10n;

/** Offline/idle progression is capped so time away can't be gamed indefinitely. */
export const MAX_OFFLINE_SECONDS = 24 * 60 * 60;

/** Anti-spam: server-enforced max clicks per player per second. */
export const MAX_CLICKS_PER_SECOND = 10;
