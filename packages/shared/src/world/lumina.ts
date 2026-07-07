import type { CityMapConfig, WorldMapConfig } from "./types.js";

/**
 * Coordinates below were calibrated against the actual artwork by overlaying a percentage
 * grid on the source PNGs and reading each landmark's real position off it (the original
 * eyeballed guesses were consistently several percent too far left/up). Still fine to
 * nudge further with the in-app coordinate editor if a specific point looks off.
 */
export const LUMINA_WORLD_MAP: WorldMapConfig = {
  id: "lumina",
  name: "Région de Lumina",
  imageSrc: "/maps/lumina-world-map.png",
  hotspots: [
    { kind: "city", id: "world-city-volcanique", name: "Volcanique", cityId: "volcanique", shape: { xPercent: 27, yPercent: 23, radiusPercent: 3 } },
    { kind: "city", id: "world-city-chene", name: "Ville du Chêne", cityId: "ville-du-chene", shape: { xPercent: 44, yPercent: 32, radiusPercent: 3 } },
    { kind: "city", id: "world-city-sablonnia", name: "Sablonnia", cityId: "sablonnia", shape: { xPercent: 22, yPercent: 54, radiusPercent: 3 } },
    { kind: "city", id: "world-city-aurora", name: "Métropole d'Aurora", cityId: "aurora", shape: { xPercent: 58, yPercent: 34, radiusPercent: 3.5 } },
    { kind: "city", id: "world-city-coralis", name: "Coralis", cityId: "coralis", shape: { xPercent: 45, yPercent: 73, radiusPercent: 3 } },
    { kind: "league", id: "world-league", name: "Ligue Pokémon", shape: { xPercent: 83, yPercent: 17, radiusPercent: 3.5 } },
  ],
};

