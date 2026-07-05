import { LUMINA_WORLD_MAP, type WorldMapHotspot } from "@farm-clicker/shared";
import { MapView } from "../components/map/MapView";
import { useExplorationStore } from "../state/explorationStore";

const HOTSPOT_CLASS: Record<WorldMapHotspot["kind"], string> = {
  city: "map-hotspot-city",
  league: "map-hotspot-league",
};

export function WorldMapPage() {
  const goToCity = useExplorationStore((s) => s.goToCity);
  const goToLeague = useExplorationStore((s) => s.goToLeague);

  function handleClick(hotspot: WorldMapHotspot) {
    if (hotspot.kind === "city") goToCity(hotspot.cityId);
    else goToLeague();
  }

  return (
    <div className="map-page">
      <h1 className="title">{LUMINA_WORLD_MAP.name}</h1>
      <MapView<WorldMapHotspot>
        imageSrc={LUMINA_WORLD_MAP.imageSrc}
        imageAlt={LUMINA_WORLD_MAP.name}
        hotspots={LUMINA_WORLD_MAP.hotspots}
        markerClassName={(hotspot) => HOTSPOT_CLASS[hotspot.kind]}
        markerLabel={(hotspot) => hotspot.name}
        onHotspotClick={handleClick}
      />
    </div>
  );
}
