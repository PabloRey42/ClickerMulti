import { useEffect, useState } from "react";
import { buyGenerator, clickFarm, getFarmState } from "../api/farm";
import { ApiError } from "../api/client";
import { useAuthStore } from "../state/authStore";
import { useFarmStore } from "../state/farmStore";

export function FarmPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const { farmState, lastGain, clickCount, setFarmState, applyClick } = useFarmStore();
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getFarmState(accessToken)
      .then(setFarmState)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout, setFarmState]);

  async function handleClick() {
    if (!accessToken) return;
    try {
      const result = await clickFarm(accessToken);
      applyClick(result.state, result.gain);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function handleBuy(key: string) {
    if (!accessToken) return;
    setBuying(key);
    try {
      const result = await buyGenerator(accessToken, key);
      setFarmState(result.state);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="dialog-box farm-box">
      <div className="topbar">
        <span className="trainer-name">{user?.username}</span>
        <button type="button" className="btn-link" onClick={logout}>
          Déconnexion
        </button>
      </div>

      <div className="stats">
        <div className="stat-pill">
          <span className="stat-label">Ressource</span>
          <span className="stat-value">{farmState ? farmState.resourceBalance.toString() : "..."}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-label">Affection</span>
          <span className="stat-value">{farmState ? farmState.affectionBalance.toString() : "..."}</span>
        </div>
      </div>
      <div className="stats">
        <div className="stat-pill">
          <span className="stat-label">Prod/sec</span>
          <span className="stat-value">{farmState ? farmState.productionPerSec.toString() : "..."}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-label">Combo</span>
          <span className="stat-value">x{farmState?.comboMultiplier ?? "1.00"}</span>
        </div>
      </div>

      {farmState && (
        <div className="combo-bar">
          <div
            className="combo-bar-fill"
            style={{ width: `${(farmState.comboStacks / 20) * 100}%` }}
          />
        </div>
      )}

      <button type="button" className="click-btn" onClick={handleClick} disabled={!farmState}>
        <span className="click-emoji">🐣</span>
        <span>Nourrir</span>
      </button>

      {lastGain !== null && (
        <p className="gain-float" key={clickCount}>
          +{lastGain.toString()}
        </p>
      )}

      <ul className="generator-list">
        {farmState?.generators.map((generator) => (
          <li key={generator.key} className="generator-row">
            <div className="generator-row-info">
              <span className="generator-row-name">{generator.name}</span>
              <span className="generator-row-meta">
                Possédé : {generator.owned} · +{generator.baseProduction.toString()}/s chacun
              </span>
            </div>
            <button
              type="button"
              className="buy-btn"
              disabled={
                buying === generator.key ||
                (farmState ? farmState.resourceBalance < generator.cost : true)
              }
              onClick={() => handleBuy(generator.key)}
            >
              Acheter
              <br />
              {generator.cost.toString()}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
