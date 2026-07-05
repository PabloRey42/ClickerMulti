import type { CityMapConfig, WorldMapConfig } from "./types.js";

/**
 * Coordinates below are eyeballed from the source map artwork, not measured pixel-by-pixel.
 * They're meant to be refined with the in-app coordinate editor (click a hotspot's rough
 * spot on the map, copy the exact %, paste it here) rather than trusted as final.
 */
export const LUMINA_WORLD_MAP: WorldMapConfig = {
  id: "lumina",
  name: "Région de Lumina",
  imageSrc: "/maps/lumina-world-map.png",
  hotspots: [
    { kind: "city", id: "world-city-volcanique", name: "Volcanique", cityId: "volcanique", shape: { xPercent: 26, yPercent: 32, radiusPercent: 3 } },
    { kind: "city", id: "world-city-chene", name: "Ville du Chêne", cityId: "ville-du-chene", shape: { xPercent: 44, yPercent: 40, radiusPercent: 3 } },
    { kind: "city", id: "world-city-sablonnia", name: "Sablonnia", cityId: "sablonnia", shape: { xPercent: 20, yPercent: 58, radiusPercent: 3 } },
    { kind: "city", id: "world-city-aurora", name: "Métropole d'Aurora", cityId: "aurora", shape: { xPercent: 58, yPercent: 48, radiusPercent: 3.5 } },
    { kind: "city", id: "world-city-coralis", name: "Coralis", cityId: "coralis", shape: { xPercent: 44, yPercent: 78, radiusPercent: 3 } },
  ],
};

export const AURORA_CITY_MAP: CityMapConfig = {
  id: "aurora",
  name: "Métropole d'Aurora",
  imageSrc: "/maps/aurora-city-map.png",
  hotspots: [
    { kind: "dungeon", id: "aurora-usine-abandonnee", name: "Usine Abandonnée", encounterTable: [], shape: { xPercent: 22, yPercent: 14, radiusPercent: 3 } },
    { kind: "dungeon", id: "aurora-crypte-des-anciens", name: "Crypte des Anciens", encounterTable: [], shape: { xPercent: 83, yPercent: 14, radiusPercent: 3 } },
    { kind: "dungeon", id: "aurora-egouts-sombres", name: "Égouts Sombres", encounterTable: [], shape: { xPercent: 23, yPercent: 52, radiusPercent: 3 } },

    { kind: "poi", id: "aurora-laboratoire", name: "Laboratoire du Professeur Chêne", action: "lab", shape: { xPercent: 42, yPercent: 28, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-bibliotheque", name: "Bibliothèque d'Aurora", action: "info", shape: { xPercent: 24, yPercent: 32, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-marche", name: "Marché Artisanal", action: "shop", shape: { xPercent: 38, yPercent: 42, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-place", name: "Place d'Aurora (Centre Pokémon Central)", action: "heal", shape: { xPercent: 52, yPercent: 42, radiusPercent: 3.5 } },
    { kind: "poi", id: "aurora-gare", name: "Gare Centrale", action: "info", shape: { xPercent: 50, yPercent: 55, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-parc", name: "Parc de la Ville", action: "quest", shape: { xPercent: 58, yPercent: 55, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-hotel", name: "Hôtel de la Métropole", action: "info", shape: { xPercent: 68, yPercent: 55, radiusPercent: 3 } },
    { kind: "poi", id: "aurora-port", name: "Port Urbain", action: "info", shape: { xPercent: 37, yPercent: 78, radiusPercent: 3 } },

    { kind: "route", id: "aurora-route-1", name: "Route 1", encounterTable: [], shape: { xPercent: 44, yPercent: 38, radiusPercent: 2.5 } },
    { kind: "route", id: "aurora-route-2", name: "Route 2", encounterTable: [], shape: { xPercent: 28, yPercent: 20, radiusPercent: 2.5 } },
    { kind: "route", id: "aurora-route-4", name: "Route 4", encounterTable: [], shape: { xPercent: 52, yPercent: 20, radiusPercent: 2.5 } },
    { kind: "route", id: "aurora-route-7", name: "Route 7", encounterTable: [], shape: { xPercent: 40, yPercent: 62, radiusPercent: 2.5 } },
    { kind: "route", id: "aurora-route-9", name: "Route 9", encounterTable: [], shape: { xPercent: 65, yPercent: 26, radiusPercent: 2.5 } },
  ],
};

export const CITY_MAPS: Record<string, CityMapConfig> = {
  aurora: AURORA_CITY_MAP,
};
