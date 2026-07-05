import Decimal from "decimal.js";
import type { ElementalType } from "../world/species.js";

const SUPER_EFFECTIVE: Record<ElementalType, ElementalType[]> = {
  feu: ["plante"],
  eau: ["feu"],
  plante: ["eau"],
  electrique: ["eau"],
  normal: [],
};

const NOT_VERY_EFFECTIVE: Record<ElementalType, ElementalType[]> = {
  feu: ["eau"],
  eau: ["plante"],
  plante: ["feu"],
  electrique: ["plante"],
  normal: [],
};

export function typeMultiplier(attackerType: ElementalType, defenderType: ElementalType): Decimal {
  if (SUPER_EFFECTIVE[attackerType].includes(defenderType)) return new Decimal(3).div(2);
  if (NOT_VERY_EFFECTIVE[attackerType].includes(defenderType)) return new Decimal(2).div(3);
  return new Decimal(1);
}

/** Damage dealt by one click-attack: attacker's attack stat scaled by combo momentum and type matchup. */
export function computeAttackDamage(attackerAttack: number, comboMultiplier: Decimal, typeMult: Decimal): number {
  const raw = new Decimal(attackerAttack).mul(comboMultiplier).mul(typeMult);
  return Math.max(1, raw.floor().toNumber());
}

/** Roll supplied by the caller (0-1) so this stays pure/testable, same idiom as the old prototype. */
export function rollCapture(roll: number, baseCaptureRate: number, ballMultiplier: number, hpRatio: number): boolean {
  const clampedHpRatio = Math.min(1, Math.max(0, hpRatio));
  const chance = Math.min(1, baseCaptureRate * ballMultiplier * (1 - clampedHpRatio * 0.7));
  return roll < chance;
}

export function creatureMaxHp(baseHp: number, level: number): number {
  return Math.round(baseHp + (level - 1) * baseHp * 0.12);
}

export function creatureAttack(baseAttack: number, level: number): number {
  return Math.round(baseAttack + (level - 1) * baseAttack * 0.15);
}

export function xpToNextLevel(level: number): number {
  return Math.round(20 * Math.pow(level, 1.4));
}

export function goldReward(defeatedLevel: number): bigint {
  return BigInt(10 + defeatedLevel * 4);
}

export function xpReward(defeatedLevel: number): number {
  return 8 + defeatedLevel * 3;
}
