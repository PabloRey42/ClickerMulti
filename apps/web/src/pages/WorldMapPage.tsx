import { useEffect } from "react";
import { LUMINA_WORLD_MAP, type WorldMapHotspot } from "@farm-clicker/shared";
import { MapView } from "../components/map/MapView";
import { MapLegend } from "../components/map/MapLegend";
import { useExplorationStore } from "../state/explorationStore";
import { useAuthStore } from "../state/authStore";
import { pingQuestObjective } from "../api/quests";

const HOTSPOT_CLASS: Record<WorldMapHotspot["kind"], string> = {
  city: "bg-stat-hp",
  league: "bg-gold",
};

export function WorldMapPage() {
  const goToCity = useExplorationStore((s) => s.goToCity);
  const goToLeague = useExplorationStore((s) => s.goToLeague);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    pingQuestObjective(accessToken, "visit_world_map").catch(() => {});
  }, [accessToken]);

  function handleClick(hotspot: WorldMapHotspot) {
    if (hotspot.kind === "city") goToCity(hotspot.cityId);
    else goToLeague();
  }

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-4">
      <h1 className="mb-3 text-center text-lg font-black tracking-wide text-gold-light sm:text-xl">
        {LUMINA_WORLD_MAP.name}
      </h1>

      <MapView<WorldMapHotspot>
        imageSrc={LUMINA_WORLD_MAP.imageSrc}
        imageAlt={LUMINA_WORLD_MAP.name}
        hotspots={LUMINA_WORLD_MAP.hotspots}
        markerClassName={(hotspot) => HOTSPOT_CLASS[hotspot.kind]}
        markerLabel={(hotspot) => hotspot.name}
        onHotspotClick={handleClick}
      />

      <MapLegend
        items={[
          { color: "bg-stat-hp", label: "Ville" },
          { color: "bg-gold", label: "Ligue Pokémon" },
        ]}
      />
    </section>
  );
}
