import { useEffect, useState } from "react";
import type { PokeballCatalogEntry, PotionCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../../state/authStore";
import { getShopCatalog, buyItem } from "../../api/shop";
import { ApiError } from "../../api/client";

export function ShopPanel({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [gold, setGold] = useState<bigint | null>(null);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [potions, setPotions] = useState<PotionCatalogEntry[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getShopCatalog(accessToken)
      .then((catalog) => {
        setGold(catalog.goldBalance);
        setPokeballs(catalog.pokeballs);
        setPotions(catalog.potions);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout]);

  async function handleBuy(key: string) {
    if (!accessToken) return;
    setBuying(key);
    try {
      const result = await buyItem(accessToken, key);
      setGold(result.goldBalance);
      setPokeballs((prev) => prev.map((p) => (p.key === key ? { ...p, owned: result.owned } : p)));
      setPotions((prev) => prev.map((p) => (p.key === key ? { ...p, owned: result.owned } : p)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBuying(null);
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
        <h2 className="mb-1 text-center text-lg font-black tracking-wide text-gold-light">Marché Artisanal</h2>
        <p className="mb-3 text-center text-sm font-extrabold text-gold-light">
          Or : {gold !== null ? gold.toString() : "..."}
        </p>

        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">Poké Balls</h3>
        <ul className="mb-4 flex flex-col gap-2">
          {pokeballs.map((p) => (
            <li key={p.key} className="flex items-center gap-3 rounded-xl border-2 border-gold-deep bg-panel-light px-3 py-2">
              <img src={`/items/${p.spriteFile}`} alt={p.name} className="h-9 w-9 shrink-0 [image-rendering:pixelated]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-gold-light">{p.name}</p>
                <p className="text-xs font-semibold text-panel-foreground/60">
                  Possédé : {p.owned} · ×{p.catchMultiplier} capture
                </p>
              </div>
              <button
                type="button"
                disabled={buying === p.key || (gold !== null && gold < p.goldCost)}
                onClick={() => handleBuy(p.key)}
                className="shrink-0 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-center text-[10px] font-black uppercase leading-tight text-panel disabled:opacity-50"
              >
                Acheter
                <br />
                {p.goldCost.toString()}
              </button>
            </li>
          ))}
        </ul>

        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">Soins</h3>
        <ul className="flex flex-col gap-2">
          {potions.map((p) => (
            <li key={p.key} className="flex items-center gap-3 rounded-xl border-2 border-gold-deep bg-panel-light px-3 py-2">
              <img src={`/items/${p.spriteFile}`} alt={p.name} className="h-9 w-9 shrink-0 [image-rendering:pixelated]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-gold-light">{p.name}</p>
                <p className="text-xs font-semibold text-panel-foreground/60">
                  Possédé : {p.owned} · soigne {p.healAmount >= 9999 ? "tout" : `${p.healAmount} PV`}
                </p>
              </div>
              <button
                type="button"
                disabled={buying === p.key || (gold !== null && gold < p.goldCost)}
                onClick={() => handleBuy(p.key)}
                className="shrink-0 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-center text-[10px] font-black uppercase leading-tight text-panel disabled:opacity-50"
              >
                Acheter
                <br />
                {p.goldCost.toString()}
              </button>
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
