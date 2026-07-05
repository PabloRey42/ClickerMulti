import { SPECIES_CATALOG, findEncounterHotspot } from "@farm-clicker/shared";
import { useBattleStore } from "../state/battleStore";

function formatChance(weight: number, total: number): string {
  const percent = (weight / total) * 100;
  if (percent < 0.01) return `${percent.toFixed(4)}%`;
  if (percent < 1) return `${percent.toFixed(2)}%`;
  return `${percent.toFixed(1)}%`;
}

export function RouteEncounterSidebar() {
  const encounter = useBattleStore((s) => s.state?.encounter ?? null);
  if (!encounter || encounter.isLeagueBattle) return null;

  const hotspot = findEncounterHotspot(encounter.routeKey);
  if (!hotspot) return null;

  const total = hotspot.encounterTable.reduce((sum, e) => sum + e.rarityWeight, 0);
  const sorted = [...hotspot.encounterTable].sort((a, b) => b.rarityWeight - a.rarityWeight);

  return (
    <aside className="w-full rounded-3xl border-[3px] border-gold bg-gold-deep/30 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h2 className="mb-3 text-center text-sm font-black uppercase tracking-widest text-gold-light">
        Pokémon de la zone
      </h2>
      <ul className="flex flex-col gap-2">
        {sorted.map((entry) => {
          const species = SPECIES_CATALOG[entry.speciesKey];
          return (
            <li
              key={entry.speciesKey}
              className="flex items-center gap-2 rounded-xl border-2 border-gold-deep bg-panel px-2 py-1.5"
            >
              <img
                src={`/sprites/${species.spriteFile}`}
                alt={species.name}
                className="h-9 w-9 shrink-0 [image-rendering:pixelated]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-gold-light">{species.name}</p>
                <p className="text-[10px] font-semibold text-panel-foreground/60">
                  Nv. {entry.minLevel}-{entry.maxLevel}
                </p>
              </div>
              <span className="shrink-0 text-xs font-black text-stat-hp">
                {formatChance(entry.rarityWeight, total)}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
