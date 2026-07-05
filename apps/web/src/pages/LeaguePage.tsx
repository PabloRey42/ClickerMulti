import { useEffect, useState } from "react";
import type { LeagueStateResponse, ElementalType } from "@farm-clicker/shared";
import { ELEMENTAL_TYPES } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useExplorationStore } from "../state/explorationStore";
import { useBattleStore } from "../state/battleStore";
import { getLeagueState, challengeLeague, investSpecializationPoint } from "../api/league";
import { ApiError } from "../api/client";

const TYPE_LABEL: Record<ElementalType, string> = {
  normal: "Normal",
  feu: "Feu",
  eau: "Eau",
  plante: "Plante",
  electrique: "Électrik",
};

export function LeaguePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const goToWorld = useExplorationStore((s) => s.goToWorld);
  const goToEncounter = useExplorationStore((s) => s.goToEncounter);
  const setBattleState = useBattleStore((s) => s.setState);
  const [league, setLeague] = useState<LeagueStateResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function refresh() {
    if (!accessToken) return;
    try {
      setLeague(await getLeagueState(accessToken));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function handleChallenge() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const state = await challengeLeague(accessToken);
      setBattleState(state);
      goToEncounter({ view: "league" });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        if (body?.error === "no_active_creature") setError("Tu n'as aucun Pokémon actif.");
        else if (body?.error === "active_creature_fainted") {
          setError("Ton Pokémon actif est K.O. — soigne-le d'abord.");
        } else setError("Impossible de défier la Ligue.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSpecialize(elementalType: ElementalType) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      setLeague(await investSpecializationPoint(accessToken, elementalType));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBusy(false);
    }
  }

  if (!league) {
    return (
      <div className="map-page">
        <h1 className="title">Ligue Pokémon</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="topbar">
        <h1 className="title" style={{ margin: 0 }}>
          Ligue Pokémon
        </h1>
        <button type="button" className="btn-link" onClick={goToWorld}>
          Retour à la carte du monde
        </button>
      </div>

      <div className="stats">
        <div className="stat-pill">
          <span className="stat-label">Rang</span>
          <span className="stat-value">{league.rank}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-label">Points de spécialisation</span>
          <span className="stat-value">{league.unspentPoints}</span>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <h2 className="title" style={{ fontSize: 18 }}>
        Prochains adversaires
      </h2>
      <ul className="generator-list">
        {league.opponentPreview.map((opponent, i) => (
          <li key={i} className="generator-row">
            <img
              src={`/sprites/${opponent.spriteFile}`}
              alt={opponent.name}
              style={{ width: 40, height: 40, imageRendering: "pixelated" }}
            />
            <div className="generator-row-info">
              <span className="generator-row-name">{opponent.name}</span>
              <span className="generator-row-meta">Nv. {opponent.level}</span>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" className="click-btn" onClick={handleChallenge} disabled={busy}>
        <span className="click-emoji">🏆</span>
        <span>{league.inProgress ? "Reprendre" : "Défier"}</span>
      </button>

      <h2 className="title" style={{ fontSize: 18, marginTop: 20 }}>
        Spécialisation
      </h2>
      <ul className="generator-list">
        {ELEMENTAL_TYPES.map((type) => (
          <li key={type} className="generator-row">
            <div className="generator-row-info">
              <span className="generator-row-name">{TYPE_LABEL[type]}</span>
              <span className="generator-row-meta">
                {league.specialization[type] ?? 0} point(s) investi(s)
              </span>
            </div>
            <button
              type="button"
              className="buy-btn"
              disabled={busy || league.unspentPoints < 1}
              onClick={() => handleSpecialize(type)}
            >
              Investir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
