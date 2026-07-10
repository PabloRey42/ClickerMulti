import { useEffect, useState } from "react";
import { SPECIES_CATALOG, STONE_CATALOG, type PlayerCreatureView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useTeamStore } from "../state/teamStore";
import { useEvolutionStore } from "../state/evolutionStore";
import { listCreatures, setTeamMembership, clearTeam, useEvolutionStone } from "../api/creatures";
import { getShopCatalog } from "../api/shop";
import { ApiError } from "../api/client";
import {
  TYPE_LABEL,
  typeBadgeStyle,
  typeBadgeTextClassName,
  creatureSpriteSrc,
  creatureSpriteTransform,
} from "../theme/typeColors";

const DEX_ENTRIES = Object.values(SPECIES_CATALOG).sort((a, b) => a.dexNumber - b.dexNumber);

function pad(n: number) {
  return `#${n.toString().padStart(3, "0")}`;
}

/** One button per stone option a creature's species has (Eevee has 4) — only rendered when
 * the species actually has stoneEvolutions (see species.ts's doc comment: the stone/
 * friendship/trade evolutions the pure level-based system deliberately can't reach). */
function StoneEvolutionButtons({
  creature,
  stoneCounts,
  busy,
  onUse,
}: {
  creature: PlayerCreatureView;
  stoneCounts: Record<string, number>;
  busy: boolean;
  onUse: (stoneKey: string) => void;
}) {
  const options = SPECIES_CATALOG[creature.speciesKey]?.stoneEvolutions;
  if (!options || options.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
      {options.map((opt) => {
        const stone = STONE_CATALOG[opt.stoneKey];
        const owned = stoneCounts[opt.stoneKey] ?? 0;
        return (
          <button
            key={opt.stoneKey}
            type="button"
            disabled={busy || owned < 1}
            onClick={() => onUse(opt.stoneKey)}
            title={owned < 1 ? `Tu n'as pas de ${stone.name}` : `Utiliser une ${stone.name}`}
            className="flex items-center gap-1 rounded-lg border border-gold-deep/60 bg-panel px-2 py-1 text-[10px] font-extrabold text-gold-light shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            <img src={`/items/${stone.spriteFile}`} alt={stone.name} className="h-4 w-4 [image-rendering:pixelated]" />
            {stone.name} ({owned})
          </button>
        );
      })}
    </div>
  );
}

