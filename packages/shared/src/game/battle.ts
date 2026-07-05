import Decimal from "decimal.js";
import type { ElementalType } from "../world/species.js";

/** Real Pokémon type chart (matches the actual games exactly, Fairy type included).
 * Attacker type -> defender type -> multiplier. Omitted pairs default to neutral (1). */
const TYPE_CHART: Record<ElementalType, Partial<Record<ElementalType, number>>> = {
  normal: { roche: 0.5, spectre: 0, acier: 0.5 },
  feu: { feu: 0.5, eau: 0.5, plante: 2, glace: 2, insecte: 2, roche: 0.5, dragon: 0.5, acier: 2 },
  eau: { feu: 2, eau: 0.5, plante: 0.5, sol: 2, roche: 2, dragon: 0.5 },
  plante: {
    feu: 0.5,
    eau: 2,
    plante: 0.5,
    poison: 0.5,
    sol: 2,
    vol: 0.5,
    insecte: 0.5,
    roche: 2,
    dragon: 0.5,
    acier: 0.5,
  },
  electrique: { eau: 2, electrique: 0.5, plante: 0.5, sol: 0, vol: 2, dragon: 0.5 },
  glace: { feu: 0.5, eau: 0.5, plante: 2, glace: 0.5, sol: 2, vol: 2, dragon: 2, acier: 0.5 },
  combat: {
    normal: 2,
    glace: 2,
    poison: 0.5,
    vol: 0.5,
    psy: 0.5,
    insecte: 0.5,
    roche: 2,
    spectre: 0,
    tenebres: 2,
    acier: 2,
    fee: 0.5,
  },
  poison: { plante: 2, poison: 0.5, sol: 0.5, roche: 0.5, spectre: 0.5, acier: 0, fee: 2 },
  sol: { feu: 2, electrique: 2, plante: 0.5, poison: 2, vol: 0, insecte: 0.5, roche: 2, acier: 2 },
  vol: { plante: 2, electrique: 0.5, combat: 2, insecte: 2, roche: 0.5, acier: 0.5 },
  psy: { combat: 2, poison: 2, psy: 0.5, tenebres: 0, acier: 0.5 },
  insecte: {
    feu: 0.5,
    plante: 2,
    combat: 0.5,
    poison: 0.5,
    vol: 0.5,
    psy: 2,
    spectre: 0.5,
    tenebres: 2,
    acier: 0.5,
    fee: 0.5,
  },
  roche: { feu: 2, glace: 2, combat: 0.5, sol: 0.5, vol: 2, insecte: 2, acier: 0.5 },
  spectre: { normal: 0, psy: 2, spectre: 2, tenebres: 0.5 },
  dragon: { dragon: 2, acier: 0.5, fee: 0 },
  tenebres: { combat: 0.5, psy: 2, spectre: 2, tenebres: 0.5, fee: 0.5 },
  acier: { feu: 0.5, eau: 0.5, electrique: 0.5, glace: 2, roche: 2, acier: 0.5, fee: 2 },
  fee: { feu: 0.5, combat: 2, poison: 0.5, dragon: 2, tenebres: 2, acier: 0.5 },
};

/** Multiplier of a single attacking type against every defending type, multiplied together
 * exactly like the real games (e.g. a Water hit vs. a Water/Ground target is neutral:
 * 0.5 x 2 = 1; vs. a Fire/Rock target it's quadruple: 2 x 2 = 4). */
function singleTypeMultiplier(attackerType: ElementalType, defenderTypes: ElementalType[]): Decimal {
  return defenderTypes.reduce(
    (mult, defType) => mult.mul(TYPE_CHART[attackerType][defType] ?? 1),
    new Decimal(1),
  );
}

/** There's no separate moveset in this game — every click is a same-type attack, so a
 * dual-typed attacker effectively attacks with whichever of its own types is most
 * effective against the defender (best-case STAB), then that type's effectiveness against
 * every one of the defender's types is multiplied together exactly like the real chart. */
export function typeMultiplier(attackerTypes: ElementalType[], defenderTypes: ElementalType[]): Decimal {
  return attackerTypes.reduce((best, atkType) => {
    const mult = singleTypeMultiplier(atkType, defenderTypes);
    return mult.gt(best) ? mult : best;
  }, new Decimal(0));
}

/** Damage dealt by one click-attack: attacker's attack stat scaled by combo momentum and
 * type matchup. A true type immunity (0x) deals 0 damage, exactly like the real games —
 * every other case is floored but never rounds down to 0. */
export function computeAttackDamage(attackerAttack: number, comboMultiplier: Decimal, typeMult: Decimal): number {
  if (typeMult.isZero()) return 0;
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
