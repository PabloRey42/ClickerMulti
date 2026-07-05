import type { CityMapHotspot, PoiAction } from "@farm-clicker/shared";

const POI_ACTION_LABEL: Record<PoiAction, string> = {
  heal: "Soigne toute ton équipe",
  shop: "Achète des pokéballs",
  lab: "Parle au Professeur",
  quest: "Quêtes (bientôt disponibles)",
  info: "Point d'intérêt",
};

interface HotspotPanelProps {
  hotspot: CityMapHotspot;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onEnterRoute: (hotspot: CityMapHotspot) => void;
  onHeal: () => void;
  onOpenShop: () => void;
}

export function HotspotPanel({
  hotspot,
  busy,
  error,
  onClose,
  onEnterRoute,
  onHeal,
  onOpenShop,
}: HotspotPanelProps) {
  const isEncounterZone = hotspot.kind === "route" || hotspot.kind === "dungeon";

  return (
    <div className="hotspot-panel-overlay" onClick={onClose}>
      <div className="hotspot-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="encounter-name">{hotspot.name}</h2>

        {hotspot.kind === "poi" && <p>{POI_ACTION_LABEL[hotspot.action]}</p>}
        {isEncounterZone && (
          <p>{hotspot.kind === "dungeon" ? "Donjon" : "Route"} — des Pokémon sauvages rôdent ici.</p>
        )}

        {error && <p className="error-text">{error}</p>}

        {isEncounterZone && (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => onEnterRoute(hotspot)}>
            {busy ? "..." : "Explorer"}
          </button>
        )}
        {hotspot.kind === "poi" && hotspot.action === "heal" && (
          <button type="button" className="btn-primary" disabled={busy} onClick={onHeal}>
            {busy ? "..." : "Soigner"}
          </button>
        )}
        {hotspot.kind === "poi" && hotspot.action === "shop" && (
          <button type="button" className="btn-primary" onClick={onOpenShop}>
            Ouvrir la boutique
          </button>
        )}

        <button type="button" className="btn-link" onClick={onClose} style={{ marginTop: 12 }}>
          Fermer
        </button>
      </div>
    </div>
  );
}
