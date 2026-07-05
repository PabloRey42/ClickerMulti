import { CITY_MAPS } from "./lumina.js";
import type { RouteHotspot, DungeonHotspot } from "./types.js";

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
