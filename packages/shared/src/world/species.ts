export type ElementalType =
  | "normal"
  | "feu"
  | "eau"
  | "plante"
  | "electrique"
  | "glace"
  | "combat"
  | "poison"
  | "sol"
  | "vol"
  | "psy"
  | "insecte"
  | "roche"
  | "spectre"
  | "dragon"
  | "tenebres"
  | "acier"
  | "fee";

export const ELEMENTAL_TYPES: ElementalType[] = [
  "normal",
  "feu",
  "eau",
  "plante",
  "electrique",
  "glace",
  "combat",
  "poison",
  "sol",
  "vol",
  "psy",
  "insecte",
  "roche",
  "spectre",
  "dragon",
  "tenebres",
  "acier",
  "fee",
];

export interface SpeciesConfig {
  key: string;
  name: string;
  /** Real national Pokédex number, for the Pokédex-style collection UI. */
  dexNumber: number;
  /** 1 or 2 types, matching the species' real in-game typing exactly. */
  types: ElementalType[];
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
    types: ["normal", "vol"],
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
    types: ["normal"],
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
    types: ["feu"],
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
    types: ["feu"],
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
    types: ["eau"],
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
    types: ["eau"],
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
    types: ["plante", "poison"],
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
    types: ["insecte", "plante"],
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
    types: ["insecte", "electrique"],
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
    types: ["electrique"],
    baseAttack: 18,
    baseHp: 22,
    baseCaptureRate: 0.2,
    rarityWeight: 8,
    spriteFile: "electrike.png",
  },
  mew: {
    key: "mew",
    name: "Mew",
    dexNumber: 151,
    types: ["psy"],
    baseAttack: 25,
    baseHp: 50,
    baseCaptureRate: 0.03,
    rarityWeight: 1,
    spriteFile: "mew.png",
  },

  // --- Route 1 (normal, low tier) ---
  rattata: { key: "rattata", name: "Rattata", dexNumber: 19, types: ["normal"], baseAttack: 7, baseHp: 22, baseCaptureRate: 0.55, rarityWeight: 40, spriteFile: "rattata.png" },
  zigzagoon: { key: "zigzagoon", name: "Zigzaton", dexNumber: 263, types: ["normal"], baseAttack: 8, baseHp: 24, baseCaptureRate: 0.5, rarityWeight: 32, spriteFile: "zigzagoon.png" },
  bidoof: { key: "bidoof", name: "Keunotor", dexNumber: 399, types: ["normal"], baseAttack: 6, baseHp: 28, baseCaptureRate: 0.55, rarityWeight: 28, spriteFile: "bidoof.png" },
  lillipup: { key: "lillipup", name: "Ratentif", dexNumber: 506, types: ["normal"], baseAttack: 9, baseHp: 24, baseCaptureRate: 0.5, rarityWeight: 20, spriteFile: "lillipup.png" },
  eevee: { key: "eevee", name: "Évoli", dexNumber: 133, types: ["normal"], baseAttack: 10, baseHp: 26, baseCaptureRate: 0.35, rarityWeight: 6, spriteFile: "eevee.png" },

  // --- Route 3 (normal, mid tier — evolved forms of Route 1's family) ---
  raticate: { key: "raticate", name: "Rattatac", dexNumber: 20, types: ["normal"], baseAttack: 14, baseHp: 30, baseCaptureRate: 0.35, rarityWeight: 10000, spriteFile: "raticate.png" },
  linoone: { key: "linoone", name: "Linéon", dexNumber: 264, types: ["normal"], baseAttack: 15, baseHp: 28, baseCaptureRate: 0.35, rarityWeight: 7000, spriteFile: "linoone.png" },
  furret: { key: "furret", name: "Fouinar", dexNumber: 162, types: ["normal"], baseAttack: 13, baseHp: 32, baseCaptureRate: 0.35, rarityWeight: 4000, spriteFile: "furret.png" },
  meowth: { key: "meowth", name: "Miaouss", dexNumber: 52, types: ["normal"], baseAttack: 12, baseHp: 26, baseCaptureRate: 0.4, rarityWeight: 2500, spriteFile: "meowth.png" },
  buneary: { key: "buneary", name: "Laporeille", dexNumber: 427, types: ["normal"], baseAttack: 11, baseHp: 28, baseCaptureRate: 0.4, rarityWeight: 1499, spriteFile: "buneary.png" },

  // --- Route 2 (plante, low-mid tier) ---
  shroomish: { key: "shroomish", name: "Balbuto", dexNumber: 285, types: ["plante"], baseAttack: 9, baseHp: 30, baseCaptureRate: 0.45, rarityWeight: 32, spriteFile: "shroomish.png" },
  budew: { key: "budew", name: "Rozbouton", dexNumber: 406, types: ["plante", "poison"], baseAttack: 8, baseHp: 26, baseCaptureRate: 0.45, rarityWeight: 26, spriteFile: "budew.png" },
  cottonee: { key: "cottonee", name: "Doudouvet", dexNumber: 546, types: ["plante", "fee"], baseAttack: 7, baseHp: 24, baseCaptureRate: 0.5, rarityWeight: 20, spriteFile: "cottonee.png" },
  bellsprout: { key: "bellsprout", name: "Chétiflor", dexNumber: 69, types: ["plante", "poison"], baseAttack: 10, baseHp: 24, baseCaptureRate: 0.42, rarityWeight: 14, spriteFile: "bellsprout.png" },
  sunkern: { key: "sunkern", name: "Tournegrin", dexNumber: 191, types: ["plante"], baseAttack: 6, baseHp: 22, baseCaptureRate: 0.55, rarityWeight: 8, spriteFile: "sunkern.png" },

  // --- Route 4 (eau, mid tier) ---
  poliwag: { key: "poliwag", name: "Ptitard", dexNumber: 60, types: ["eau"], baseAttack: 11, baseHp: 28, baseCaptureRate: 0.42, rarityWeight: 32, spriteFile: "poliwag.png" },
  psyduck: { key: "psyduck", name: "Psykokwak", dexNumber: 54, types: ["eau"], baseAttack: 12, baseHp: 30, baseCaptureRate: 0.4, rarityWeight: 26, spriteFile: "psyduck.png" },
  horsea: { key: "horsea", name: "Hypotrempe", dexNumber: 116, types: ["eau"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.38, rarityWeight: 20, spriteFile: "horsea.png" },
  staryu: { key: "staryu", name: "Stari", dexNumber: 120, types: ["eau"], baseAttack: 12, baseHp: 26, baseCaptureRate: 0.4, rarityWeight: 14, spriteFile: "staryu.png" },
  wooper: { key: "wooper", name: "Axoloto", dexNumber: 194, types: ["eau", "sol"], baseAttack: 10, baseHp: 32, baseCaptureRate: 0.45, rarityWeight: 8, spriteFile: "wooper.png" },

  // --- Égouts Sombres dungeon (eau, low-mid tier — starter babies + Magikarp) ---
  squirtle: { key: "squirtle", name: "Carapuce", dexNumber: 7, types: ["eau"], baseAttack: 11, baseHp: 30, baseCaptureRate: 0.35, rarityWeight: 26, spriteFile: "squirtle.png" },
  totodile: { key: "totodile", name: "Kaiminus", dexNumber: 158, types: ["eau"], baseAttack: 13, baseHp: 28, baseCaptureRate: 0.32, rarityWeight: 22, spriteFile: "totodile.png" },
  mudkip: { key: "mudkip", name: "Gobou", dexNumber: 258, types: ["eau"], baseAttack: 12, baseHp: 30, baseCaptureRate: 0.32, rarityWeight: 18, spriteFile: "mudkip.png" },
  piplup: { key: "piplup", name: "Tiplouf", dexNumber: 393, types: ["eau"], baseAttack: 11, baseHp: 28, baseCaptureRate: 0.32, rarityWeight: 14, spriteFile: "piplup.png" },
  magikarp: { key: "magikarp", name: "Magicarpe", dexNumber: 129, types: ["eau"], baseAttack: 4, baseHp: 20, baseCaptureRate: 0.6, rarityWeight: 40, spriteFile: "magikarp.png" },

  // --- Crypte des Anciens dungeon (feu, low-mid tier — starter babies) ---
  growlithe: { key: "growlithe", name: "Caninos", dexNumber: 58, types: ["feu"], baseAttack: 14, baseHp: 26, baseCaptureRate: 0.35, rarityWeight: 30, spriteFile: "growlithe.png" },
  cyndaquil: { key: "cyndaquil", name: "Héricendre", dexNumber: 155, types: ["feu"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.3, rarityWeight: 22, spriteFile: "cyndaquil.png" },
  torchic: { key: "torchic", name: "Poussifeu", dexNumber: 255, types: ["feu"], baseAttack: 13, baseHp: 22, baseCaptureRate: 0.3, rarityWeight: 18, spriteFile: "torchic.png" },
  chimchar: { key: "chimchar", name: "Ouisticram", dexNumber: 390, types: ["feu"], baseAttack: 14, baseHp: 22, baseCaptureRate: 0.3, rarityWeight: 14, spriteFile: "chimchar.png" },
  numel: { key: "numel", name: "Chamallot", dexNumber: 322, types: ["feu", "sol"], baseAttack: 11, baseHp: 30, baseCaptureRate: 0.4, rarityWeight: 8, spriteFile: "numel.png" },

  // --- Route 7 (feu, high tier — evolved forms) ---
  arcanine: { key: "arcanine", name: "Arcanin", dexNumber: 59, types: ["feu"], baseAttack: 24, baseHp: 46, baseCaptureRate: 0.2, rarityWeight: 30, spriteFile: "arcanine.png" },
  rapidash: { key: "rapidash", name: "Galopa", dexNumber: 78, types: ["feu"], baseAttack: 22, baseHp: 38, baseCaptureRate: 0.22, rarityWeight: 24, spriteFile: "rapidash.png" },
  magmar: { key: "magmar", name: "Magmar", dexNumber: 126, types: ["feu"], baseAttack: 23, baseHp: 36, baseCaptureRate: 0.22, rarityWeight: 18, spriteFile: "magmar.png" },
  torkoal: { key: "torkoal", name: "Chartor", dexNumber: 324, types: ["feu"], baseAttack: 18, baseHp: 42, baseCaptureRate: 0.25, rarityWeight: 12, spriteFile: "torkoal.png" },
  camerupt: { key: "camerupt", name: "Camérupt", dexNumber: 323, types: ["feu", "sol"], baseAttack: 22, baseHp: 44, baseCaptureRate: 0.22, rarityWeight: 8, spriteFile: "camerupt.png" },

  // --- Usine Abandonnée dungeon (electrique, low-mid tier — basic forms) ---
  pikachu: { key: "pikachu", name: "Pikachu", dexNumber: 25, types: ["electrique"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.3, rarityWeight: 10, spriteFile: "pikachu.png" },
  magnemite: { key: "magnemite", name: "Magnéti", dexNumber: 81, types: ["electrique", "acier"], baseAttack: 12, baseHp: 20, baseCaptureRate: 0.4, rarityWeight: 28, spriteFile: "magnemite.png" },
  voltorb: { key: "voltorb", name: "Voltorbe", dexNumber: 100, types: ["electrique"], baseAttack: 11, baseHp: 22, baseCaptureRate: 0.4, rarityWeight: 24, spriteFile: "voltorb.png" },
  mareep: { key: "mareep", name: "Wattouat", dexNumber: 179, types: ["electrique"], baseAttack: 10, baseHp: 26, baseCaptureRate: 0.42, rarityWeight: 20, spriteFile: "mareep.png" },
  shinx: { key: "shinx", name: "Vasire", dexNumber: 403, types: ["electrique"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.35, rarityWeight: 14, spriteFile: "shinx.png" },

  // --- Route 9 (electrique, highest tier — evolved forms) ---
  raichu: { key: "raichu", name: "Raichu", dexNumber: 26, types: ["electrique"], baseAttack: 26, baseHp: 38, baseCaptureRate: 0.18, rarityWeight: 24, spriteFile: "raichu.png" },
  magnezone: { key: "magnezone", name: "Magnézone", dexNumber: 462, types: ["electrique", "acier"], baseAttack: 25, baseHp: 40, baseCaptureRate: 0.18, rarityWeight: 20, spriteFile: "magnezone.png" },
  electivire: { key: "electivire", name: "Élekable", dexNumber: 466, types: ["electrique"], baseAttack: 27, baseHp: 42, baseCaptureRate: 0.16, rarityWeight: 16, spriteFile: "electivire.png" },
  ampharos: { key: "ampharos", name: "Ampharos", dexNumber: 181, types: ["electrique"], baseAttack: 24, baseHp: 46, baseCaptureRate: 0.2, rarityWeight: 12, spriteFile: "ampharos.png" },
  luxray: { key: "luxray", name: "Luxray", dexNumber: 405, types: ["electrique"], baseAttack: 26, baseHp: 36, baseCaptureRate: 0.18, rarityWeight: 8, spriteFile: "luxray.png" },
};
