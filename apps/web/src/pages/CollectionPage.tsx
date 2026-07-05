import { useEffect, useState } from "react";
import type { CollectionResponse } from "@farm-clicker/shared";
import { getCollection } from "../api/collection";
import { ApiError } from "../api/client";
import { useAuthStore } from "../state/authStore";

function xpPercent(xp: bigint, xpToNextLevel: bigint): number {
  if (xpToNextLevel <= 0n) return 0;
  const percent = Number((xp * 100n) / xpToNextLevel);
  return Math.max(0, Math.min(100, percent));
}

export function CollectionPage({ onBack }: { onBack: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [creatures, setCreatures] = useState<CollectionResponse | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getCollection(accessToken)
      .then(setCreatures)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout]);

  return (
    <div className="screen">
      <div className="dialog-box">
        <div className="topbar">
          <h1 className="title" style={{ margin: 0, fontSize: 20 }}>
            Ma collection
          </h1>
          <button type="button" className="btn-link" onClick={onBack}>
            Retour
          </button>
        </div>

        {creatures !== null && creatures.length === 0 && (
          <p>Aucune créature capturée pour l'instant — pars au combat !</p>
        )}

        <ul className="creature-list">
          {creatures?.map((creature) => (
            <li key={creature.id} className="creature-row">
              <span className={`type-badge type-${creature.type.toLowerCase()}`}>{creature.type}</span>
              <div className="creature-row-info">
                <span className="creature-row-name">
                  {creature.speciesName} <span className="creature-row-level">Nv. {creature.level}</span>
                </span>
                <div className="hp-bar xp-bar">
                  <div
                    className="hp-bar-fill xp-bar-fill"
                    style={{ width: `${xpPercent(creature.xp, creature.xpToNextLevel)}%` }}
                  />
                </div>
                <span className="creature-row-attack">Attaque : {creature.attack.toString()}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
