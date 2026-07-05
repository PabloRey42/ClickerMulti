import { useEffect, useState } from "react";
import type { SpeciesView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { getStarterOptions, chooseStarter } from "../api/creatures";
import { ApiError } from "../api/client";

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
    <div className="dialog-box">
      <h1 className="title">Choisis ton starter</h1>
      {error && <p className="error-text">{error}</p>}
      <ul className="generator-list">
        {options.map((species) => (
          <li key={species.key} className="generator-row">
            <div className="generator-row-info">
              <span className="generator-row-name">{species.name}</span>
              <span className="generator-row-meta">
                Type : {species.elementalType} · ATT {species.baseAttack} · PV {species.baseHp}
              </span>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={choosing !== null}
              onClick={() => handleChoose(species.key)}
            >
              {choosing === species.key ? "..." : "Choisir"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