export function CollectionPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const refreshTeamSidebar = useTeamStore((s) => s.refresh);
  const enqueueEvolutions = useEvolutionStore((s) => s.enqueue);
  const [creatures, setCreatures] = useState<PlayerCreatureView[]>([]);
  const [stoneCounts, setStoneCounts] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const [expandedSpecies, setExpandedSpecies] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    refresh();
    refreshStoneCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function refresh() {
    if (!accessToken) return;
    try {
      setCreatures(await listCreatures(accessToken));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function refreshStoneCounts() {
    if (!accessToken) return;
    try {
      const catalog = await getShopCatalog(accessToken);
      setStoneCounts(Object.fromEntries(catalog.stones.map((s) => [s.key, s.owned])));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function handleUseStone(creature: PlayerCreatureView, stoneKey: string) {
    if (!accessToken || busyId) return;
    setBusyId(creature.id);
    setError(null);
    try {
      const result = await useEvolutionStone(accessToken, creature.id, stoneKey);
      setCreatures((prev) => prev.map((c) => (c.id === creature.id ? result.creature : c)));
      enqueueEvolutions(result.evolution.map((step) => ({ step, isShiny: creature.isShiny })));
      await refreshStoneCounts();
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as { error?: string } | undefined;
        setError(
          body?.error === "insufficient_stones"
            ? "Tu n'as plus cette pierre."
            : body?.error === "duplicate_species_limit"
              ? "Tu as déjà atteint la limite pour ce Pokémon (2 classiques + 1 shiny)."
              : "Ce Pokémon ne peut pas évoluer avec cette pierre.",
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleTeam(creature: PlayerCreatureView) {
    if (!accessToken || busyId) return;
    setBusyId(creature.id);
    setError(null);
    try {
      setCreatures(await setTeamMembership(accessToken, creature.id, !creature.isOnTeam));
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      if (err instanceof ApiError && err.status === 409) setError("Ton équipe est déjà complète (6 max).");
    } finally {
      setBusyId(null);
    }
  }

  async function handleClearTeam() {
    if (!accessToken || busyId) return;
    setBusyId("__clear-team__");
    setError(null);
    try {
      setCreatures(await clearTeam(accessToken));
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBusyId(null);
    }
  }

  const discoveredCount = DEX_ENTRIES.filter((species) =>
    creatures.some((c) => c.speciesKey === species.key),
  ).length;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredEntries = !normalizedSearch
    ? DEX_ENTRIES
    : normalizedSearch === "shiny"
      ? DEX_ENTRIES.filter((species) => creatures.some((c) => c.speciesKey === species.key && c.isShiny))
      : DEX_ENTRIES.filter(
          (species) =>
            species.name.toLowerCase().includes(normalizedSearch) ||
            species.dexNumber.toString().includes(normalizedSearch),
        );

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mb-4 flex items-baseline justify-center gap-3">
        <h1 className="text-lg font-black tracking-wide text-gold-light sm:text-xl">Pokédex</h1>
        <span className="text-xs font-bold text-panel-foreground/60">
          {discoveredCount}/{DEX_ENTRIES.length} découverts
        </span>
      </div>

      <div className="mx-auto mb-4 w-full max-w-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un Pokémon... (ou « shiny »)"
          className="w-full rounded-full border-2 border-gold-deep bg-panel px-4 py-2 text-xs font-semibold text-panel-foreground placeholder:text-panel-foreground/40 outline-none focus:border-gold"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setCompact((v) => !v)}
          className="rounded-full border-2 border-gold-deep bg-panel px-3 py-1.5 text-[11px] font-extrabold text-gold-light transition-colors hover:bg-panel-light"
        >
          {compact ? "Vue détaillée" : "Vue compacte"}
        </button>
        <button
          type="button"
          disabled={busyId === "__clear-team__"}
          onClick={handleClearTeam}
          className="rounded-full border-2 border-gold-deep bg-panel px-3 py-1.5 text-[11px] font-extrabold text-gold-light transition-colors hover:bg-panel-light disabled:opacity-50"
        >
          Tout retirer de l'équipe
        </button>
      </div>

      {error && <p className="mb-3 text-center text-xs font-bold text-stat-hp">{error}</p>}

      {filteredEntries.length === 0 && (
        <p className="mb-3 text-center text-xs font-bold text-panel-foreground/50">Aucun Pokémon trouvé.</p>
      )}

      {compact ? (
        <ul className="flex flex-col gap-1.5">
          {filteredEntries.map((species) => {
            const owned = creatures.filter((c) => c.speciesKey === species.key);
            const isOwned = owned.length > 0;
            const isExpanded = isOwned && expandedSpecies === species.key;
            const anyShiny = owned.some((c) => c.isShiny);

            return (
              <li
                key={species.key}
                className={`rounded-lg border ${isOwned ? "border-gold-deep bg-panel" : "border-panel-foreground/15 bg-panel/50"}`}
              >
                <button
                  type="button"
                  disabled={!isOwned}
                  onClick={() => setExpandedSpecies((prev) => (prev === species.key ? null : species.key))}
                  className="flex w-full items-center gap-2 px-2 py-1 text-left disabled:cursor-default"
                >
                  <span className="w-8 shrink-0 text-[10px] font-bold text-panel-foreground/50">{pad(species.dexNumber)}</span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gold-deep/40 bg-panel-light">
                    {isOwned ? (
                      <img
                        src={creatureSpriteSrc(species.spriteFile, anyShiny)}
                        alt={species.name}
                        style={{ transform: creatureSpriteTransform(species.spriteFile) }}
                        className={`h-7 w-7 object-contain [image-rendering:pixelated] ${anyShiny ? "shiny-sprite" : ""}`}
                      />
                    ) : (
                      <span className="h-4 w-4 rounded-full bg-panel-foreground/20" />
                    )}
                  </div>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-extrabold ${isOwned ? "text-gold-light" : "text-panel-foreground/40"}`}
                  >
                    {isOwned ? species.name : "???"}
                  </span>
                  {isOwned && (
                    <>
                      <span className="shrink-0 truncate text-[10px] font-bold text-panel-foreground/60">
                        {owned.map((c) => `${c.isShiny ? "✨" : ""}Nv.${c.level}${c.isActive ? "★" : ""}`).join(" · ")}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-gold-light/70">{isExpanded ? "▾" : "▸"}</span>
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-1.5 border-t border-gold-deep/30 px-2 py-2">
                    {owned.map((c) => (
                      <div key={c.id} className="rounded-lg bg-panel-light px-2 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-[11px] font-bold text-panel-foreground/80">
                            {c.isShiny ? "✨ " : ""}
                            {c.nickname ?? c.name} {c.isActive ? "★" : ""} · Nv. {c.level} · {c.currentHp}/{c.maxHp} PV
                          </p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busyId === c.id}
                              onClick={() => handleToggleTeam(c)}
                              className="rounded-lg bg-stat-xp px-2 py-1 text-[10px] font-extrabold text-panel-foreground shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                              {c.isOnTeam ? "Retirer" : "Ajouter"}
                            </button>
                          </div>
                        </div>
                        <StoneEvolutionButtons
                          creature={c}
                          stoneCounts={stoneCounts}
                          busy={busyId === c.id}
                          onUse={(stoneKey) => handleUseStone(c, stoneKey)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filteredEntries.map((species) => {
          const owned = creatures.filter((c) => c.speciesKey === species.key);
          const isOwned = owned.length > 0;

          if (!isOwned) {
            return (
              <li
                key={species.key}
                className="flex flex-col items-center rounded-2xl border-2 border-panel-foreground/15 bg-panel/50 p-3 text-center"
              >
                <span className="text-[11px] font-bold text-panel-foreground/40">{pad(species.dexNumber)}</span>
                <div className="my-4 flex h-16 w-16 items-center justify-center">
                  <span className="h-10 w-10 rounded-full bg-panel-foreground/20" />
                </div>
                <span className="text-sm font-black tracking-widest text-panel-foreground/40">???</span>
              </li>
            );
          }

          const anyShiny = owned.some((c) => c.isShiny);

          return (
            <li key={species.key} className="flex flex-col rounded-2xl border-2 border-gold-deep bg-panel p-3 text-center shadow-md">
              <span className="text-[11px] font-bold text-gold-light/70">{pad(species.dexNumber)}</span>

              <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-xl border border-gold-deep/40 bg-panel-light">
                <img
                  src={creatureSpriteSrc(species.spriteFile, anyShiny)}
                  alt={species.name}
                  style={{ transform: creatureSpriteTransform(species.spriteFile) }}
                  className={`h-16 w-16 object-contain [image-rendering:pixelated] ${anyShiny ? "shiny-sprite" : ""}`}
                />
              </div>

              <p className="text-sm font-extrabold text-gold-light">{species.name}</p>

              <div className="mx-auto mt-1 flex flex-wrap justify-center gap-1">
                {species.types.map((type) => (
                  <span
                    key={type}
                    style={typeBadgeStyle(type)}
                    className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${typeBadgeTextClassName(type)}`}
                  >
                    {TYPE_LABEL[type]}
                  </span>
                ))}
              </div>

              <div className="my-2 border-t border-dashed border-panel-foreground/20" />

              {owned.map((c) => (
                <div key={c.id} className="mt-2 flex flex-col gap-1 border-t border-panel-foreground/10 pt-2 first:mt-0 first:border-0 first:pt-0">
                  <p className="text-[11px] font-bold text-panel-foreground/80">
                    {c.isShiny ? "✨ " : ""}
                    {c.nickname ?? c.name} {c.isActive ? "★" : ""} · Nv. {c.level} · {c.currentHp}/{c.maxHp} PV
                  </p>
                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-bar-track">
                      <div
                        className="h-full rounded-full bg-stat-hp transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, (c.currentHp / c.maxHp) * 100))}%` }}
                      />
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bar-track">
                      <div
                        className="h-full rounded-full bg-stat-xp transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, (c.xp / c.xpToNextLevel) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-panel-foreground/60">
                    {c.xp}/{c.xpToNextLevel} XP
                  </p>

                  <div className="mt-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => handleToggleTeam(c)}
                      className="rounded-lg bg-stat-xp px-3 py-1.5 text-[11px] font-extrabold text-panel-foreground shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {c.isOnTeam ? "Retirer" : "Ajouter"}
                    </button>
                  </div>
                  <StoneEvolutionButtons
                    creature={c}
                    stoneCounts={stoneCounts}
                    busy={busyId === c.id}
                    onUse={(stoneKey) => handleUseStone(c, stoneKey)}
                  />
                </div>
              ))}
            </li>
          );
        })}
      </ul>
      )}
    </section>
  );
}
