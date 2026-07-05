import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { ElementalType, PokeballCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useBattleStore } from "../state/battleStore";
import { useExplorationStore } from "../state/explorationStore";
import { ApiError } from "../api/client";
import {
  getExplorationState,
  attackEncounter,
  captureEncounter,
  finishEncounter,
  fleeEncounter,
} from "../api/exploration";
import { getShopCatalog } from "../api/shop";

const TYPE_ACCENT: Record<ElementalType, string> = {
  normal: "#a5a5a5",
  feu: "#e0663c",
  eau: "#4c9fe0",
  plante: "#5fb85f",
  electrique: "#f0c419",
};

export function EncounterPage({ cityId }: { cityId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const goToCity = useExplorationStore((s) => s.goToCity);
  const { state, lastHit, hitCount, setState, applyAttack, clear } = useBattleStore();
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  async function handleAttack() {
    if (!accessToken || acting) return;
    setActing(true);
    setMessage(null);
    try {
      const result = await attackEncounter(accessToken);
      applyAttack(result.state, result.damageDealt, result.damageTaken);
      if (result.fainted) setMessage("Ta créature est K.O. ! Retourne te soigner.");
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
        result.success ? `${result.creature?.name} capturé !` : "La créature s'est échappée de la balle...",
      );
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
      goToCity(cityId);
    }
  }

  function handleLeave() {
    clear();
    goToCity(cityId);
  }

  const encounter = state?.encounter ?? null;
  const creature = state?.activeCreature ?? null;
  const accent = encounter ? TYPE_ACCENT[encounter.elementalType] : TYPE_ACCENT.normal;
  const themeStyle = { "--encounter-accent": accent } as CSSProperties;

  const defeated = encounter !== null && encounter.currentHp <= 0;
  const creatureFainted = creature !== null && creature.currentHp <= 0;

  return (
    <div className="dialog-box encounter-box" style={themeStyle}>
      <div className="topbar">
        <span className="trainer-name">Or : {state ? state.goldBalance.toString() : "..."}</span>
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
            </div>
          </div>
        )}

        {!encounter && <p className="battle-empty">Aucune créature sauvage ici pour l'instant.</p>}
      </div>

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

      {encounter && !defeated && !creatureFainted && (
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

      {creatureFainted && (
        <p className="error-text">Ta créature est K.O. Retourne te soigner au Centre Pokémon.</p>
      )}

      {encounter && (
        <button type="button" className="btn-link" onClick={handleFlee} style={{ marginTop: 12 }}>
          Fuir
        </button>
      )}
    </div>
  );
}
