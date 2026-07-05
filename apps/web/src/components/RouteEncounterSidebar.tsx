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
    <div className="dialog-box route-encounter-sidebar">
      <h2 className="title team-sidebar-title">Pokémon de la zone</h2>
      <ul className="route-encounter-list">
        {sorted.map((entry) => {
          const species = SPECIES_CATALOG[entry.speciesKey];
          return (
            <li key={entry.speciesKey} className="route-encounter-entry">
              <img
                src={`/sprites/${species.spriteFile}`}
                alt={species.name}
                className="route-encounter-sprite"
              />
              <div className="route-encounter-info">
                <span className="route-encounter-name">{species.name}</span>
                <span className="route-encounter-meta">
                  Nv. {entry.minLevel}-{entry.maxLevel}
                </span>
              </div>
              <span className="route-encounter-percent">{formatChance(entry.rarityWeight, total)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
