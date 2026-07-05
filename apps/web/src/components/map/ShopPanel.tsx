import { useEffect, useState } from "react";
import type { PokeballCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../../state/authStore";
import { getShopCatalog, buyPokeball } from "../../api/shop";
import { ApiError } from "../../api/client";

export function ShopPanel({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [gold, setGold] = useState<bigint | null>(null);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getShopCatalog(accessToken)
      .then((catalog) => {
        setGold(catalog.goldBalance);
        setPokeballs(catalog.pokeballs);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout]);

  async function handleBuy(key: string) {
    if (!accessToken) return;
    setBuying(key);
    try {
      const result = await buyPokeball(accessToken, key);
      setGold(result.goldBalance);
      setPokeballs((prev) => prev.map((p) => (p.key === key ? { ...p, owned: result.owned } : p)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="hotspot-panel-overlay" onClick={onClose}>
      <div className="hotspot-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="encounter-name">Marché Artisanal</h2>
        <p>Or : {gold !== null ? gold.toString() : "..."}</p>

        <ul className="generator-list">
          {pokeballs.map((p) => (
            <li key={p.key} className="generator-row">
              <div className="generator-row-info">
                <span className="generator-row-name">{p.name}</span>
                <span className="generator-row-meta">
                  Possédé : {p.owned} · ×{p.catchMultiplier} capture
                </span>
              </div>
              <button
                type="button"
                className="buy-btn"
                disabled={buying === p.key || (gold !== null && gold < p.goldCost)}
                onClick={() => handleBuy(p.key)}
              >
                Acheter
                <br />
                {p.goldCost.toString()}
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="btn-link" onClick={onClose} style={{ marginTop: 12 }}>
          Fermer
        </button>
      </div>
    </div>
  );
}
