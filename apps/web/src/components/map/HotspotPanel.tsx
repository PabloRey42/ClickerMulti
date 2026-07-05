import type { CityMapHotspot, PoiAction } from "@farm-clicker/shared";

const POI_ACTION_LABEL: Record<PoiAction, string> = {
  heal: "Soigne toute ton équipe",
  shop: "Achète des pokéballs",
  lab: "Parle au Professeur",
  quest: "Un habitant a peut-être une quête pour toi",
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
  onOpenMarket: () => void;
  onOpenQuest: () => void;
}

export function HotspotPanel({
  hotspot,
  busy,
  error,
  onClose,
  onEnterRoute,
  onHeal,
  onOpenShop,
  onOpenMarket,
  onOpenQuest,
}: HotspotPanelProps) {
  const isEncounterZone = hotspot.kind === "route" || hotspot.kind === "dungeon";

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-panel/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border-[3px] border-gold bg-panel p-5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-black tracking-wide text-gold-light">{hotspot.name}</h2>

        {hotspot.kind === "poi" && (
          <p className="mb-3 text-sm font-semibold text-panel-foreground/70">
            {POI_ACTION_LABEL[hotspot.action]}
          </p>
        )}
        {isEncounterZone && (
          <p className="mb-3 text-sm font-semibold text-panel-foreground/70">
            {hotspot.kind === "dungeon" ? "Donjon" : "Route"} — des Pokémon sauvages rôdent ici.
          </p>
        )}

        {error && <p className="mb-2 text-xs font-bold text-stat-hp">{error}</p>}

        <div className="flex flex-col gap-2">
          {isEncounterZone && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onEnterRoute(hotspot)}
              className="rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-4 py-2.5 text-sm font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
              {busy ? "..." : "Explorer"}
            </button>
          )}

          {hotspot.kind === "poi" && hotspot.action === "heal" && (
            <button
              type="button"
              disabled={busy}
              onClick={onHeal}
              className="rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-4 py-2.5 text-sm font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
              {busy ? "..." : "Soigner"}
            </button>
          )}

          {hotspot.kind === "poi" && hotspot.action === "shop" && (
            <>
              <button
                type="button"
                onClick={onOpenShop}
                className="rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-4 py-2.5 text-sm font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none"
              >
                Ouvrir la boutique
              </button>
              <button
                type="button"
                onClick={onOpenMarket}
                className="rounded-full border-2 border-gold-deep bg-panel-light px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-gold-light transition-all hover:bg-panel"
              >
                Ouvrir l'Hôtel des Ventes
              </button>
            </>
          )}

          {hotspot.kind === "poi" && hotspot.action === "quest" && (
            <button
              type="button"
              onClick={onOpenQuest}
              className="rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-4 py-2.5 text-sm font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none"
            >
              Parler
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs font-bold text-panel-foreground/60 underline-offset-2 hover:text-gold-light hover:underline"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
