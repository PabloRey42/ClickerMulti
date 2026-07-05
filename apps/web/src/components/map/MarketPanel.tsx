import { useEffect, useState } from "react";
import type { PlayerCreatureView, PokeballCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../../state/authStore";
import { useTeamStore } from "../../state/teamStore";
import {
  getListings,
  createItemListing,
  createCreatureListing,
  buyListing,
  cancelListing,
} from "../../api/market";
import { listCreatures } from "../../api/creatures";
import { getShopCatalog } from "../../api/shop";
import { ApiError } from "../../api/client";
import type { MarketListingView } from "@farm-clicker/shared";

const ERROR_MESSAGES: Record<string, string> = {
  already_listed: "Ce Pokémon est déjà en vente.",
  insufficient_items: "Tu n'as pas assez de cet objet.",
  invalid_item: "Objet invalide.",
  invalid_listing: "Annonce invalide.",
  creature_not_found: "Pokémon introuvable.",
  listing_not_found: "Cette annonce n'existe plus.",
  cannot_buy_own_listing: "Tu ne peux pas acheter ta propre annonce.",
  insufficient_gold: "Tu n'as pas assez d'or.",
};

export function MarketPanel({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const refreshTeamSidebar = useTeamStore((s) => s.refresh);
  const [gold, setGold] = useState<bigint | null>(null);
  const [listings, setListings] = useState<MarketListingView[]>([]);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [creatures, setCreatures] = useState<PlayerCreatureView[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sellItemKey, setSellItemKey] = useState("");
  const [sellItemQty, setSellItemQty] = useState("1");
  const [sellItemPrice, setSellItemPrice] = useState("");
  const [sellCreatureId, setSellCreatureId] = useState("");
  const [sellCreaturePrice, setSellCreaturePrice] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    refresh();
    getShopCatalog(accessToken)
      .then((c) => setPokeballs(c.pokeballs))
      .catch(() => {});
    listCreatures(accessToken)
      .then(setCreatures)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function refresh() {
    if (!accessToken) return;
    try {
      const res = await getListings(accessToken);
      setGold(res.goldBalance);
      setListings(res.listings);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  function handleError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) return logout();
      const body = err.body as { error?: string } | undefined;
      setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Action impossible.");
    }
  }

  async function handleSellItem() {
    if (!accessToken || busy || !sellItemKey || !sellItemPrice) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createItemListing(accessToken, sellItemKey, Number(sellItemQty) || 1, sellItemPrice);
      setGold(res.goldBalance);
      setListings(res.listings);
      setSellItemPrice("");
      setSellItemQty("1");
      const catalog = await getShopCatalog(accessToken);
      setPokeballs(catalog.pokeballs);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSellCreature() {
    if (!accessToken || busy || !sellCreatureId || !sellCreaturePrice) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createCreatureListing(accessToken, sellCreatureId, sellCreaturePrice);
      setGold(res.goldBalance);
      setListings(res.listings);
      setSellCreaturePrice("");
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleBuy(listingId: string) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await buyListing(accessToken, listingId);
      setGold(res.goldBalance);
      setListings(res.listings);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(listingId: string) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await cancelListing(accessToken, listingId);
      setGold(res.goldBalance);
      setListings(res.listings);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hotspot-panel-overlay" onClick={onClose}>
      <div className="hotspot-panel market-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="encounter-name">Hôtel des Ventes</h2>
        <p>Or : {gold !== null ? gold.toString() : "..."}</p>
        {error && <p className="error-text">{error}</p>}

        <h3 className="pokedex-name">Vendre un objet</h3>
        <div className="market-sell-form">
          <select value={sellItemKey} onChange={(e) => setSellItemKey(e.target.value)}>
            <option value="">Choisir...</option>
            {pokeballs
              .filter((p) => p.owned > 0)
              .map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name} ({p.owned})
                </option>
              ))}
          </select>
          <input
            type="number"
            min="1"
            value={sellItemQty}
            onChange={(e) => setSellItemQty(e.target.value)}
            placeholder="Qté"
          />
          <input
            type="number"
            min="1"
            value={sellItemPrice}
            onChange={(e) => setSellItemPrice(e.target.value)}
            placeholder="Prix (or)"
          />
          <button type="button" className="btn-primary" disabled={busy} onClick={handleSellItem}>
            Vendre
          </button>
        </div>

        <h3 className="pokedex-name">Vendre un Pokémon</h3>
        <div className="market-sell-form">
          <select value={sellCreatureId} onChange={(e) => setSellCreatureId(e.target.value)}>
            <option value="">Choisir...</option>
            {creatures.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname ?? c.name} (Nv.{c.level})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={sellCreaturePrice}
            onChange={(e) => setSellCreaturePrice(e.target.value)}
            placeholder="Prix (or)"
          />
          <button type="button" className="btn-primary" disabled={busy} onClick={handleSellCreature}>
            Vendre
          </button>
        </div>

        <h3 className="pokedex-name">Annonces actives</h3>
        <ul className="generator-list market-listing-list">
          {listings.map((l) => (
            <li key={l.id} className="generator-row">
              <div className="generator-row-info">
                <span className="generator-row-name">
                  {l.assetType === "CREATURE" ? l.creatureName : `${l.itemName} x${l.quantity}`}
                </span>
                <span className="generator-row-meta">
                  {l.askGoldPrice.toString()} or · vendu par {l.isMine ? "toi" : l.sellerUsername}
                </span>
              </div>
              {l.isMine ? (
                <button type="button" className="buy-btn" disabled={busy} onClick={() => handleCancel(l.id)}>
                  Annuler
                </button>
              ) : (
                <button
                  type="button"
                  className="buy-btn"
                  disabled={busy || gold === null || gold < l.askGoldPrice}
                  onClick={() => handleBuy(l.id)}
                >
                  Acheter
                </button>
              )}
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
