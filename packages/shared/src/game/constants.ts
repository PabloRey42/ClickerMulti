/** Anti-spam: server-enforced max clicks per player per second. */
export const MAX_CLICKS_PER_SECOND = 10;

/** Consecutive clicks inside this window keep the combo alive instead of resetting it. */
export const COMBO_WINDOW_MS = 1200;

/** Combo multiplier caps at 1 + COMBO_STACK_MAX * COMBO_STEP_PERCENT / 100. */
export const COMBO_STACK_MAX = 20;
export const COMBO_STEP_PERCENT = 5;

/** Max creatures a player can field on their team at once (classic Pokémon party size). */
export const MAX_TEAM_SIZE = 6;
