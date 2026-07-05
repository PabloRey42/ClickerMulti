import { useState } from "react";
import { CITY_MAPS, type CityMapHotspot } from "@farm-clicker/shared";
import { MapView } from "../components/map/MapView";
import { HotspotPanel } from "../components/map/HotspotPanel";
import { ShopPanel } from "../components/map/ShopPanel";
import { useExplorationStore } from "../state/explorationStore";
import { useAuthStore } from "../state/authStore";
import { useBattleStore } from "../state/battleStore";
import { useTeamStore } from "../state/teamStore";
import { enterRoute, healTeam } from "../api/exploration";
import { ApiError } from "../api/client";

const HOTSPOT_CLASS: Record<CityMapHotspot["kind"], string> = {
  route: "map-hotspot-route",
  poi: "map-hotspot-poi",
  dungeon: "map-hotspot-dungeon",
};

const ERROR_MESSAGES: Record<string, string> = {
  no_active_creature: "Tu n'as aucun Pokémon actif.",
  active_creature_fainted: "Ton Pokémon actif est K.O. — soigne-le d'abord.",
  route_not_found: "Cette zone n'a pas encore de contenu.",
};

export function CityMapPage({ cityId }: { cityId: string }) {
  const goToWorld = useExplorationStore((s) => s.goToWorld);
  const goToEncounter = useExplorationStore((s) => s.goToEncounter);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const setBattleState = useBattleStore((s) => s.setState);
  const refreshTeamSidebar = useTeamStore((s) => s.refresh);
  const [selected, setSelected] = useState<CityMapHotspot | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBusy(false);
    }
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
        onHotspotClick={handleSelect}
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
        />
      )}

      {showShop && <ShopPanel onClose={() => setShowShop(false)} />}
    </div>
  );
}
