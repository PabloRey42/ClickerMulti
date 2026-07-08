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
  /** Relative on-screen size, derived from the species' real height (PokeAPI, dampened via
   * sqrt-ish compression + clamped to [0.55, 1.15] so nothing vanishes or blows out a fixed
   * sprite box) — applied as a CSS transform: scale() on top of the existing object-contain
   * box everywhere a creature sprite renders (see creatureSpriteScale in theme/typeColors.ts).
   * Guarantees a species' own evolution family renders in ascending size order (e.g. Kaiminus
   * < Crocrodil < Aligatueur), which raw sprite pixel dimensions alone don't guarantee since
   * every sprite is pre-cropped tight to its own content (see the sprite-padding fix). */
  spriteScale: number;
  /** Only present for species with a real *level-based* evolution in the actual games —
   * stone/friendship/trade evolutions (Eevee, Vulpix, Growlithe, Pikachu, Buneary, Budew,
   * Cottonee, Sunkern, Staryu...) are deliberately omitted since they have no real level to
   * copy, per the "exact same level as the real game" requirement. `level` is the level at
   * which the creature auto-evolves into `intoKey`. */
  evolution?: { intoKey: string; level: number };
  /** Real stone-triggered evolutions (the ones `evolution` above deliberately excludes) —
   * player-initiated via a Pierre from the shop, not automatic. A species can have several
   * options (Eevee has 4: Fire/Water/Thunder/Leaf), each keyed by which stone unlocks it.
   * See STONE_CATALOG (game/stones.ts) and resolveStoneEvolution (game/evolution.ts). */
  stoneEvolutions?: { stoneKey: string; intoKey: string }[];
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
    spriteScale: 0.75,
    evolution: { intoKey: "pidgeotto", level: 18 },
  },
  pidgeotto: {
    key: "pidgeotto",
    name: "Roucoups",
    dexNumber: 17,
    types: ["normal", "vol"],
    // Growth rates below (this chain and every other evolved-form entry in this file) are
    // derived from real per-stage stat ratios (PokeAPI attack/hp), applied on top of each
    // family's own hand-tuned base-form stats — not an invented flat multiplier. The original
    // flat ~1.5x/1.4x compounding made fully-evolved (3-stage) Pokémon noticeably overtuned
    // (~2.1x attack base-to-final) compared to how the real games actually pace evolution
    // power — see [[project-farmclicker-architecture-decisions]] for the rebalance note.
    baseAttack: 11,
    baseHp: 47,
    baseCaptureRate: 0.3,
    rarityWeight: 1,
    spriteFile: "pidgeotto.png",
    spriteScale: 0.87,
    evolution: { intoKey: "pidgeot", level: 36 },
  },
  pidgeot: {
    key: "pidgeot",
    name: "Roucarnage",
    dexNumber: 18,
    types: ["normal", "vol"],
    baseAttack: 15,
    baseHp: 62,
    baseCaptureRate: 0.18,
    rarityWeight: 1,
    spriteFile: "pidgeot.png",
    spriteScale: 0.91,
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
    spriteScale: 0.84,
    evolution: { intoKey: "furret", level: 15 },
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
    spriteScale: 0.81,
    evolution: { intoKey: "charmeleon", level: 16 },
  },
  charmeleon: {
    key: "charmeleon",
    name: "Reptincel",
    dexNumber: 5,
    types: ["feu"],
    baseAttack: 15,
    baseHp: 42,
    baseCaptureRate: 0.21,
    rarityWeight: 1,
    spriteFile: "charmeleon.png",
    spriteScale: 0.87,
    evolution: { intoKey: "charizard", level: 36 },
  },
  charizard: {
    key: "charizard",
    name: "Dracaufeu",
    dexNumber: 6,
    types: ["feu", "vol"],
    baseAttack: 20,
    baseHp: 56,
    baseCaptureRate: 0.13,
    rarityWeight: 1,
    spriteFile: "charizard.png",
    spriteScale: 0.93,
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
    spriteScale: 0.81,
    stoneEvolutions: [{ stoneKey: "pierre_feu", intoKey: "ninetales" }],
  },
  ninetales: {
    key: "ninetales",
    name: "Feunard",
    dexNumber: 38,
    types: ["feu"],
    baseAttack: 21,
    baseHp: 30,
    baseCaptureRate: 0.18,
    rarityWeight: 1,
    spriteFile: "ninetales.png",
    spriteScale: 0.87,
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
    spriteScale: 0.79,
    evolution: { intoKey: "dewott", level: 17 },
  },
  dewott: {
    key: "dewott",
    name: "Mateloutre",
    dexNumber: 502,
    types: ["eau"],
    baseAttack: 15,
    baseHp: 41,
    baseCaptureRate: 0.24,
    rarityWeight: 1,
    spriteFile: "dewott.png",
    spriteScale: 0.84,
    evolution: { intoKey: "samurott", level: 36 },
  },
  samurott: {
    key: "samurott",
    name: "Clamiral",
    dexNumber: 503,
    types: ["eau"],
    baseAttack: 20,
    baseHp: 52,
    baseCaptureRate: 0.14,
    rarityWeight: 1,
    spriteFile: "samurott.png",
    spriteScale: 0.91,
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
    spriteScale: 0.75,
    evolution: { intoKey: "frogadier", level: 16 },
  },
  frogadier: {
    key: "frogadier",
    name: "Croâporal",
    dexNumber: 657,
    types: ["eau"],
    baseAttack: 11,
    baseHp: 42,
    baseCaptureRate: 0.25,
    rarityWeight: 1,
    spriteFile: "frogadier.png",
    spriteScale: 0.81,
    evolution: { intoKey: "greninja", level: 36 },
  },
  greninja: {
    key: "greninja",
    name: "Amphinobi",
    dexNumber: 658,
    types: ["eau", "tenebres"],
    baseAttack: 17,
    baseHp: 56,
    baseCaptureRate: 0.15,
    rarityWeight: 1,
    spriteFile: "greninja.png",
    spriteScale: 0.91,
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
    spriteScale: 0.79,
    evolution: { intoKey: "gloom", level: 21 },
  },
  gloom: {
    key: "gloom",
    name: "Ortide",
    dexNumber: 44,
    types: ["plante", "poison"],
    baseAttack: 14,
    baseHp: 43,
    baseCaptureRate: 0.27,
    rarityWeight: 1,
    spriteFile: "gloom.png",
    spriteScale: 0.84,
    stoneEvolutions: [
      { stoneKey: "pierre_feuille", intoKey: "vileplume" },
      { stoneKey: "pierre_soleil", intoKey: "bellossom" },
    ],
  },
  vileplume: {
    key: "vileplume",
    name: "Rafflesia",
    dexNumber: 45,
    types: ["plante", "poison"],
    baseAttack: 20,
    baseHp: 52,
    baseCaptureRate: 0.16,
    rarityWeight: 1,
    spriteFile: "vileplume.png",
    spriteScale: 0.88,
  },
  bellossom: {
    key: "bellossom",
    name: "Joliflor",
    dexNumber: 182,
    types: ["plante"],
    baseAttack: 18,
    baseHp: 50,
    baseCaptureRate: 0.17,
    rarityWeight: 1,
    spriteFile: "bellossom.png",
    spriteScale: 0.84,
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
    spriteScale: 0.75,
    evolution: { intoKey: "swadloon", level: 20 },
  },
  swadloon: {
    key: "swadloon",
    name: "Couverdure",
    dexNumber: 541,
    types: ["insecte", "plante"],
    baseAttack: 20,
    baseHp: 33,
    baseCaptureRate: 0.19,
    rarityWeight: 1,
    spriteFile: "swadloon.png",
    spriteScale: 0.79,
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
    spriteScale: 0.69,
    evolution: { intoKey: "galvantula", level: 36 },
  },
  galvantula: {
    key: "galvantula",
    name: "Mygavolt",
    dexNumber: 596,
    types: ["insecte", "electrique"],
    baseAttack: 24,
    baseHp: 25,
    baseCaptureRate: 0.15,
    rarityWeight: 1,
    spriteFile: "galvantula.png",
    spriteScale: 0.84,
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
    spriteScale: 0.81,
    evolution: { intoKey: "manectric", level: 26 },
  },
  manectric: {
    key: "manectric",
    name: "Élecsprint",
    dexNumber: 310,
    types: ["electrique"],
    baseAttack: 27,
    baseHp: 28,
    baseCaptureRate: 0.12,
    rarityWeight: 1,
    spriteFile: "manectric.png",
    spriteScale: 0.91,
  },
  mew: {
    key: "mew",
    name: "Mew",
    dexNumber: 151,
    types: ["psy"],
    // Nerfed 20% from the original 25/50 — it fights at level 30 (see lumina.ts) while the
    // rest of Route 3 is level 6-9, so its combat stats needed to come down to compensate.
    baseAttack: 20,
    baseHp: 40,
    baseCaptureRate: 0.03,
    rarityWeight: 1,
    spriteFile: "mew.png",
    spriteScale: 0.78,
  },

  // --- Route 1 (normal, low tier) ---
  rattata: { key: "rattata", name: "Rattata", dexNumber: 19, types: ["normal"], baseAttack: 7, baseHp: 22, baseCaptureRate: 0.55, rarityWeight: 40, spriteFile: "rattata.png", spriteScale: 0.75, evolution: { intoKey: "raticate", level: 20 } },
  zigzagoon: { key: "zigzagoon", name: "Zigzaton", dexNumber: 263, types: ["normal"], baseAttack: 8, baseHp: 24, baseCaptureRate: 0.5, rarityWeight: 32, spriteFile: "zigzagoon.png", spriteScale: 0.78, evolution: { intoKey: "linoone", level: 20 } },
  bidoof: { key: "bidoof", name: "Keunotor", dexNumber: 399, types: ["normal"], baseAttack: 6, baseHp: 28, baseCaptureRate: 0.55, rarityWeight: 28, spriteFile: "bidoof.png", spriteScale: 0.79, evolution: { intoKey: "bibarel", level: 15 } },
  bibarel: { key: "bibarel", name: "Castorno", dexNumber: 400, types: ["normal", "eau"], baseAttack: 9, baseHp: 35, baseCaptureRate: 0.33, rarityWeight: 1, spriteFile: "bibarel.png", spriteScale: 0.86 },
  lillipup: { key: "lillipup", name: "Ponchiot", dexNumber: 506, types: ["normal"], baseAttack: 9, baseHp: 24, baseCaptureRate: 0.5, rarityWeight: 20, spriteFile: "lillipup.png", spriteScale: 0.78, evolution: { intoKey: "herdier", level: 16 } },
  herdier: { key: "herdier", name: "Ponchien", dexNumber: 507, types: ["normal"], baseAttack: 12, baseHp: 35, baseCaptureRate: 0.3, rarityWeight: 1, spriteFile: "herdier.png", spriteScale: 0.85, evolution: { intoKey: "stoutland", level: 32 } },
  stoutland: { key: "stoutland", name: "Mastouffe", dexNumber: 508, types: ["normal"], baseAttack: 17, baseHp: 46, baseCaptureRate: 0.18, rarityWeight: 1, spriteFile: "stoutland.png", spriteScale: 0.88 },
  eevee: {
    key: "eevee",
    name: "Évoli",
    dexNumber: 133,
    types: ["normal"],
    baseAttack: 10,
    baseHp: 26,
    baseCaptureRate: 0.35,
    rarityWeight: 6,
    spriteFile: "eevee.png",
    spriteScale: 0.75,
    stoneEvolutions: [
      { stoneKey: "pierre_feu", intoKey: "flareon" },
      { stoneKey: "pierre_eau", intoKey: "vaporeon" },
      { stoneKey: "pierre_foudre", intoKey: "jolteon" },
      { stoneKey: "pierre_feuille", intoKey: "leafeon" },
    ],
  },
  flareon: { key: "flareon", name: "Pyroli", dexNumber: 136, types: ["feu"], baseAttack: 15, baseHp: 33, baseCaptureRate: 0.21, rarityWeight: 1, spriteFile: "flareon.png", spriteScale: 0.85 },
  vaporeon: { key: "vaporeon", name: "Aquali", dexNumber: 134, types: ["eau"], baseAttack: 13, baseHp: 46, baseCaptureRate: 0.21, rarityWeight: 1, spriteFile: "vaporeon.png", spriteScale: 0.86 },
  jolteon: { key: "jolteon", name: "Voltali", dexNumber: 135, types: ["electrique"], baseAttack: 17, baseHp: 29, baseCaptureRate: 0.21, rarityWeight: 1, spriteFile: "jolteon.png", spriteScale: 0.84 },
  leafeon: { key: "leafeon", name: "Phyllali", dexNumber: 470, types: ["plante"], baseAttack: 16, baseHp: 30, baseCaptureRate: 0.21, rarityWeight: 1, spriteFile: "leafeon.png", spriteScale: 0.86 },

  // --- Route 3 (normal, mid tier — evolved forms of Route 1's family) ---
  raticate: { key: "raticate", name: "Rattatac", dexNumber: 20, types: ["normal"], baseAttack: 14, baseHp: 30, baseCaptureRate: 0.35, rarityWeight: 10000, spriteFile: "raticate.png", spriteScale: 0.83 },
  linoone: { key: "linoone", name: "Linéon", dexNumber: 264, types: ["normal"], baseAttack: 15, baseHp: 28, baseCaptureRate: 0.35, rarityWeight: 7000, spriteFile: "linoone.png", spriteScale: 0.79 },
  furret: { key: "furret", name: "Fouinar", dexNumber: 162, types: ["normal"], baseAttack: 13, baseHp: 32, baseCaptureRate: 0.35, rarityWeight: 4000, spriteFile: "furret.png", spriteScale: 0.93 },
  meowth: { key: "meowth", name: "Miaouss", dexNumber: 52, types: ["normal"], baseAttack: 12, baseHp: 26, baseCaptureRate: 0.4, rarityWeight: 2500, spriteFile: "meowth.png", spriteScale: 0.78, evolution: { intoKey: "persian", level: 28 } },
  persian: { key: "persian", name: "Persian", dexNumber: 53, types: ["normal"], baseAttack: 18, baseHp: 33, baseCaptureRate: 0.24, rarityWeight: 1, spriteFile: "persian.png", spriteScale: 0.86 },
  buneary: { key: "buneary", name: "Laporeille", dexNumber: 427, types: ["normal"], baseAttack: 11, baseHp: 28, baseCaptureRate: 0.4, rarityWeight: 1499, spriteFile: "buneary.png", spriteScale: 0.78 },

  // --- Route 2 (plante, low-mid tier) ---
  shroomish: { key: "shroomish", name: "Balignon", dexNumber: 285, types: ["plante"], baseAttack: 9, baseHp: 30, baseCaptureRate: 0.45, rarityWeight: 32, spriteFile: "shroomish.png", spriteScale: 0.78, evolution: { intoKey: "breloom", level: 23 } },
  breloom: { key: "breloom", name: "Chapignon", dexNumber: 286, types: ["plante", "combat"], baseAttack: 14, baseHp: 38, baseCaptureRate: 0.27, rarityWeight: 1, spriteFile: "breloom.png", spriteScale: 0.88 },
  budew: { key: "budew", name: "Rozbouton", dexNumber: 406, types: ["plante", "poison"], baseAttack: 8, baseHp: 26, baseCaptureRate: 0.45, rarityWeight: 26, spriteFile: "budew.png", spriteScale: 0.73 },
  cottonee: { key: "cottonee", name: "Doudouvet", dexNumber: 546, types: ["plante", "fee"], baseAttack: 7, baseHp: 24, baseCaptureRate: 0.5, rarityWeight: 20, spriteFile: "cottonee.png", spriteScale: 0.75, stoneEvolutions: [{ stoneKey: "pierre_soleil", intoKey: "whimsicott" }] },
  whimsicott: { key: "whimsicott", name: "Farfaduvet", dexNumber: 547, types: ["plante", "fee"], baseAttack: 13, baseHp: 32, baseCaptureRate: 0.3, rarityWeight: 1, spriteFile: "whimsicott.png", spriteScale: 0.83 },
  bellsprout: { key: "bellsprout", name: "Chétiflor", dexNumber: 69, types: ["plante", "poison"], baseAttack: 10, baseHp: 24, baseCaptureRate: 0.42, rarityWeight: 14, spriteFile: "bellsprout.png", spriteScale: 0.83, evolution: { intoKey: "weepinbell", level: 21 } },
  weepinbell: { key: "weepinbell", name: "Boustiflor", dexNumber: 70, types: ["plante", "poison"], baseAttack: 15, baseHp: 30, baseCaptureRate: 0.25, rarityWeight: 1, spriteFile: "weepinbell.png", spriteScale: 0.86, stoneEvolutions: [{ stoneKey: "pierre_feuille", intoKey: "victreebel" }] },
  victreebel: { key: "victreebel", name: "Empiflor", dexNumber: 71, types: ["plante", "poison"], baseAttack: 22, baseHp: 38, baseCaptureRate: 0.15, rarityWeight: 1, spriteFile: "victreebel.png", spriteScale: 0.93 },
  sunkern: { key: "sunkern", name: "Tournegrin", dexNumber: 191, types: ["plante"], baseAttack: 6, baseHp: 22, baseCaptureRate: 0.55, rarityWeight: 8, spriteFile: "sunkern.png", spriteScale: 0.75, stoneEvolutions: [{ stoneKey: "pierre_soleil", intoKey: "sunflora" }] },
  sunflora: { key: "sunflora", name: "Héliatronc", dexNumber: 192, types: ["plante"], baseAttack: 11, baseHp: 30, baseCaptureRate: 0.35, rarityWeight: 1, spriteFile: "sunflora.png", spriteScale: 0.84 },

  // --- Route 4 (eau, mid tier) ---
  poliwag: { key: "poliwag", name: "Ptitard", dexNumber: 60, types: ["eau"], baseAttack: 11, baseHp: 28, baseCaptureRate: 0.42, rarityWeight: 32, spriteFile: "poliwag.png", spriteScale: 0.81, evolution: { intoKey: "poliwhirl", level: 25 } },
  poliwhirl: { key: "poliwhirl", name: "Têtarte", dexNumber: 61, types: ["eau"], baseAttack: 17, baseHp: 35, baseCaptureRate: 0.25, rarityWeight: 1, spriteFile: "poliwhirl.png", spriteScale: 0.86, stoneEvolutions: [{ stoneKey: "pierre_eau", intoKey: "poliwrath" }] },
  poliwrath: { key: "poliwrath", name: "Tartard", dexNumber: 62, types: ["eau", "combat"], baseAttack: 26, baseHp: 44, baseCaptureRate: 0.15, rarityWeight: 1, spriteFile: "poliwrath.png", spriteScale: 0.89 },
  psyduck: { key: "psyduck", name: "Psykokwak", dexNumber: 54, types: ["eau"], baseAttack: 12, baseHp: 30, baseCaptureRate: 0.4, rarityWeight: 26, spriteFile: "psyduck.png", spriteScale: 0.84, evolution: { intoKey: "golduck", level: 33 } },
  golduck: { key: "golduck", name: "Akwakwak", dexNumber: 55, types: ["eau"], baseAttack: 18, baseHp: 38, baseCaptureRate: 0.24, rarityWeight: 1, spriteFile: "golduck.png", spriteScale: 0.93 },
  horsea: { key: "horsea", name: "Hypotrempe", dexNumber: 116, types: ["eau"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.38, rarityWeight: 20, spriteFile: "horsea.png", spriteScale: 0.78, evolution: { intoKey: "seadra", level: 32 } },
  seadra: { key: "seadra", name: "Hypocéan", dexNumber: 117, types: ["eau"], baseAttack: 20, baseHp: 30, baseCaptureRate: 0.23, rarityWeight: 1, spriteFile: "seadra.png", spriteScale: 0.88 },
  staryu: { key: "staryu", name: "Stari", dexNumber: 120, types: ["eau"], baseAttack: 12, baseHp: 26, baseCaptureRate: 0.4, rarityWeight: 14, spriteFile: "staryu.png", spriteScale: 0.84, stoneEvolutions: [{ stoneKey: "pierre_eau", intoKey: "starmie" }] },
  starmie: { key: "starmie", name: "Staross", dexNumber: 121, types: ["eau", "psy"], baseAttack: 19, baseHp: 33, baseCaptureRate: 0.18, rarityWeight: 1, spriteFile: "starmie.png", spriteScale: 0.87 },
  wooper: { key: "wooper", name: "Axoloto", dexNumber: 194, types: ["eau", "sol"], baseAttack: 10, baseHp: 32, baseCaptureRate: 0.45, rarityWeight: 8, spriteFile: "wooper.png", spriteScale: 0.78, evolution: { intoKey: "quagsire", level: 20 } },
  quagsire: { key: "quagsire", name: "Maraiste", dexNumber: 195, types: ["eau", "sol"], baseAttack: 15, baseHp: 40, baseCaptureRate: 0.27, rarityWeight: 1, spriteFile: "quagsire.png", spriteScale: 0.9 },

  // --- Égouts Sombres dungeon (eau, low-mid tier — starter babies + Magikarp) ---
  squirtle: { key: "squirtle", name: "Carapuce", dexNumber: 7, types: ["eau"], baseAttack: 11, baseHp: 30, baseCaptureRate: 0.35, rarityWeight: 26, spriteFile: "squirtle.png", spriteScale: 0.79, evolution: { intoKey: "wartortle", level: 16 } },
  wartortle: { key: "wartortle", name: "Carabaffe", dexNumber: 8, types: ["eau"], baseAttack: 14, baseHp: 40, baseCaptureRate: 0.21, rarityWeight: 1, spriteFile: "wartortle.png", spriteScale: 0.86, evolution: { intoKey: "blastoise", level: 36 } },
  blastoise: { key: "blastoise", name: "Tortank", dexNumber: 9, types: ["eau"], baseAttack: 18, baseHp: 54, baseCaptureRate: 0.13, rarityWeight: 1, spriteFile: "blastoise.png", spriteScale: 0.92 },
  totodile: { key: "totodile", name: "Kaiminus", dexNumber: 158, types: ["eau"], baseAttack: 13, baseHp: 28, baseCaptureRate: 0.32, rarityWeight: 22, spriteFile: "totodile.png", spriteScale: 0.81, evolution: { intoKey: "croconaw", level: 18 } },
  croconaw: { key: "croconaw", name: "Crocrodil", dexNumber: 159, types: ["eau"], baseAttack: 16, baseHp: 36, baseCaptureRate: 0.19, rarityWeight: 1, spriteFile: "croconaw.png", spriteScale: 0.87, evolution: { intoKey: "feraligatr", level: 30 } },
  feraligatr: { key: "feraligatr", name: "Aligatueur", dexNumber: 160, types: ["eau"], baseAttack: 21, baseHp: 47, baseCaptureRate: 0.11, rarityWeight: 1, spriteFile: "feraligatr.png", spriteScale: 0.97 },
  mudkip: { key: "mudkip", name: "Gobou", dexNumber: 258, types: ["eau"], baseAttack: 12, baseHp: 30, baseCaptureRate: 0.32, rarityWeight: 18, spriteFile: "mudkip.png", spriteScale: 0.78, evolution: { intoKey: "marshtomp", level: 16 } },
  marshtomp: { key: "marshtomp", name: "Flobio", dexNumber: 259, types: ["eau", "sol"], baseAttack: 15, baseHp: 42, baseCaptureRate: 0.19, rarityWeight: 1, spriteFile: "marshtomp.png", spriteScale: 0.83, evolution: { intoKey: "swampert", level: 36 } },
  swampert: { key: "swampert", name: "Laggron", dexNumber: 260, types: ["eau", "sol"], baseAttack: 19, baseHp: 60, baseCaptureRate: 0.11, rarityWeight: 1, spriteFile: "swampert.png", spriteScale: 0.91 },
  piplup: { key: "piplup", name: "Tiplouf", dexNumber: 393, types: ["eau"], baseAttack: 11, baseHp: 28, baseCaptureRate: 0.32, rarityWeight: 14, spriteFile: "piplup.png", spriteScale: 0.78, evolution: { intoKey: "prinplup", level: 16 } },
  prinplup: { key: "prinplup", name: "Prinplouf", dexNumber: 394, types: ["eau"], baseAttack: 14, baseHp: 34, baseCaptureRate: 0.19, rarityWeight: 1, spriteFile: "prinplup.png", spriteScale: 0.84, evolution: { intoKey: "empoleon", level: 36 } },
  empoleon: { key: "empoleon", name: "Pingoléon", dexNumber: 395, types: ["eau", "acier"], baseAttack: 18, baseHp: 45, baseCaptureRate: 0.11, rarityWeight: 1, spriteFile: "empoleon.png", spriteScale: 0.93 },
  magikarp: { key: "magikarp", name: "Magicarpe", dexNumber: 129, types: ["eau"], baseAttack: 4, baseHp: 20, baseCaptureRate: 0.6, rarityWeight: 40, spriteFile: "magikarp.png", spriteScale: 0.85, evolution: { intoKey: "gyarados", level: 20 } },
  gyarados: { key: "gyarados", name: "Léviator", dexNumber: 130, types: ["eau", "vol"], baseAttack: 35, baseHp: 55, baseCaptureRate: 0.15, rarityWeight: 1, spriteFile: "gyarados.png", spriteScale: 1.15 },

  // --- Crypte des Anciens dungeon (feu, low-mid tier — starter babies) ---
  growlithe: { key: "growlithe", name: "Caninos", dexNumber: 58, types: ["feu"], baseAttack: 14, baseHp: 26, baseCaptureRate: 0.35, rarityWeight: 30, spriteFile: "growlithe.png", spriteScale: 0.83, stoneEvolutions: [{ stoneKey: "pierre_feu", intoKey: "arcanine" }] },
  cyndaquil: { key: "cyndaquil", name: "Héricendre", dexNumber: 155, types: ["feu"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.3, rarityWeight: 22, spriteFile: "cyndaquil.png", spriteScale: 0.79, evolution: { intoKey: "quilava", level: 14 } },
  quilava: { key: "quilava", name: "Feurisson", dexNumber: 156, types: ["feu"], baseAttack: 16, baseHp: 36, baseCaptureRate: 0.18, rarityWeight: 1, spriteFile: "quilava.png", spriteScale: 0.85, evolution: { intoKey: "typhlosion", level: 36 } },
  typhlosion: { key: "typhlosion", name: "Typhlosion", dexNumber: 157, types: ["feu"], baseAttack: 21, baseHp: 48, baseCaptureRate: 0.11, rarityWeight: 1, spriteFile: "typhlosion.png", spriteScale: 0.93 },
  torchic: { key: "torchic", name: "Poussifeu", dexNumber: 255, types: ["feu"], baseAttack: 13, baseHp: 22, baseCaptureRate: 0.3, rarityWeight: 18, spriteFile: "torchic.png", spriteScale: 0.78, evolution: { intoKey: "combusken", level: 16 } },
  combusken: { key: "combusken", name: "Galifeu", dexNumber: 256, types: ["feu", "combat"], baseAttack: 18, baseHp: 29, baseCaptureRate: 0.18, rarityWeight: 1, spriteFile: "combusken.png", spriteScale: 0.85, evolution: { intoKey: "blaziken", level: 36 } },
  blaziken: { key: "blaziken", name: "Braségali", dexNumber: 257, types: ["feu", "combat"], baseAttack: 25, baseHp: 39, baseCaptureRate: 0.11, rarityWeight: 1, spriteFile: "blaziken.png", spriteScale: 0.94 },
  chimchar: { key: "chimchar", name: "Ouisticram", dexNumber: 390, types: ["feu"], baseAttack: 14, baseHp: 22, baseCaptureRate: 0.3, rarityWeight: 14, spriteFile: "chimchar.png", spriteScale: 0.79, evolution: { intoKey: "monferno", level: 14 } },
  monferno: { key: "monferno", name: "Chimpenfeu", dexNumber: 391, types: ["feu", "combat"], baseAttack: 19, baseHp: 32, baseCaptureRate: 0.18, rarityWeight: 1, spriteFile: "monferno.png", spriteScale: 0.85, evolution: { intoKey: "infernape", level: 36 } },
  infernape: { key: "infernape", name: "Simiabraz", dexNumber: 392, types: ["feu", "combat"], baseAttack: 25, baseHp: 38, baseCaptureRate: 0.11, rarityWeight: 1, spriteFile: "infernape.png", spriteScale: 0.88 },
  numel: { key: "numel", name: "Chamallot", dexNumber: 322, types: ["feu", "sol"], baseAttack: 11, baseHp: 30, baseCaptureRate: 0.4, rarityWeight: 8, spriteFile: "numel.png", spriteScale: 0.83, evolution: { intoKey: "camerupt", level: 33 } },

  // --- Route 7 (feu, high tier — evolved forms) ---
  arcanine: { key: "arcanine", name: "Arcanin", dexNumber: 59, types: ["feu"], baseAttack: 24, baseHp: 46, baseCaptureRate: 0.2, rarityWeight: 30, spriteFile: "arcanine.png", spriteScale: 0.94 },
  rapidash: { key: "rapidash", name: "Galopa", dexNumber: 78, types: ["feu"], baseAttack: 22, baseHp: 38, baseCaptureRate: 0.22, rarityWeight: 24, spriteFile: "rapidash.png", spriteScale: 0.93 },
  magmar: { key: "magmar", name: "Magmar", dexNumber: 126, types: ["feu"], baseAttack: 23, baseHp: 36, baseCaptureRate: 0.22, rarityWeight: 18, spriteFile: "magmar.png", spriteScale: 0.89 },
  torkoal: { key: "torkoal", name: "Chartor", dexNumber: 324, types: ["feu"], baseAttack: 18, baseHp: 42, baseCaptureRate: 0.25, rarityWeight: 12, spriteFile: "torkoal.png", spriteScale: 0.79 },
  camerupt: { key: "camerupt", name: "Camérupt", dexNumber: 323, types: ["feu", "sol"], baseAttack: 22, baseHp: 44, baseCaptureRate: 0.22, rarityWeight: 8, spriteFile: "camerupt.png", spriteScale: 0.94 },

  // --- Usine Abandonnée dungeon (electrique, low-mid tier — basic forms) ---
  pikachu: { key: "pikachu", name: "Pikachu", dexNumber: 25, types: ["electrique"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.3, rarityWeight: 10, spriteFile: "pikachu.png", spriteScale: 0.78, stoneEvolutions: [{ stoneKey: "pierre_foudre", intoKey: "raichu" }] },
  magnemite: { key: "magnemite", name: "Magnéti", dexNumber: 81, types: ["electrique", "acier"], baseAttack: 12, baseHp: 20, baseCaptureRate: 0.4, rarityWeight: 28, spriteFile: "magnemite.png", spriteScale: 0.75, evolution: { intoKey: "magneton", level: 30 } },
  magneton: { key: "magneton", name: "Magnéton", dexNumber: 82, types: ["electrique", "acier"], baseAttack: 18, baseHp: 25, baseCaptureRate: 0.24, rarityWeight: 1, spriteFile: "magneton.png", spriteScale: 0.86 },
  voltorb: { key: "voltorb", name: "Voltorbe", dexNumber: 100, types: ["electrique"], baseAttack: 11, baseHp: 22, baseCaptureRate: 0.4, rarityWeight: 24, spriteFile: "voltorb.png", spriteScale: 0.79, evolution: { intoKey: "electrode", level: 30 } },
  electrode: { key: "electrode", name: "Électrode", dexNumber: 101, types: ["electrique"], baseAttack: 17, baseHp: 28, baseCaptureRate: 0.24, rarityWeight: 1, spriteFile: "electrode.png", spriteScale: 0.88 },
  mareep: { key: "mareep", name: "Wattouat", dexNumber: 179, types: ["electrique"], baseAttack: 10, baseHp: 26, baseCaptureRate: 0.42, rarityWeight: 20, spriteFile: "mareep.png", spriteScale: 0.81, evolution: { intoKey: "flaaffy", level: 15 } },
  flaaffy: { key: "flaaffy", name: "Lainergie", dexNumber: 180, types: ["electrique"], baseAttack: 14, baseHp: 33, baseCaptureRate: 0.25, rarityWeight: 1, spriteFile: "flaaffy.png", spriteScale: 0.84, evolution: { intoKey: "ampharos", level: 30 } },
  shinx: { key: "shinx", name: "Lixy", dexNumber: 403, types: ["electrique"], baseAttack: 13, baseHp: 24, baseCaptureRate: 0.35, rarityWeight: 14, spriteFile: "shinx.png", spriteScale: 0.79, evolution: { intoKey: "luxio", level: 15 } },
  luxio: { key: "luxio", name: "Luxio", dexNumber: 404, types: ["electrique"], baseAttack: 17, baseHp: 32, baseCaptureRate: 0.21, rarityWeight: 1, spriteFile: "luxio.png", spriteScale: 0.85, evolution: { intoKey: "luxray", level: 30 } },

  // --- Route 9 (electrique, highest tier — evolved forms) ---
  raichu: { key: "raichu", name: "Raichu", dexNumber: 26, types: ["electrique"], baseAttack: 26, baseHp: 38, baseCaptureRate: 0.18, rarityWeight: 24, spriteFile: "raichu.png", spriteScale: 0.84 },
  magnezone: { key: "magnezone", name: "Magnézone", dexNumber: 462, types: ["electrique", "acier"], baseAttack: 25, baseHp: 40, baseCaptureRate: 0.18, rarityWeight: 20, spriteFile: "magnezone.png", spriteScale: 0.88 },
  electivire: { key: "electivire", name: "Élekable", dexNumber: 466, types: ["electrique"], baseAttack: 27, baseHp: 42, baseCaptureRate: 0.16, rarityWeight: 16, spriteFile: "electivire.png", spriteScale: 0.93 },
  ampharos: { key: "ampharos", name: "Pharamp", dexNumber: 181, types: ["electrique"], baseAttack: 24, baseHp: 46, baseCaptureRate: 0.2, rarityWeight: 12, spriteFile: "ampharos.png", spriteScale: 0.9 },
  luxray: { key: "luxray", name: "Luxray", dexNumber: 405, types: ["electrique"], baseAttack: 26, baseHp: 36, baseCaptureRate: 0.18, rarityWeight: 8, spriteFile: "luxray.png", spriteScale: 0.9 },
};
