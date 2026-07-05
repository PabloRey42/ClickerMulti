import { CLICK_PRODUCTION_SHARE_DEN, CLICK_PRODUCTION_SHARE_NUM } from "./constants.js";

/**
 * gain_clic = base_clic + (production_par_sec * 0.15)
 *
 * Computed as an exact integer ratio (15/100) so the click stays proportionally
 * useful as production grows, without ever touching floating point on a value
 * that counts as currency.
 */
export function computeClickGain(baseClickPower: bigint, productionPerSec: bigint): bigint {
  const productionShare =
    (productionPerSec * CLICK_PRODUCTION_SHARE_NUM) / CLICK_PRODUCTION_SHARE_DEN;
  return baseClickPower + productionShare;
}
