import { useEffect, useState } from "react";
import { LUMINA_WORLD_MAP, type WorldMapHotspot, type PlayerCreatureView } from "@farm-clicker/shared";
import { MapView } from "../components/map/MapView";
import { MapLegend } from "../components/map/MapLegend";
import { useExplorationStore } from "../state/explorationStore";
import { useAuthStore } from "../state/authStore";
import { pingQuestObjective } from "../api/quests";
import { touchLandmark } from "../api/exploration";
import { creatureSpriteSrc } from "../theme/typeColors";

const HOTSPOT_CLASS: Record<WorldMapHotspot["kind"], string> = {
  city: "bg-stat-hp",
  league: "bg-gold",
};

export function WorldMapPage() {
  const goToCity = useExplorationStore((s) => s.goToCity);
  const goToLeague = useExplorationStore((s) => s.goToLeague);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [taps, setTaps] = useState(0);
  const [found, setFound] = useState(false);
  const [reveal, setReveal] = useState<PlayerCreatureView | null>(null);
  const [risen, setRisen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    pingQuestObjective(accessToken, "visit_world_map").catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!reveal) return setRisen(false);
    const id = window.setTimeout(() => setRisen(true), 40);
    return () => window.clearTimeout(id);
  }, [reveal]);

  function handleClick(hotspot: WorldMapHotspot) {
    if (hotspot.kind === "city") goToCity(hotspot.cityId);
    else goToLeague();
  }

  async function nudge(e: React.MouseEvent) {
    e.stopPropagation();
    const n = taps + 1;
    setTaps(n);
    if (n < 12 || !accessToken) return;
    setTaps(0);
    try {
      const c = await touchLandmark(accessToken);
      setFound(true);
      setReveal(c);
    } catch {
      // nothing to see here
    }
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
      >
        {!found && (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={nudge}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: "49%",
              top: "32%",
              width: `${5 + taps * 0.7}px`,
              height: `${5 + taps * 0.7}px`,
              background: "radial-gradient(circle at 50% 25%, #86e06a, #2f7d1e)",
              opacity: 0.55 + taps * 0.035,
              boxShadow: taps > 4 ? "0 0 5px rgba(120,220,90,0.8)" : "none",
            }}
          />
        )}
      </MapView>

      <MapLegend
        items={[
          { color: "bg-stat-hp", label: "Ville" },
          { color: "bg-gold", label: "Ligue Pokémon" },
        ]}
      />

      {reveal && (
        <div
          className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black/85 p-4"
          onClick={() => setReveal(null)}
        >
          <div className="relative h-48 w-48 overflow-hidden">
            <img
              src={creatureSpriteSrc(reveal.spriteFile, reveal.isShiny)}
              alt={reveal.name}
              className="absolute left-1/2 h-40 w-40 -translate-x-1/2 object-contain [image-rendering:pixelated] transition-all duration-[1300ms] ease-out"
              style={{ bottom: risen ? "20%" : "-45%", opacity: risen ? 1 : 0 }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#301c0e] to-[#6b4423]"
              style={{
                clipPath:
                  "polygon(0 40%,8% 8%,19% 42%,30% 4%,42% 40%,54% 6%,66% 44%,78% 10%,90% 40%,100% 16%,100% 100%,0 100%)",
              }}
            />
          </div>
          <p className="text-center text-lg font-black tracking-wide text-gold-light">
            {reveal.isShiny ? "✨ " : ""}
            {reveal.name} surgit de la terre !
          </p>
          <p className="text-xs font-bold text-panel-foreground/60">(clique pour fermer)</p>
        </div>
      )}
    </section>
  );
}
