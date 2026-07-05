import { useState } from "react";
import { CITY_MAPS, type CityMapHotspot } from "@farm-clicker/shared";
import { MapView } from "../components/map/MapView";
import { HotspotPanel } from "../components/map/HotspotPanel";
import { useExplorationStore } from "../state/explorationStore";

const HOTSPOT_CLASS: Record<CityMapHotspot["kind"], string> = {
  route: "map-hotspot-route",
  poi: "map-hotspot-poi",
  dungeon: "map-hotspot-dungeon",
};

export function CityMapPage({ cityId }: { cityId: string }) {
  const goToWorld = useExplorationStore((s) => s.goToWorld);
  const [selected, setSelected] = useState<CityMapHotspot | null>(null);
  const cityMap = CITY_MAPS[cityId];

  if (!cityMap) {
    return (
      <div className="map-page">
        <h1 className="title">Bientôt disponible</h1>
        <p>Cette ville n'a pas encore de carte détaillée.</p>
        <button type="button" className="btn-link" onClick={goToWorld}>
          Retour à la carte du monde
        </button>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="topbar">
        <h1 className="title" style={{ margin: 0 }}>
          {cityMap.name}
        </h1>
        <button type="button" className="btn-link" onClick={goToWorld}>
          Retour à la carte du monde
        </button>
      </div>

      <MapView<CityMapHotspot>
        imageSrc={cityMap.imageSrc}
        imageAlt={cityMap.name}
        hotspots={cityMap.hotspots}
        markerClassName={(hotspot) => HOTSPOT_CLASS[hotspot.kind]}
        markerLabel={(hotspot) => hotspot.name}
        onHotspotClick={setSelected}
      />

      {selected && <HotspotPanel hotspot={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
