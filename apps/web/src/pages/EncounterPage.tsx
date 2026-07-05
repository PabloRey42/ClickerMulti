import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { PlayerCreatureView, PokeballCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useBattleStore } from "../state/battleStore";
import { ApiError } from "../api/client";
import {
  getExplorationState,
  attackEncounter,
  captureEncounter,
  finishEncounter,
  fleeEncounter,
} from "../api/exploration";
import { listCreatures, activateCreature } from "../api/creatures";
import { getShopCatalog } from "../api/shop";
import { TYPE_ACCENT } from "../theme/typeColors";
import { useTeamStore } from "../state/teamStore";

export function EncounterPage({ onLeave }: { onLeave: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const { state, lastHit, hitCount, setState, applyAttack, clear } = useBattleStore();
  const refreshTeamSidebar = useTeamStore((s) => s.refresh);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [team, setTeam] = useState<PlayerCreatureView[]>([]);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [levelUpKey, setLevelUpKey] = useState(0);
  const [justLeveledUp, setJustLeveledUp] = useState(false);

  useEffect(() => {
    if (!accessToken || state) return;
    getExplorationState(accessToken)
      .then(setState)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, state, setState, logout]);

  useEffect(() => {
    if (!accessToken) return;
    getShopCatalog(accessToken)
      .then((catalog) => setPokeballs(catalog.pokeballs))
      .catch(() => {});
  }, [accessToken]);

  const awaitingSwitch = state !== null && state.encounter !== null && state.activeCreature === null;

  // Derived from state shape (not an ephemeral flag from the last attack) so this also
  // fires correctly when resuming an encounter left mid-switch on a fresh page load.
  useEffect(() => {
    if (!accessToken || !awaitingSwitch) return;
    listCreatures(accessToken)
      .then(setTeam)
      .catch(() => {});
  }, [accessToken, awaitingSwitch]);

  function triggerLevelUp(leveledUp: boolean) {
    setJustLeveledUp(leveledUp);
    if (leveledUp) setLevelUpKey((k) => k + 1);
  }

  async function handleAttack() {
    if (!accessToken || acting) return;
    setActing(true);
    setMessage(null);
    try {
      const result = await attackEncounter(accessToken);
      applyAttack(result.state, result.damageDealt, result.damageTaken);
      if (result.leagueCleared) {
        setMessage("🏆 Ligue remportée ! Rang supérieur débloqué, points de spécialisation gagnés.");
      } else if (result.fainted && !result.canSwitch) {
        setMessage("Ton équipe est K.O. ! Retourne te soigner.");
      }
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActing(false);
    }
  }

  async function handleSwitch(creatureId: string) {
    if (!accessToken || acting) return;
    setActing(true);
    try {
      await activateCreature(accessToken, creatureId);
      const refreshed = await getExplorationState(accessToken);
      setState(refreshed);
      setMessage(null);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActing(false);
    }
  }

  async function handleFinish() {
    if (!accessToken || acting) return;
    setActing(true);
    try {
      const result = await finishEncounter(accessToken);
      setState(result.state);
      setMessage(`+${result.goldGained.toString()} or, +${result.xpGained} XP`);
      triggerLevelUp(result.leveledUp);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActing(false);
    }
  }

  async function handleCapture(pokeballKey: string) {
    if (!accessToken || acting) return;
    setActing(true);
    try {
      const result = await captureEncounter(accessToken, pokeballKey);
      setState(result.state);
      setPokeballs((prev) =>
        prev.map((p) => (p.key === pokeballKey ? { ...p, owned: Math.max(0, p.owned - 1) } : p)),
      );
      setMessage(
        result.success ? `${result.creature?.name} capturé !` : "Le Pokémon s'est échappé de la balle...",
      );
      triggerLevelUp(result.leveledUp);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActing(false);
    }
  }

  async function handleFlee() {
    if (!accessToken) return;
    try {
      await fleeEncounter(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
    } finally {
      clear();
      onLeave();
    }
  }

  function handleLeave() {
    clear();
    onLeave();
  }

  const encounter = state?.encounter ?? null;
  const creature = state?.activeCreature ?? null;
  const accent = encounter ? TYPE_ACCENT[encounter.elementalType] : TYPE_ACCENT.normal;
  const themeStyle = { "--encounter-accent": accent } as CSSProperties;

  const defeated = encounter !== null && encounter.currentHp <= 0;
  const switchOptions = team.filter((c) => c.isOnTeam && c.currentHp > 0);

  return (
    <div className="dialog-box encounter-box" style={themeStyle}>
      <div className="topbar">
        <span className="trainer-name">
          Or : {state ? state.goldBalance.toString() : "..."}
          {encounter?.isLeagueBattle ? " · 🏆 Combat de Ligue" : ""}
        </span>
        <button type="button" className="btn-link" onClick={handleLeave}>
          Quitter
        </button>
      </div>

      <div className="battle-field">
        {encounter && (
          <div className="battle-slot battle-slot-enemy">
            <div className="battle-hp-card">
              <span className="battle-name">
                {encounter.name} Nv.{encounter.level}
              </span>
              <div className="hp-bar">
                <div
                  className="hp-bar-fill"
                  style={{ width: `${(encounter.currentHp / encounter.maxHp) * 100}%` }}
                />
              </div>
              <span className="hp-label">
                {encounter.currentHp} / {encounter.maxHp} PV
              </span>
            </div>
            <img
              src={`/sprites/${encounter.spriteFile}`}
              alt={encounter.name}
              className="battle-sprite"
            />
          </div>
        )}

        {creature && (
          <div className="battle-slot battle-slot-player">
            <img
              src={`/sprites/${creature.spriteFile}`}
              alt={creature.name}
              className="battle-sprite battle-sprite-player"
            />
            <div className="battle-hp-card">
              <span className="battle-name">
                {creature.nickname ?? creature.name} Nv.{creature.level}
              </span>
              <div className="hp-bar">
                <div
                  className="hp-bar-fill hp-bar-fill-player"
                  style={{ width: `${(creature.currentHp / creature.maxHp) * 100}%` }}
                />
              </div>
              <span className="hp-label">
                {creature.currentHp} / {creature.maxHp} PV
              </span>
              <div className="xp-bar">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${(creature.xp / creature.xpToNextLevel) * 100}%` }}
                />
              </div>
              <span className="hp-label">
                {creature.xp} / {creature.xpToNextLevel} XP
              </span>
            </div>
          </div>
        )}

        {!encounter && <p className="battle-empty">Aucun Pokémon sauvage ici pour l'instant.</p>}
      </div>

      {justLeveledUp && (
        <p className="level-up-flash" key={levelUpKey}>
          🌟 Niveau supérieur !
        </p>
      )}

      {message && (
        <p className="gain-float" key={`msg-${hitCount}`}>
          {message}
        </p>
      )}

      {lastHit && !message && (
        <p className="gain-float" key={`hit-${hitCount}`}>
          -{lastHit.damageDealt} / -{lastHit.damageTaken}
        </p>
      )}

      {encounter && !defeated && creature && (
        <button type="button" className="click-btn" onClick={handleAttack} disabled={acting}>
          <span className="click-emoji">⚔️</span>
          <span>Attaquer</span>
        </button>
      )}

      {encounter && defeated && (
        <div className="generator-list">
          <button type="button" className="btn-primary" disabled={acting} onClick={handleFinish}>
            Achever (or + XP)
          </button>
          {pokeballs.map((p) => (
            <button
              key={p.key}
              type="button"
              className="buy-btn"
              disabled={acting || p.owned < 1}
              onClick={() => handleCapture(p.key)}
            >
              {p.name} ({p.owned})
            </button>
          ))}
        </div>
      )}

      {awaitingSwitch && (
        <div className="generator-list">
          <p className="error-text">Ton Pokémon est K.O. ! Choisis un remplaçant :</p>
          {switchOptions.map((c) => (
            <button
              key={c.id}
              type="button"
              className="btn-primary"
              disabled={acting}
              onClick={() => handleSwitch(c.id)}
            >
              {c.nickname ?? c.name} (Nv.{c.level}, {c.currentHp}/{c.maxHp} PV)
            </button>
          ))}
        </div>
      )}

      {encounter && (
        <button type="button" className="btn-link" onClick={handleFlee} style={{ marginTop: 12 }}>
          Fuir
        </button>
      )}
    </div>
  );
}
