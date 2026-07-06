import { useEffect, useState } from "react";
import type { PokeballCatalogEntry, PotionCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../../state/authStore";
import { getShopCatalog, buyItem } from "../../api/shop";
import { ApiError } from "../../api/client";

function QuantityStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="h-6 w-6 rounded-full border border-gold-deep text-xs font-black text-gold-light disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={99}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="h-6 w-10 rounded-lg border border-gold-deep bg-panel px-1 text-center text-xs font-bold text-gold-light outline-none"
      />
      <button
        type="button"
        disabled={value >= 99}
        onClick={() => onChange(value + 1)}
        className="h-6 w-6 rounded-full border border-gold-deep text-xs font-black text-gold-light disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

export function ShopPanel({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [gold, setGold] = useState<bigint | null>(null);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [potions, setPotions] = useState<PotionCatalogEntry[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function quantityFor(key: string) {
    return quantities[key] ?? 1;
  }

  function setQuantityFor(key: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [key]: Math.min(99, Math.max(1, quantity)) }));
  }

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
      const result = await buyItem(accessToken, key, quantityFor(key));
      setGold(result.goldBalance);
      setPokeballs((prev) => prev.map((p) => (p.key === key ? { ...p, owned: result.owned } : p)));
      setPotions((prev) => prev.map((p) => (p.key === key ? { ...p, owned: result.owned } : p)));
      setQuantityFor(key, 1);
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
              <QuantityStepper value={quantityFor(p.key)} onChange={(v) => setQuantityFor(p.key, v)} />
              <button
                type="button"
                disabled={buying === p.key || (gold !== null && gold < p.goldCost * BigInt(quantityFor(p.key)))}
                onClick={() => handleBuy(p.key)}
                className="shrink-0 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-center text-[10px] font-black uppercase leading-tight text-panel disabled:opacity-50"
              >
                Acheter
                <br />
                {(p.goldCost * BigInt(quantityFor(p.key))).toString()}
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
              <QuantityStepper value={quantityFor(p.key)} onChange={(v) => setQuantityFor(p.key, v)} />
              <button
                type="button"
                disabled={buying === p.key || (gold !== null && gold < p.goldCost * BigInt(quantityFor(p.key)))}
                onClick={() => handleBuy(p.key)}
                className="shrink-0 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-center text-[10px] font-black uppercase leading-tight text-panel disabled:opacity-50"
              >
                Acheter
                <br />
                {(p.goldCost * BigInt(quantityFor(p.key))).toString()}
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
