import { CITY_MAPS } from "./lumina.js";
import type { RouteHotspot, DungeonHotspot, RaidHotspot } from "./types.js";

/** Finds a route/dungeon hotspot by id across every city map. Shared so both the server
 * (rolling/rerolling encounters) and the client (showing spawn odds) use the same lookup. */
export function findEncounterHotspot(routeKey: string): RouteHotspot | DungeonHotspot | undefined {
  for (const city of Object.values(CITY_MAPS)) {
    for (const hotspot of city.hotspots) {
      if ((hotspot.kind === "route" || hotspot.kind === "dungeon") && hotspot.id === routeKey) {
        return hotspot;
      }
    }
  }
  return undefined;
}

/** Finds a raid hotspot by id across every city map — mirrors findEncounterHotspot exactly.
 * Used server-side to validate a hotspotId and resolve its cityMapId before creating a lobby. */
export function findRaidHotspot(hotspotId: string): RaidHotspot | undefined {
  for (const city of Object.values(CITY_MAPS)) {
    for (const hotspot of city.hotspots) {
      if (hotspot.kind === "raid" && hotspot.id === hotspotId) return hotspot;
    }
  }
  return undefined;
}
