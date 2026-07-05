import { useEffect, useState } from "react";
import { attack, getBattleState } from "../api/battle";
import { ApiError } from "../api/client";
import { useAuthStore } from "../state/authStore";
import { useBattleStore } from "../state/battleStore";

function hpPercent(current: bigint, max: bigint): number {
  if (max <= 0n) return 0;
  const percent = Number((current * 100n) / max);
  return Math.max(0, Math.min(100, percent));
}

export function BattlePage({ onOpenCollection }: { onOpenCollection: () => void }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const { battleState, lastAttack, attackCount, setBattleState, applyAttack } = useBattleStore();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getBattleState(accessToken)
      .then(setBattleState)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout, setBattleState]);

  async function handleAttack() {
    if (!accessToken || !battleState) return;
    try {
      const result = await attack(accessToken);
      const newBalance = battleState.currencyBalance + result.goldEarned;
      applyAttack(result, newBalance);

      if (result.defeated) {
        const parts: string[] = [];
        if (result.captured) parts.push(`${result.encounter.speciesName} capturé(e) !`);
        for (const evo of result.evolutions) {
          parts.push(`${evo.fromSpeciesName} a évolué en ${evo.toSpeciesName} !`);
        }
        setMessage(parts.length > 0 ? parts.join(" ") : null);
        // Owned creatures may have changed (capture/level up), refresh the accurate auto-attack total.
        getBattleState(accessToken).then(setBattleState).catch(() => {});
      } else {
        setMessage(null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  const encounter = battleState?.encounter;

  return (
    <div className="screen">
      <div className="dialog-box battle-box">
        <div className="topbar">
          <span className="trainer-name">{user?.username}</span>
          <div>
            <button type="button" className="btn-link" onClick={onOpenCollection}>
              Collection
            </button>
            {" · "}
            <button type="button" className="btn-link" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat-pill">
            <span className="stat-label">Or</span>
            <span className="stat-value">{battleState ? battleState.currencyBalance.toString() : "..."}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Attaque auto</span>
            <span className="stat-value">{battleState ? battleState.totalAutoAttack.toString() : "..."}</span>
          </div>
        </div>

        {encounter && (
          <div className="encounter">
            <span className={`type-badge type-${encounter.type.toLowerCase()}`}>{encounter.type}</span>
            <h2 className="encounter-name">{encounter.speciesName}</h2>
            <div className="hp-bar">
              <div
                className="hp-bar-fill"
                style={{ width: `${hpPercent(encounter.currentHp, encounter.maxHp)}%` }}
              />
            </div>
            <span className="hp-text">
              {encounter.currentHp.toString()} / {encounter.maxHp.toString()} PV
            </span>
          </div>
        )}

        <button type="button" className="creature-btn" onClick={handleAttack} disabled={!battleState}>
          <span className="creature-emoji">⚔️</span>
          <span>Attaquer</span>
        </button>

        {lastAttack !== null && (
          <p className="gain-float" key={attackCount}>
            -{lastAttack.damageDealt.toString()} PV
          </p>
        )}

        {message && <p className="battle-message">{message}</p>}
      </div>
    </div>
  );
}
