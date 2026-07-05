import type { ElementalType } from "./species.js";

/** Position of a hotspot as a percentage of the background image's width/height, so it
 * stays aligned across resolutions without ever slicing the source image itself. */
export interface HotspotShape {
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
}

export interface EncounterTableEntry {
  speciesKey: string;
  minLevel: number;
  maxLevel: number;
  rarityWeight: number;
  captureRate: number;
}

/** A city on the world map: clicking it transitions to that city's map. */
export interface CityHotspot {
  kind: "city";
  id: string;
  name: string;
  shape: HotspotShape;
  cityId: string;
}

/** A wild-encounter zone inside a city (or later, the world map itself). */
export interface RouteHotspot {
  kind: "route";
  id: string;
  name: string;
  shape: HotspotShape;
  elementalType: ElementalType;
  encounterTable: EncounterTableEntry[];
}

export type PoiAction = "heal" | "shop" | "lab" | "quest" | "info";

/** A named point of interest: Pokémon Center, shop, lab, NPC, etc. */
export interface PoiHotspot {
  kind: "poi";
  id: string;
  name: string;
  shape: HotspotShape;
  action: PoiAction;
}

/** A dungeon: harder, rarer encounters than a regular route. */
export interface DungeonHotspot {
  kind: "dungeon";
  id: string;
  name: string;
  shape: HotspotShape;
  elementalType: ElementalType;
  encounterTable: EncounterTableEntry[];
}

export type CityMapHotspot = RouteHotspot | PoiHotspot | DungeonHotspot;

export interface CityMapConfig {
  id: string;
  name: string;
  imageSrc: string;
  hotspots: CityMapHotspot[];
}

export interface WorldMapConfig {
  id: string;
  name: string;
  imageSrc: string;
  hotspots: CityHotspot[];
}
