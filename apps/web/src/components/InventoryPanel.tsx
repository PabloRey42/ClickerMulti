import { useEffect, useState } from "react";
import type { PokeballCatalogEntry, PotionCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { getShopCatalog } from "../api/shop";
import { getExplorationState, setAutoHeal } from "../api/exploration";
import { ApiError } from "../api/client";

export function InventoryPanel({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [potions, setPotions] = useState<PotionCatalogEntry[]>([]);
  const [autoHeal, setAutoHealState] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getShopCatalog(accessToken)
      .then((catalog) => {
        setPokeballs(catalog.pokeballs);
        setPotions(catalog.potions);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
    getExplorationState(accessToken)
      .then((state) => setAutoHealState(state.autoHealEnabled))
      .catch(() => {});
  }, [accessToken, logout]);

  async function handleToggleAutoHeal() {
    if (!accessToken || busy) return;
    setBusy(true);
    try {
      const state = await setAutoHeal(accessToken, !autoHeal);
      setAutoHealState(state.autoHealEnabled);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBusy(false);
    }
  }

  const ownedPokeballs = pokeballs.filter((p) => p.owned > 0);
  const ownedPotions = potions.filter((p) => p.owned > 0);

  return (
    <div className="hotspot-panel-overlay" onClick={onClose}>
      <div className="hotspot-panel market-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="encounter-name">Inventaire</h2>

        <div className="inventory-auto-heal">
          <span>Soin auto en fin de combat (consomme des potions)</span>
          <button
            type="button"
            className={`toggle-switch ${autoHeal ? "toggle-switch-on" : ""}`}
            disabled={busy}
            onClick={handleToggleAutoHeal}
          >
            {autoHeal ? "Activé" : "Désactivé"}
          </button>
        </div>

        <h3 className="pokedex-name">Poké Balls</h3>
        {ownedPokeballs.length === 0 && <p className="team-empty">Aucune balle possédée.</p>}
        <ul className="generator-list">
          {ownedPokeballs.map((p) => (
            <li key={p.key} className="generator-row">
              <img src={`/items/${p.spriteFile}`} alt={p.name} className="shop-item-sprite" />
              <div className="generator-row-info">
                <span className="generator-row-name">{p.name}</span>
                <span className="generator-row-meta">×{p.owned}</span>
              </div>
            </li>
          ))}
        </ul>

        <h3 className="pokedex-name">Soins</h3>
        {ownedPotions.length === 0 && <p className="team-empty">Aucune potion possédée.</p>}
        <ul className="generator-list">
          {ownedPotions.map((p) => (
            <li key={p.key} className="generator-row">
              <img src={`/items/${p.spriteFile}`} alt={p.name} className="shop-item-sprite" />
              <div className="generator-row-info">
                <span className="generator-row-name">{p.name}</span>
                <span className="generator-row-meta">×{p.owned}</span>
              </div>
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
