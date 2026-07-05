import { useEffect, useState } from "react";
import type { PokeballCatalogEntry, PotionCatalogEntry } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { getShopCatalog } from "../api/shop";
import { getExplorationState, setAutoHeal, setAutoCapture } from "../api/exploration";
import { ApiError } from "../api/client";

export function InventoryPanel({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [potions, setPotions] = useState<PotionCatalogEntry[]>([]);
  const [autoHeal, setAutoHealState] = useState(false);
  const [autoHealUnlocked, setAutoHealUnlocked] = useState(false);
  const [autoCapture, setAutoCaptureState] = useState(false);
  const [autoCaptureUnlocked, setAutoCaptureUnlocked] = useState(false);
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
      .then((state) => {
        setAutoHealState(state.autoHealEnabled);
        setAutoHealUnlocked(state.autoHealUnlocked);
        setAutoCaptureState(state.autoCaptureEnabled);
        setAutoCaptureUnlocked(state.autoCaptureUnlocked);
      })
      .catch(() => {});
  }, [accessToken, logout]);

  async function handleToggleAutoHeal() {
    if (!accessToken || busy || !autoHealUnlocked) return;
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

  async function handleToggleAutoCapture() {
    if (!accessToken || busy || !autoCaptureUnlocked) return;
    setBusy(true);
    try {
      const state = await setAutoCapture(accessToken, !autoCapture);
      setAutoCaptureState(state.autoCaptureEnabled);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBusy(false);
    }
  }

  const ownedPokeballs = pokeballs.filter((p) => p.owned > 0);
  const ownedPotions = potions.filter((p) => p.owned > 0);

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-panel/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border-[3px] border-gold bg-panel p-5 shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-center text-lg font-black tracking-wide text-gold-light">Inventaire</h2>

        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border-2 border-gold-deep bg-panel-light px-3 py-2.5">
          <span className="text-xs font-semibold text-panel-foreground/80">
            Soin auto en fin de combat (consomme des potions)
            {!autoHealUnlocked && (
              <span className="mt-0.5 block text-[10px] font-bold text-panel-foreground/50">
                À débloquer via la quête de la Bibliothèque
              </span>
            )}
          </span>
          <button
            type="button"
            disabled={busy || !autoHealUnlocked}
            onClick={handleToggleAutoHeal}
            className={[
              "shrink-0 rounded-full border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all disabled:opacity-50",
              autoHeal
                ? "border-gold-light bg-gradient-to-b from-gold-light to-gold-deep text-panel"
                : "border-gold-deep bg-panel text-panel-foreground/70",
            ].join(" ")}
          >
            {autoHealUnlocked ? (autoHeal ? "Activé" : "Désactivé") : "Verrouillé"}
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border-2 border-gold-deep bg-panel-light px-3 py-2.5">
          <span className="text-xs font-semibold text-panel-foreground/80">
            Capture auto en fin de combat (consomme des pokéballs)
            {!autoCaptureUnlocked && (
              <span className="mt-0.5 block text-[10px] font-bold text-panel-foreground/50">
                À débloquer via la quête de la Gare
              </span>
            )}
          </span>
          <button
            type="button"
            disabled={busy || !autoCaptureUnlocked}
            onClick={handleToggleAutoCapture}
            className={[
              "shrink-0 rounded-full border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all disabled:opacity-50",
              autoCapture
                ? "border-gold-light bg-gradient-to-b from-gold-light to-gold-deep text-panel"
                : "border-gold-deep bg-panel text-panel-foreground/70",
            ].join(" ")}
          >
            {autoCaptureUnlocked ? (autoCapture ? "Activé" : "Désactivé") : "Verrouillé"}
          </button>
        </div>

        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">Poké Balls</h3>
        {ownedPokeballs.length === 0 && (
          <p className="mb-3 text-xs font-semibold text-panel-foreground/60">Aucune balle possédée.</p>
        )}
        <ul className="mb-4 flex flex-col gap-2">
          {ownedPokeballs.map((p) => (
            <li key={p.key} className="flex items-center gap-3 rounded-xl border-2 border-gold-deep bg-panel-light px-3 py-2">
              <img src={`/items/${p.spriteFile}`} alt={p.name} className="h-9 w-9 shrink-0 [image-rendering:pixelated]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-gold-light">{p.name}</p>
                <p className="text-xs font-semibold text-panel-foreground/60">×{p.owned}</p>
              </div>
            </li>
          ))}
        </ul>

        <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">Soins</h3>
        {ownedPotions.length === 0 && (
          <p className="mb-3 text-xs font-semibold text-panel-foreground/60">Aucune potion possédée.</p>
        )}
        <ul className="flex flex-col gap-2">
          {ownedPotions.map((p) => (
            <li key={p.key} className="flex items-center gap-3 rounded-xl border-2 border-gold-deep bg-panel-light px-3 py-2">
              <img src={`/items/${p.spriteFile}`} alt={p.name} className="h-9 w-9 shrink-0 [image-rendering:pixelated]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-gold-light">{p.name}</p>
                <p className="text-xs font-semibold text-panel-foreground/60">×{p.owned}</p>
              </div>
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
