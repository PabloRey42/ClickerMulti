export type ElementalType = "normal" | "feu" | "eau" | "plante" | "electrique";

export interface SpeciesConfig {
  key: string;
  name: string;
  elementalType: ElementalType;
  baseAttack: number;
  baseHp: number;
  baseCaptureRate: number;
  rarityWeight: number;
}

export const STARTER_SPECIES_KEY = "moineau";

export const SPECIES_CATALOG: Record<string, SpeciesConfig> = {
  moineau: {
    key: "moineau",
    name: "Moineau Piaf",
    elementalType: "normal",
    baseAttack: 8,
    baseHp: 30,
    baseCaptureRate: 0.5,
    rarityWeight: 50,
  },
  ecureuil: {
    key: "ecureuil",
    name: "Écureuil Vif",
    elementalType: "normal",
    baseAttack: 9,
    baseHp: 26,
    baseCaptureRate: 0.45,
    rarityWeight: 40,
  },
  salamandre: {
    key: "salamandre",
    name: "Salamandre Braise",
    elementalType: "feu",
    baseAttack: 12,
    baseHp: 28,
    baseCaptureRate: 0.35,
    rarityWeight: 30,
  },
  renardeau: {
    key: "renardeau",
    name: "Renardeau Flamme",
    elementalType: "feu",
    baseAttack: 14,
    baseHp: 24,
    baseCaptureRate: 0.3,
    rarityWeight: 20,
  },
  loutre: {
    key: "loutre",
    name: "Loutre Ruisseau",
    elementalType: "eau",
    baseAttack: 11,
    baseHp: 30,
    baseCaptureRate: 0.4,
    rarityWeight: 30,
  },
  grenouille: {
    key: "grenouille",
    name: "Grenouille Bulle",
    elementalType: "eau",
    baseAttack: 10,
    baseHp: 32,
    baseCaptureRate: 0.42,
    rarityWeight: 35,
  },
  lierre: {
    key: "lierre",
    name: "Lierre Rampant",
    elementalType: "plante",
    baseAttack: 9,
    baseHp: 34,
    baseCaptureRate: 0.45,
    rarityWeight: 35,
  },
  scarabee: {
    key: "scarabee",
    name: "Scarabée Feuille",
    elementalType: "plante",
    baseAttack: 13,
    baseHp: 26,
    baseCaptureRate: 0.32,
    rarityWeight: 22,
  },
  "moucheron-foudre": {
    key: "moucheron-foudre",
    name: "Moucheron Foudre",
    elementalType: "electrique",
    baseAttack: 16,
    baseHp: 20,
    baseCaptureRate: 0.25,
    rarityWeight: 12,
  },
  "goupil-etincelle": {
    key: "goupil-etincelle",
    name: "Goupil Étincelle",
    elementalType: "electrique",
    baseAttack: 18,
    baseHp: 22,
    baseCaptureRate: 0.2,
    rarityWeight: 8,
  },
};
