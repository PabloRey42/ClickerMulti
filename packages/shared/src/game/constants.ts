/** Part of the click gain that comes from a share of total production/sec (see click.ts). */
export const CLICK_PRODUCTION_SHARE_NUM = 15n;
export const CLICK_PRODUCTION_SHARE_DEN = 100n;

/** Flat resource gain every click deals, before the production share is added. */
export const BASE_CLICK_POWER = 10n;

/** Flat amount of the click-only meta currency (affection) granted per click. */
export const AFFECTION_PER_CLICK = 1n;

/** Idle/offline progression is capped so time away can't be gamed indefinitely. */
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

/** Anti-spam: server-enforced max clicks per player per second. */
export const MAX_CLICKS_PER_SECOND = 10;

/** Consecutive clicks inside this window keep the combo alive instead of resetting it. */
export const COMBO_WINDOW_MS = 1200;

/** Combo multiplier caps at 1 + COMBO_STACK_MAX * COMBO_STEP_PERCENT / 100. */
export const COMBO_STACK_MAX = 20;
export const COMBO_STEP_PERCENT = 5;

/** Default per-unit cost growth rate for generators (15% pricier per unit owned). */
export const GENERATOR_COST_GROWTH_DEFAULT = "1.15";
