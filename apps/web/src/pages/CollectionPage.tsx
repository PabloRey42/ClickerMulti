import { useEffect, useState } from "react";
import { SPECIES_CATALOG, type PlayerCreatureView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { listCreatures, activateCreature, setTeamMembership } from "../api/creatures";
import { ApiError } from "../api/client";
import { TYPE_ACCENT } from "../theme/typeColors";

const DEX_ENTRIES = Object.values(SPECIES_CATALOG).sort((a, b) => a.dexNumber - b.dexNumber);

export function CollectionPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [creatures, setCreatures] = useState<PlayerCreatureView[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="map-page">
      <h1 className="title">Pokédex</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="pokedex-grid">
        {DEX_ENTRIES.map((species) => {
          const owned = creatures.filter((c) => c.speciesKey === species.key);
          const isOwned = owned.length > 0;

          return (
            <div key={species.key} className={`pokedex-entry ${isOwned ? "" : "pokedex-entry-locked"}`}>
              <span className="pokedex-number">#{String(species.dexNumber).padStart(3, "0")}</span>
              <img
                src={`/sprites/${species.spriteFile}`}
                alt={isOwned ? species.name : "Créature non capturée"}
                className="pokedex-sprite"
              />
              <span className="pokedex-name">{isOwned ? species.name : "???"}</span>
              {isOwned && (
                <span
                  className="pokedex-type-badge"
                  style={{ background: TYPE_ACCENT[species.elementalType] }}
                >
                  {species.elementalType}
                </span>
              )}

              {owned.map((c) => (
                <div key={c.id} className="pokedex-instance">
                  <span className="pokedex-instance-name">
                    {c.nickname ?? c.name} {c.isActive ? "★" : ""}
                  </span>
                  <span className="pokedex-instance-meta">
                    Nv.{c.level} · {c.currentHp}/{c.maxHp} PV
                  </span>
                  <div className="pokedex-instance-actions">
                    <button
                      type="button"
                      className="buy-btn"
                      disabled={busyId === c.id}
                      onClick={() => handleToggleTeam(c)}
                    >
                      {c.isOnTeam ? "Retirer" : "Ajouter"}
                    </button>
                    <button
                      type="button"
                      className="buy-btn"
                      disabled={busyId === c.id || !c.isOnTeam || c.currentHp <= 0 || c.isActive}
                      onClick={() => handleActivate(c)}
                    >
                      Actif
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
