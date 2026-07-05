import Decimal from "decimal.js";
import { COMBO_STACK_MAX, COMBO_STEP_PERCENT, COMBO_WINDOW_MS } from "./constants.js";

/**
 * Combo stacks build up while clicks land inside COMBO_WINDOW_MS of each other, and
 * reset the moment a click arrives late. The multiplier for the click that just
 * landed is based on the resulting stack count, so momentum rewards fast clicking
 * immediately rather than one click later.
 */
export function nextComboStacks(previousStacks: number, lastClickAt: Date, now: Date = new Date()): number {
  const withinWindow = now.getTime() - lastClickAt.getTime() <= COMBO_WINDOW_MS;
  if (!withinWindow) return 0;
  return Math.min(previousStacks + 1, COMBO_STACK_MAX);
}

export function comboMultiplier(stacks: number): Decimal {
  return new Decimal(1).plus(new Decimal(COMBO_STEP_PERCENT).div(100).mul(stacks));
}
