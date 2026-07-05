import { useEffect, useState } from "react";
import type { PlayerCreatureView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { listCreatures, activateCreature } from "../api/creatures";
import { ApiError } from "../api/client";

export function CollectionPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [creatures, setCreatures] = useState<PlayerCreatureView[]>([]);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listCreatures(accessToken)
      .then(setCreatures)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout]);

  async function handleActivate(id: string) {
    if (!accessToken) return;
    setActivating(id);
    try {
      await activateCreature(accessToken, id);
      const refreshed = await listCreatures(accessToken);
      setCreatures(refreshed);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActivating(null);
    }
  }

  return (
    <div className="map-page">
      <h1 className="title">Collection</h1>
      <ul className="generator-list">
        {creatures.map((c) => (
          <li key={c.id} className="generator-row">
            <div className="generator-row-info">
              <span className="generator-row-name">
                {c.nickname ?? c.name} {c.isActive ? "★" : ""}
              </span>
              <span className="generator-row-meta">
                Nv. {c.level} · {c.currentHp}/{c.maxHp} PV · {c.elementalType}
              </span>
            </div>
            <button
              type="button"
              className="buy-btn"
              disabled={c.isActive || c.currentHp <= 0 || activating === c.id}
              onClick={() => handleActivate(c.id)}
            >
              Activer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
