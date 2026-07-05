import { useEffect, useState } from "react";
import type { SpeciesView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { getStarterOptions, chooseStarter } from "../api/creatures";
import { ApiError } from "../api/client";
import { TYPE_LABEL, typeBadgeStyle, typeBadgeTextClassName } from "../theme/typeColors";

export function StarterSelectPage({ onChosen }: { onChosen: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [options, setOptions] = useState<SpeciesView[]>([]);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getStarterOptions(accessToken)
      .then(setOptions)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout]);

  async function handleChoose(speciesKey: string) {
    if (!accessToken || choosing) return;
    setChoosing(speciesKey);
    setError(null);
    try {
      await chooseStarter(accessToken, speciesKey);
      onChosen();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError("Impossible de choisir ce starter, réessaie.");
    } finally {
      setChoosing(null);
    }
  }

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h1 className="mb-1 text-center text-lg font-black tracking-wide text-gold-light sm:text-xl">
        Choisis ton starter
      </h1>
      <p className="mb-4 text-center text-xs font-semibold text-panel-foreground/60">
        Ce Pokémon t'accompagnera pour tes premiers combats.
      </p>

      {error && <p className="mb-3 text-center text-xs font-bold text-stat-hp">{error}</p>}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {options.map((species) => (
          <li
            key={species.key}
            className="flex flex-col items-center rounded-2xl border-2 border-gold-deep bg-panel p-3 text-center shadow-md"
          >
            <div className="my-2 flex h-16 w-16 items-center justify-center rounded-xl border border-gold-deep/40 bg-panel-light">
              <img
                src={`/sprites/${species.spriteFile}`}
                alt={species.name}
                className="h-11 w-11 [image-rendering:pixelated]"
              />
            </div>

            <p className="text-sm font-extrabold text-gold-light">{species.name}</p>

            <div className="mx-auto mt-1 flex flex-wrap justify-center gap-1">
              {species.types.map((type) => (
                <span
                  key={type}
                  style={typeBadgeStyle(type)}
                  className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${typeBadgeTextClassName(type)}`}
                >
                  {TYPE_LABEL[type]}
                </span>
              ))}
            </div>

            <p className="mt-2 text-[10px] font-bold text-panel-foreground/60">
              ATT {species.baseAttack} · PV {species.baseHp}
            </p>

            <button
              type="button"
              disabled={choosing !== null}
              onClick={() => handleChoose(species.key)}
              className="mt-3 w-full rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase tracking-wide text-panel shadow-[0_3px_0_var(--gold-deep)] transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-60"
            >
              {choosing === species.key ? "..." : "Choisir"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
