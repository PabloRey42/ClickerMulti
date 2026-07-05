import { LUMINA_WORLD_MAP, type CityHotspot } from "@farm-clicker/shared";
import { MapView } from "../components/map/MapView";
import { useExplorationStore } from "../state/explorationStore";

export function WorldMapPage() {
  const goToCity = useExplorationStore((s) => s.goToCity);

  return (
    <div className="map-page">
      <h1 className="title">{LUMINA_WORLD_MAP.name}</h1>
      <MapView<CityHotspot>
        imageSrc={LUMINA_WORLD_MAP.imageSrc}
        imageAlt={LUMINA_WORLD_MAP.name}
        hotspots={LUMINA_WORLD_MAP.hotspots}
        markerClassName={() => "map-hotspot-city"}
        markerLabel={(hotspot) => hotspot.name}
        onHotspotClick={(hotspot) => goToCity(hotspot.cityId)}
      />
    </div>
  );
}