export const AURORA_CITY_MAP: CityMapConfig = {
  id: "aurora",
  name: "Métropole d'Aurora",
  imageSrc: "/maps/aurora-city-map.png",
  hotspots: [
    {
      kind: "dungeon",
      id: "aurora-usine-abandonnee",
      name: "Usine Abandonnée",
      elementalType: "electrique",
      encounterTable: [
        { speciesKey: "magnemite", minLevel: 8, maxLevel: 12, rarityWeight: 28, captureRate: 0.4 },
        { speciesKey: "voltorb", minLevel: 8, maxLevel: 12, rarityWeight: 24, captureRate: 0.4 },
        { speciesKey: "mareep", minLevel: 8, maxLevel: 12, rarityWeight: 20, captureRate: 0.42 },
        { speciesKey: "shinx", minLevel: 8, maxLevel: 12, rarityWeight: 14, captureRate: 0.35 },
        { speciesKey: "pikachu", minLevel: 8, maxLevel: 12, rarityWeight: 10, captureRate: 0.3 },
      ],
      shape: { xPercent: 33, yPercent: 15, radiusPercent: 3 },
    },
    {
      kind: "dungeon",
      id: "aurora-crypte-des-anciens",
      name: "Crypte des Anciens",
      elementalType: "feu",
      encounterTable: [
        { speciesKey: "growlithe", minLevel: 9, maxLevel: 13, rarityWeight: 30, captureRate: 0.35 },
        { speciesKey: "cyndaquil", minLevel: 9, maxLevel: 13, rarityWeight: 22, captureRate: 0.3 },
        { speciesKey: "torchic", minLevel: 9, maxLevel: 13, rarityWeight: 18, captureRate: 0.3 },
        { speciesKey: "chimchar", minLevel: 9, maxLevel: 13, rarityWeight: 14, captureRate: 0.3 },
        { speciesKey: "numel", minLevel: 9, maxLevel: 13, rarityWeight: 8, captureRate: 0.4 },
      ],
      shape: { xPercent: 84, yPercent: 15, radiusPercent: 3 },
    },
    {
      kind: "dungeon",
      id: "aurora-egouts-sombres",
      name: "Égouts Sombres",
      elementalType: "eau",
      encounterTable: [
        { speciesKey: "magikarp", minLevel: 8, maxLevel: 12, rarityWeight: 40, captureRate: 0.6 },
        { speciesKey: "squirtle", minLevel: 8, maxLevel: 12, rarityWeight: 26, captureRate: 0.35 },
        { speciesKey: "totodile", minLevel: 8, maxLevel: 12, rarityWeight: 22, captureRate: 0.32 },
        { speciesKey: "mudkip", minLevel: 8, maxLevel: 12, rarityWeight: 18, captureRate: 0.32 },
        { speciesKey: "piplup", minLevel: 8, maxLevel: 12, rarityWeight: 14, captureRate: 0.32 },
      ],
      shape: { xPercent: 21, yPercent: 63, radiusPercent: 3 },
    },

    { kind: "poi", id: "aurora-laboratoire", name: "Laboratoire du Professeur Chêne", action: "lab", shape: { xPercent: 47, yPercent: 32, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-bibliotheque", name: "Bibliothèque d'Aurora", action: "quest", shape: { xPercent: 36, yPercent: 38, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-marche", name: "Marché Artisanal", action: "shop", shape: { xPercent: 44, yPercent: 44, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-place", name: "Place d'Aurora (Centre Pokémon Central)", action: "heal", shape: { xPercent: 58, yPercent: 43, radiusPercent: 3.5 } },
    { kind: "poi", id: "aurora-gare", name: "Gare Centrale", action: "quest", shape: { xPercent: 51, yPercent: 51, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-parc", name: "Parc de la Ville", action: "quest", shape: { xPercent: 59, yPercent: 53, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-hotel", name: "Hôtel de la Métropole", action: "info", shape: { xPercent: 69, yPercent: 54, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-port", name: "Port Urbain", action: "info", shape: { xPercent: 46, yPercent: 78, radiusPercent: 3 } },

    {
      kind: "route",
      id: "aurora-route-1",
      name: "Route 1",
      elementalType: "normal",
      encounterTable: [
        { speciesKey: "rattata", minLevel: 1, maxLevel: 2, rarityWeight: 40, captureRate: 0.55 },
        { speciesKey: "zigzagoon", minLevel: 1, maxLevel: 2, rarityWeight: 32, captureRate: 0.5 },
        { speciesKey: "bidoof", minLevel: 1, maxLevel: 2, rarityWeight: 28, captureRate: 0.55 },
        { speciesKey: "lillipup", minLevel: 1, maxLevel: 2, rarityWeight: 20, captureRate: 0.5 },
        { speciesKey: "eevee", minLevel: 1, maxLevel: 2, rarityWeight: 6, captureRate: 0.35 },
      ],
      shape: { xPercent: 49, yPercent: 43, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-2",
      name: "Route 2",
      elementalType: "plante",
      encounterTable: [
        { speciesKey: "shroomish", minLevel: 3, maxLevel: 5, rarityWeight: 32, captureRate: 0.45 },
        { speciesKey: "budew", minLevel: 3, maxLevel: 5, rarityWeight: 26, captureRate: 0.45 },
        { speciesKey: "cottonee", minLevel: 3, maxLevel: 5, rarityWeight: 20, captureRate: 0.5 },
        { speciesKey: "bellsprout", minLevel: 3, maxLevel: 5, rarityWeight: 14, captureRate: 0.42 },
        { speciesKey: "sunkern", minLevel: 3, maxLevel: 5, rarityWeight: 8, captureRate: 0.55 },
      ],
      shape: { xPercent: 40, yPercent: 25, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-3",
      name: "Route 3",
      elementalType: "normal",
      encounterTable: [
        { speciesKey: "raticate", minLevel: 6, maxLevel: 9, rarityWeight: 10000, captureRate: 0.35 },
        { speciesKey: "linoone", minLevel: 6, maxLevel: 9, rarityWeight: 7000, captureRate: 0.35 },
        { speciesKey: "furret", minLevel: 6, maxLevel: 9, rarityWeight: 4000, captureRate: 0.35 },
        { speciesKey: "meowth", minLevel: 6, maxLevel: 9, rarityWeight: 2500, captureRate: 0.4 },
        { speciesKey: "buneary", minLevel: 6, maxLevel: 9, rarityWeight: 1499, captureRate: 0.4 },
        // Ultra-rare: exactly 1/25000 (1 / (10000+7000+4000+2500+1499+1)). Level matches the
        // rest of the route now — it used to be hardcoded to 30, a huge unfair power spike
        // against a team built for level 6-9 encounters.
        { speciesKey: "mew", minLevel: 6, maxLevel: 9, rarityWeight: 1, captureRate: 0.03 },
      ],
      shape: { xPercent: 62, yPercent: 64, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-4",
      name: "Route 4",
      elementalType: "eau",
      encounterTable: [
        { speciesKey: "poliwag", minLevel: 10, maxLevel: 14, rarityWeight: 32, captureRate: 0.42 },
        { speciesKey: "psyduck", minLevel: 10, maxLevel: 14, rarityWeight: 26, captureRate: 0.4 },
        { speciesKey: "horsea", minLevel: 10, maxLevel: 14, rarityWeight: 20, captureRate: 0.38 },
        { speciesKey: "staryu", minLevel: 10, maxLevel: 14, rarityWeight: 14, captureRate: 0.4 },
        { speciesKey: "wooper", minLevel: 10, maxLevel: 14, rarityWeight: 8, captureRate: 0.45 },
      ],
      shape: { xPercent: 58, yPercent: 13, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-7",
      name: "Route 7",
      elementalType: "feu",
      encounterTable: [
        { speciesKey: "arcanine", minLevel: 25, maxLevel: 30, rarityWeight: 30, captureRate: 0.2 },
        { speciesKey: "rapidash", minLevel: 25, maxLevel: 30, rarityWeight: 24, captureRate: 0.22 },
        { speciesKey: "magmar", minLevel: 25, maxLevel: 30, rarityWeight: 18, captureRate: 0.22 },
        { speciesKey: "torkoal", minLevel: 25, maxLevel: 30, rarityWeight: 12, captureRate: 0.25 },
        { speciesKey: "camerupt", minLevel: 25, maxLevel: 30, rarityWeight: 8, captureRate: 0.22 },
      ],
      shape: { xPercent: 33, yPercent: 68, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-9",
      name: "Route 9",
      elementalType: "electrique",
      encounterTable: [
        { speciesKey: "raichu", minLevel: 32, maxLevel: 36, rarityWeight: 24, captureRate: 0.18 },
        { speciesKey: "magnezone", minLevel: 32, maxLevel: 36, rarityWeight: 20, captureRate: 0.18 },
        { speciesKey: "electivire", minLevel: 32, maxLevel: 36, rarityWeight: 16, captureRate: 0.16 },
        { speciesKey: "ampharos", minLevel: 32, maxLevel: 36, rarityWeight: 12, captureRate: 0.2 },
        { speciesKey: "luxray", minLevel: 32, maxLevel: 36, rarityWeight: 8, captureRate: 0.18 },
      ],
      shape: { xPercent: 71, yPercent: 27, radiusPercent: 2.5 },
    },
  ],
};

export const CITY_MAPS: Record<string, CityMapConfig> = {
  aurora: AURORA_CITY_MAP,
};
