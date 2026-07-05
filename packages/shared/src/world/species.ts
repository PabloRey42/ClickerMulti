export type ElementalType = "normal" | "feu" | "eau" | "plante" | "electrique";

export const ELEMENTAL_TYPES: ElementalType[] = ["normal", "feu", "eau", "plante", "electrique"];

export interface SpeciesConfig {
  key: string;
  name: string;
  /** Real national Pokédex number, for the Pokédex-style collection UI. */
  dexNumber: number;
  elementalType: ElementalType;
  baseAttack: number;
  baseHp: number;
  baseCaptureRate: number;
  rarityWeight: number;
  /** Filename under /sprites/ in the web app's public assets. */
  spriteFile: string;
}

/** Offered to a new player on first login; a classic feu/eau/plante trio. */
export const STARTER_SPECIES_KEYS = ["salamandre", "grenouille", "lierre"] as const;

export const SPECIES_CATALOG: Record<string, SpeciesConfig> = {
  moineau: {
    key: "moineau",
    name: "Roucool",
    dexNumber: 16,
    elementalType: "normal",
    baseAttack: 8,
    baseHp: 30,
    baseCaptureRate: 0.5,
    rarityWeight: 50,
    spriteFile: "pidgey.png",
  },
  ecureuil: {
    key: "ecureuil",
    name: "Fouinette",
    dexNumber: 161,
    elementalType: "normal",
    baseAttack: 9,
    baseHp: 26,
    baseCaptureRate: 0.45,
    rarityWeight: 40,
    spriteFile: "sentret.png",
  },
  salamandre: {
    key: "salamandre",
    name: "Salamèche",
    dexNumber: 4,
    elementalType: "feu",
    baseAttack: 12,
    baseHp: 28,
    baseCaptureRate: 0.35,
    rarityWeight: 30,
    spriteFile: "charmander.png",
  },
  renardeau: {
    key: "renardeau",
    name: "Goupix",
    dexNumber: 37,
    elementalType: "feu",
    baseAttack: 14,
    baseHp: 24,
    baseCaptureRate: 0.3,
    rarityWeight: 20,
    spriteFile: "vulpix.png",
  },
  loutre: {
    key: "loutre",
    name: "Moustillon",
    dexNumber: 501,
    elementalType: "eau",
    baseAttack: 11,
    baseHp: 30,
    baseCaptureRate: 0.4,
    rarityWeight: 30,
    spriteFile: "oshawott.png",
  },
  grenouille: {
    key: "grenouille",
    name: "Grenousse",
    dexNumber: 656,
    elementalType: "eau",
    baseAttack: 10,
    baseHp: 32,
    baseCaptureRate: 0.42,
    rarityWeight: 35,
    spriteFile: "froakie.png",
  },
  lierre: {
    key: "lierre",
    name: "Mystherbe",
    dexNumber: 43,
    elementalType: "plante",
    baseAttack: 9,
    baseHp: 34,
    baseCaptureRate: 0.45,
    rarityWeight: 35,
    spriteFile: "oddish.png",
  },
  scarabee: {
    key: "scarabee",
    name: "Larveyette",
    dexNumber: 540,
    elementalType: "plante",
    baseAttack: 13,
    baseHp: 26,
    baseCaptureRate: 0.32,
    rarityWeight: 22,
    spriteFile: "sewaddle.png",
  },
  "moucheron-foudre": {
    key: "moucheron-foudre",
    name: "Statitik",
    dexNumber: 595,
    elementalType: "electrique",
    baseAttack: 16,
    baseHp: 20,
    baseCaptureRate: 0.25,
    rarityWeight: 12,
    spriteFile: "joltik.png",
  },
  "goupil-etincelle": {
    key: "goupil-etincelle",
    name: "Dynavolt",
    dexNumber: 309,
    elementalType: "electrique",
    baseAttack: 18,
    baseHp: 22,
    baseCaptureRate: 0.2,
    rarityWeight: 8,
    spriteFile: "electrike.png",
  },
  /** Ultra-rare: 1/25000 on Route 3 only, see lumina.ts. No psychic type exists in this
   * game yet, so it's classified normal rather than adding a 6th type for one species. */
  mew: {
    key: "mew",
    name: "Mew",
    dexNumber: 151,
    elementalType: "normal",
    baseAttack: 25,
    baseHp: 50,
    baseCaptureRate: 0.03,
    rarityWeight: 1,
    spriteFile: "mew.png",
  },
};
