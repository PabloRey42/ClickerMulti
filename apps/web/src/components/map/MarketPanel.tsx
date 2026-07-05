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

const inputClass =
  "rounded-lg border-2 border-gold-deep bg-panel px-2 py-1.5 text-xs text-gold-light outline-none focus:border-gold";

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
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-panel/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border-[3px] border-gold bg-panel p-5 shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-center text-lg font-black tracking-wide text-gold-light">Hôtel des Ventes</h2>
        <p className="mb-2 text-center text-sm font-extrabold text-gold-light">
          Or : {gold !== null ? gold.toString() : "..."}
        </p>
        {error && <p className="mb-2 text-center text-xs font-bold text-stat-hp">{error}</p>}

        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">
          Vendre un objet
        </h3>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select value={sellItemKey} onChange={(e) => setSellItemKey(e.target.value)} className={inputClass}>
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
            className={`${inputClass} w-16`}
          />
          <input
            type="number"
            min="1"
            value={sellItemPrice}
            onChange={(e) => setSellItemPrice(e.target.value)}
            placeholder="Prix (or)"
            className={`${inputClass} w-24`}
          />
          <button
            type="button"
            disabled={busy}
            onClick={handleSellItem}
            className="rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase text-panel disabled:opacity-50"
          >
            Vendre
          </button>
        </div>

        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">
          Vendre un Pokémon
        </h3>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select value={sellCreatureId} onChange={(e) => setSellCreatureId(e.target.value)} className={inputClass}>
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
            className={`${inputClass} w-24`}
          />
          <button
            type="button"
            disabled={busy}
            onClick={handleSellCreature}
            className="rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase text-panel disabled:opacity-50"
          >
            Vendre
          </button>
        </div>

        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">
          Annonces actives
        </h3>
        <ul className="flex flex-col gap-2">
          {listings.map((l) => (
            <li key={l.id} className="flex items-center gap-3 rounded-xl border-2 border-gold-deep bg-panel-light px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-gold-light">
                  {l.assetType === "CREATURE" ? l.creatureName : `${l.itemName} x${l.quantity}`}
                </p>
                <p className="text-xs font-semibold text-panel-foreground/60">
                  {l.askGoldPrice.toString()} or · vendu par {l.isMine ? "toi" : l.sellerUsername}
                </p>
              </div>
              {l.isMine ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleCancel(l.id)}
                  className="shrink-0 rounded-full border-2 border-gold-deep bg-panel px-3 py-1.5 text-xs font-extrabold text-gold-light transition-colors hover:bg-panel-light disabled:opacity-50"
                >
                  Annuler
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || gold === null || gold < l.askGoldPrice}
                  onClick={() => handleBuy(l.id)}
                  className="shrink-0 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase text-panel disabled:opacity-50"
                >
                  Acheter
                </button>
              )}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-xs font-bold text-panel-foreground/60 underline-offset-2 hover:text-gold-light hover:underline"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
