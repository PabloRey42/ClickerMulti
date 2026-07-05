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
        { speciesKey: "moucheron-foudre", minLevel: 8, maxLevel: 11, rarityWeight: 15, captureRate: 0.25 },
        { speciesKey: "goupil-etincelle", minLevel: 9, maxLevel: 12, rarityWeight: 8, captureRate: 0.2 },
      ],
      shape: { xPercent: 33, yPercent: 15, radiusPercent: 3 },
    },
    {
      kind: "dungeon",
      id: "aurora-crypte-des-anciens",
      name: "Crypte des Anciens",
      elementalType: "feu",
      encounterTable: [
        { speciesKey: "renardeau", minLevel: 9, maxLevel: 12, rarityWeight: 18, captureRate: 0.3 },
        { speciesKey: "salamandre", minLevel: 9, maxLevel: 13, rarityWeight: 22, captureRate: 0.35 },
      ],
      shape: { xPercent: 84, yPercent: 15, radiusPercent: 3 },
    },
    {
      kind: "dungeon",
      id: "aurora-egouts-sombres",
      name: "Égouts Sombres",
      elementalType: "eau",
      encounterTable: [
        { speciesKey: "loutre", minLevel: 8, maxLevel: 11, rarityWeight: 28, captureRate: 0.4 },
        { speciesKey: "grenouille", minLevel: 8, maxLevel: 12, rarityWeight: 32, captureRate: 0.42 },
      ],
      shape: { xPercent: 21, yPercent: 63, radiusPercent: 3 },
    },

    { kind: "poi", id: "aurora-laboratoire", name: "Laboratoire du Professeur Chêne", action: "lab", shape: { xPercent: 47, yPercent: 32, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-bibliotheque", name: "Bibliothèque d'Aurora", action: "info", shape: { xPercent: 36, yPercent: 38, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-marche", name: "Marché Artisanal", action: "shop", shape: { xPercent: 44, yPercent: 44, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-place", name: "Place d'Aurora (Centre Pokémon Central)", action: "heal", shape: { xPercent: 58, yPercent: 43, radiusPercent: 3.5 } },
    { kind: "poi", id: "aurora-gare", name: "Gare Centrale", action: "info", shape: { xPercent: 51, yPercent: 51, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-parc", name: "Parc de la Ville", action: "quest", shape: { xPercent: 59, yPercent: 53, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-hotel", name: "Hôtel de la Métropole", action: "info", shape: { xPercent: 69, yPercent: 54, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-port", name: "Port Urbain", action: "info", shape: { xPercent: 46, yPercent: 78, radiusPercent: 3 } },

    {
      kind: "route",
      id: "aurora-route-1",
      name: "Route 1",
      elementalType: "normal",
      encounterTable: [
        { speciesKey: "moineau", minLevel: 2, maxLevel: 4, rarityWeight: 50, captureRate: 0.5 },
        { speciesKey: "ecureuil", minLevel: 2, maxLevel: 4, rarityWeight: 40, captureRate: 0.45 },
      ],
      shape: { xPercent: 49, yPercent: 43, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-2",
      name: "Route 2",
      elementalType: "plante",
      encounterTable: [
        { speciesKey: "lierre", minLevel: 3, maxLevel: 5, rarityWeight: 35, captureRate: 0.45 },
        { speciesKey: "scarabee", minLevel: 3, maxLevel: 5, rarityWeight: 22, captureRate: 0.32 },
      ],
      shape: { xPercent: 40, yPercent: 25, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-3",
      name: "Route 3",
      elementalType: "normal",
      encounterTable: [
        { speciesKey: "moineau", minLevel: 4, maxLevel: 7, rarityWeight: 15000, captureRate: 0.5 },
        { speciesKey: "ecureuil", minLevel: 4, maxLevel: 7, rarityWeight: 9999, captureRate: 0.45 },
        // Ultra-rare: exactly 1/25000 (1 / (15000+9999+1)).
        { speciesKey: "mew", minLevel: 30, maxLevel: 30, rarityWeight: 1, captureRate: 0.03 },
      ],
      shape: { xPercent: 62, yPercent: 64, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-4",
      name: "Route 4",
      elementalType: "eau",
      encounterTable: [
        { speciesKey: "grenouille", minLevel: 3, maxLevel: 6, rarityWeight: 35, captureRate: 0.42 },
        { speciesKey: "loutre", minLevel: 3, maxLevel: 6, rarityWeight: 30, captureRate: 0.4 },
      ],
      shape: { xPercent: 58, yPercent: 13, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-7",
      name: "Route 7",
      elementalType: "feu",
      encounterTable: [
        { speciesKey: "salamandre", minLevel: 4, maxLevel: 7, rarityWeight: 30, captureRate: 0.35 },
        { speciesKey: "renardeau", minLevel: 4, maxLevel: 7, rarityWeight: 20, captureRate: 0.3 },
      ],
      shape: { xPercent: 33, yPercent: 68, radiusPercent: 2.5 },
    },
    {
      kind: "route",
      id: "aurora-route-9",
      name: "Route 9",
      elementalType: "electrique",
      encounterTable: [
        { speciesKey: "moucheron-foudre", minLevel: 5, maxLevel: 8, rarityWeight: 12, captureRate: 0.25 },
        { speciesKey: "ecureuil", minLevel: 5, maxLevel: 7, rarityWeight: 20, captureRate: 0.45 },
      ],
      shape: { xPercent: 71, yPercent: 27, radiusPercent: 2.5 },
    },
  ],
};

export const CITY_MAPS: Record<string, CityMapConfig> = {
  aurora: AURORA_CITY_MAP,
};
