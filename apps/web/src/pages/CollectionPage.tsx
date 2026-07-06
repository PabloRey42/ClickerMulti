import { useEffect, useState } from "react";
import { SPECIES_CATALOG, type PlayerCreatureView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useTeamStore } from "../state/teamStore";
import { listCreatures, activateCreature, setTeamMembership, clearTeam } from "../api/creatures";
import { ApiError } from "../api/client";
import { TYPE_LABEL, typeBadgeStyle, typeBadgeTextClassName } from "../theme/typeColors";

const DEX_ENTRIES = Object.values(SPECIES_CATALOG).sort((a, b) => a.dexNumber - b.dexNumber);

function pad(n: number) {
  return `#${n.toString().padStart(3, "0")}`;
}

export function CollectionPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const refreshTeamSidebar = useTeamStore((s) => s.refresh);
  const [creatures, setCreatures] = useState<PlayerCreatureView[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    refresh();
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

  async function handleActivate(creature: PlayerCreatureView) {
    if (!accessToken || busyId) return;
    setBusyId(creature.id);
    setError(null);
    try {
      await activateCreature(accessToken, creature.id);
      await refresh();
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
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

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mb-4 flex items-baseline justify-center gap-3">
        <h1 className="text-lg font-black tracking-wide text-gold-light sm:text-xl">Pokédex</h1>
        <span className="text-xs font-bold text-panel-foreground/60">
          {discoveredCount}/{DEX_ENTRIES.length} découverts
        </span>
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

      {compact ? (
        <ul className="flex flex-col gap-1.5">
          {DEX_ENTRIES.map((species) => {
            const owned = creatures.filter((c) => c.speciesKey === species.key);
            const isOwned = owned.length > 0;

            return (
              <li
                key={species.key}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${
                  isOwned ? "border-gold-deep bg-panel" : "border-panel-foreground/15 bg-panel/50"
                }`}
              >
                <span className="w-8 shrink-0 text-[10px] font-bold text-panel-foreground/50">{pad(species.dexNumber)}</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gold-deep/40 bg-panel-light">
                  {isOwned ? (
                    <img src={`/sprites/${species.spriteFile}`} alt={species.name} className="h-5 w-5 [image-rendering:pixelated]" />
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
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    {owned.map((c) => (
                      <div key={c.id} className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-panel-foreground/60">
                          Nv.{c.level}
                          {c.isActive ? "★" : ""}
                          {c.isOnTeam ? "" : " (hors équipe)"}
                        </span>
                        <select
                          value=""
                          disabled={busyId === c.id}
                          onChange={(e) => {
                            const action = e.target.value;
                            e.target.value = "";
                            if (action === "team") handleToggleTeam(c);
                            if (action === "activate") handleActivate(c);
                          }}
                          className="rounded border border-gold-deep/50 bg-panel-light px-1 py-0.5 text-[9px] font-bold text-gold-light outline-none disabled:opacity-50"
                        >
                          <option value="">⋮</option>
                          <option value="team">{c.isOnTeam ? "Retirer de l'équipe" : "Ajouter à l'équipe"}</option>
                          <option value="activate" disabled={!c.isOnTeam || c.currentHp <= 0 || c.isActive}>
                            Définir actif
                          </option>
                        </select>
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
        {DEX_ENTRIES.map((species) => {
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

          return (
            <li key={species.key} className="flex flex-col rounded-2xl border-2 border-gold-deep bg-panel p-3 text-center shadow-md">
              <span className="text-[11px] font-bold text-gold-light/70">{pad(species.dexNumber)}</span>

              <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-xl border border-gold-deep/40 bg-panel-light">
                <img
                  src={`/sprites/${species.spriteFile}`}
                  alt={species.name}
                  className="h-11 w-11 [image-rendering:pixelated]"
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
                    <button
                      type="button"
                      disabled={busyId === c.id || !c.isOnTeam || c.currentHp <= 0 || c.isActive}
                      onClick={() => handleActivate(c)}
                      className={[
                        "rounded-lg px-3 py-1.5 text-[11px] font-extrabold shadow transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100",
                        c.isActive
                          ? "cursor-default bg-stat-xp/40 text-panel-foreground/60"
                          : "bg-gold text-panel hover:bg-gold-light disabled:opacity-50",
                      ].join(" ")}
                    >
                      Actif
                    </button>
                  </div>
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
