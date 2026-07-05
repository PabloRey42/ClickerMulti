import Decimal from "decimal.js";

/**
 * cost(n) = baseCost * costGrowth^n, rounded up to the nearest whole unit so a
 * generator never becomes affordable a fraction of a unit early.
 */
export function generatorCost(baseCost: bigint, costGrowth: string | number, ownedQuantity: number): bigint {
  const cost = new Decimal(baseCost.toString()).mul(new Decimal(costGrowth).pow(ownedQuantity));
  return BigInt(cost.ceil().toFixed(0));
}
