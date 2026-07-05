export type CreatureType = "FIRE" | "WATER" | "GRASS";

/** Classic starter triangle: fire > grass > water > fire. */
const SUPER_EFFECTIVE: Record<CreatureType, CreatureType> = {
  FIRE: "GRASS",
  GRASS: "WATER",
  WATER: "FIRE",
};

const EFFECTIVENESS_NUM = 3n;
const EFFECTIVENESS_DEN = 2n;

/**
 * Returns the attacker's attack adjusted for type matchup, as an exact fixed-point
 * ratio (3/2 or 2/3) rather than a float multiplier, since this feeds into BigInt damage.
 */
export function applyTypeEffectiveness(
  attack: bigint,
  attackerType: CreatureType,
  defenderType: CreatureType,
): bigint {
  if (SUPER_EFFECTIVE[attackerType] === defenderType) {
    return (attack * EFFECTIVENESS_NUM) / EFFECTIVENESS_DEN;
  }
  if (SUPER_EFFECTIVE[defenderType] === attackerType) {
    return (attack * EFFECTIVENESS_DEN) / EFFECTIVENESS_NUM;
  }
  return attack;
}

const ATTACK_GROWTH_PERCENT_PER_LEVEL = 10;

/** Attack grows 10% of the species' base attack per level above 1. */
export function attackForLevel(baseAttack: number, level: number): bigint {
  const growthPercent = BigInt(100 + (level - 1) * ATTACK_GROWTH_PERCENT_PER_LEVEL);
  return (BigInt(baseAttack) * growthPercent) / 100n;
}

const XP_BASE = 20;
const XP_EXPONENT = 1.4;

/** XP curve is a design tuning value, not a currency ledger - float rounding is fine here. */
export function xpToNextLevel(level: number): bigint {
  return BigInt(Math.round(XP_BASE * level ** XP_EXPONENT));
}

const WILD_HP_GROWTH_PERCENT_PER_TIER = 15;

export function wildHpForTier(baseHp: number, tier: number): bigint {
  const growthPercent = BigInt(100 + (tier - 1) * WILD_HP_GROWTH_PERCENT_PER_TIER);
  return (BigInt(baseHp) * growthPercent) / 100n;
}

export const BASE_CAPTURE_CHANCE = 0.5;
export const XP_PER_VICTORY = 15n;

/** roll must be a uniform random value in [0, 1); the caller supplies it so this stays pure. */
export function rollCapture(roll: number, captureChance: number = BASE_CAPTURE_CHANCE): boolean {
  return roll < captureChance;
}
