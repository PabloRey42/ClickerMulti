import { useState } from "react";
import { CITY_MAPS, type CityMapHotspot } from "@farm-clicker/shared";
import { MapView } from "../components/map/MapView";
import { MapLegend } from "../components/map/MapLegend";
import { HotspotPanel } from "../components/map/HotspotPanel";
import { ShopPanel } from "../components/map/ShopPanel";
import { MarketPanel } from "../components/map/MarketPanel";
import { QuestNpcPanel } from "../components/map/QuestNpcPanel";
import { useExplorationStore } from "../state/explorationStore";
import { useAuthStore } from "../state/authStore";
import { useBattleStore } from "../state/battleStore";
import { useTeamStore } from "../state/teamStore";
import { enterRoute, healTeam } from "../api/exploration";
import { ApiError } from "../api/client";

const HOTSPOT_CLASS: Record<CityMapHotspot["kind"], string> = {
  route: "bg-stat-hp",
  poi: "bg-stat-xp",
  dungeon: "bg-stat-pp",
  raid: "raid-marker bg-gradient-to-br from-stat-pp to-gold",
};

const ERROR_MESSAGES: Record<string, string> = {
  no_active_creature: "Tu n'as aucun Pokémon actif.",
  active_creature_fainted: "Ton Pokémon actif est K.O. — soigne-le d'abord.",
  route_not_found: "Cette zone n'a pas encore de contenu.",
  league_in_progress: "Impossible de soigner ton équipe pendant un combat de Ligue.",
};

export function CityMapPage({ cityId }: { cityId: string }) {
  const goToWorld = useExplorationStore((s) => s.goToWorld);
  const goToEncounter = useExplorationStore((s) => s.goToEncounter);
  const goToRaidBrowser = useExplorationStore((s) => s.goToRaidBrowser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const setBattleState = useBattleStore((s) => s.setState);
  const refreshTeamSidebar = useTeamStore((s) => s.refresh);
  const [selected, setSelected] = useState<CityMapHotspot | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [questNpcHotspotId, setQuestNpcHotspotId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cityMap = CITY_MAPS[cityId];

  if (!cityMap) {
    return (
      <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
        <h1 className="mb-2 text-lg font-black tracking-wide text-gold-light">Bientôt disponible</h1>
        <p className="mb-3 text-sm font-semibold text-panel-foreground/70">
          Cette ville n'a pas encore de carte détaillée.
        </p>
        <button
          type="button"
          onClick={goToWorld}
          className="text-sm font-bold text-gold-light underline-offset-2 hover:underline"
        >
          Retour à la carte du monde
        </button>
      </section>
    );
  }

  function handleSelect(hotspot: CityMapHotspot) {
    setError(null);
    setSelected(hotspot);
  }

  async function handleEnterRoute(hotspot: CityMapHotspot) {
    if (!accessToken || (hotspot.kind !== "route" && hotspot.kind !== "dungeon")) return;
    setBusy(true);
    setError(null);
    try {
      const state = await enterRoute(accessToken, hotspot.id);
      setBattleState(state);
      setSelected(null);
      goToEncounter({ view: "city", cityId });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Impossible d'explorer cette zone.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleHeal() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const state = await healTeam(accessToken);
      setBattleState(state);
      setSelected(null);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Impossible de soigner ton équipe.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black tracking-wide text-gold-light sm:text-xl">{cityMap.name}</h1>
        <button
          type="button"
          onClick={goToWorld}
          className="text-xs font-bold text-panel-foreground/70 underline-offset-2 hover:text-gold-light hover:underline"
        >
          Retour à la carte du monde
        </button>
      </div>

      <MapView<CityMapHotspot>
        imageSrc={cityMap.imageSrc}
        imageAlt={cityMap.name}
        hotspots={cityMap.hotspots}
        markerClassName={(hotspot) => HOTSPOT_CLASS[hotspot.kind]}
        markerLabel={(hotspot) => hotspot.name}
        onHotspotClick={handleSelect}
      />

      <MapLegend
        items={[
          { color: "bg-stat-hp", label: "Route" },
          { color: "bg-stat-xp", label: "Point d'intérêt" },
          { color: "bg-stat-pp", label: "Donjon" },
          { color: "bg-gradient-to-br from-stat-pp to-gold", label: "Raid" },
        ]}
      />

      {selected && (
        <HotspotPanel
          hotspot={selected}
          busy={busy}
          error={error}
          onClose={() => setSelected(null)}
          onEnterRoute={handleEnterRoute}
          onHeal={handleHeal}
          onOpenShop={() => {
            setSelected(null);
            setShowShop(true);
          }}
          onOpenMarket={() => {
            setSelected(null);
            setShowMarket(true);
          }}
          onOpenQuest={() => {
            if (selected) setQuestNpcHotspotId(selected.id);
            setSelected(null);
          }}
          onOpenRaid={() => {
            if (selected) goToRaidBrowser(selected.id, cityId);
            setSelected(null);
          }}
        />
      )}

      {showShop && <ShopPanel onClose={() => setShowShop(false)} />}
      {showMarket && <MarketPanel onClose={() => setShowMarket(false)} />}
      {questNpcHotspotId && (
        <QuestNpcPanel npcHotspotId={questNpcHotspotId} onClose={() => setQuestNpcHotspotId(null)} />
      )}
    </section>
  );
}
