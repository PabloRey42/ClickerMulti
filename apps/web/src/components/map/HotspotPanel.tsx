import type { CityMapHotspot, PoiAction } from "@farm-clicker/shared";

const POI_ACTION_LABEL: Record<PoiAction, string> = {
  heal: "Soigne tes créatures",
  shop: "Achète des objets",
  lab: "Parle au Professeur",
  quest: "Quêtes (bientôt disponibles)",
  info: "Point d'intérêt",
};

export function HotspotPanel({ hotspot, onClose }: { hotspot: CityMapHotspot; onClose: () => void }) {
  return (
    <div className="hotspot-panel-overlay" onClick={onClose}>
      <div className="hotspot-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="encounter-name">{hotspot.name}</h2>

        {hotspot.kind === "poi" && <p>{POI_ACTION_LABEL[hotspot.action]}</p>}

        {(hotspot.kind === "route" || hotspot.kind === "dungeon") && (
          <p>
            {hotspot.kind === "dungeon" ? "Donjon" : "Route"} — table de rencontres bientôt
            disponible.
          </p>
        )}

        <button type="button" className="btn-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
