import { useEffect, useState } from "react";
import type { LeagueStateResponse, ElementalType } from "@farm-clicker/shared";
import { ELEMENTAL_TYPES } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useExplorationStore } from "../state/explorationStore";
import { useBattleStore } from "../state/battleStore";
import { getLeagueState, challengeLeague, investSpecializationPoint } from "../api/league";
import { ApiError } from "../api/client";

const TYPE_LABEL: Record<ElementalType, string> = {
  normal: "Normal",
  feu: "Feu",
  eau: "Eau",
  plante: "Plante",
  electrique: "Électrik",
};

export function LeaguePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const goToWorld = useExplorationStore((s) => s.goToWorld);
  const goToEncounter = useExplorationStore((s) => s.goToEncounter);
  const setBattleState = useBattleStore((s) => s.setState);
  const [league, setLeague] = useState<LeagueStateResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function refresh() {
    if (!accessToken) return;
    try {
      setLeague(await getLeagueState(accessToken));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function handleChallenge() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const state = await challengeLeague(accessToken);
      setBattleState(state);
      goToEncounter({ view: "league" });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        if (body?.error === "no_active_creature") setError("Tu n'as aucun Pokémon actif.");
        else if (body?.error === "active_creature_fainted") {
          setError("Ton Pokémon actif est K.O. — soigne-le d'abord.");
        } else setError("Impossible de défier la Ligue.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSpecialize(elementalType: ElementalType) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      setLeague(await investSpecializationPoint(accessToken, elementalType));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setBusy(false);
    }
  }

  if (!league) {
    return (
      <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
        <h1 className="mb-2 text-lg font-black tracking-wide text-gold-light">Ligue Pokémon</h1>
        <p className="text-sm font-semibold text-panel-foreground/70">Chargement...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black tracking-wide text-gold-light sm:text-xl">Ligue Pokémon</h1>
        <button
          type="button"
          onClick={goToWorld}
          className="text-xs font-bold text-panel-foreground/70 underline-offset-2 hover:text-gold-light hover:underline"
        >
          Retour à la carte du monde
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 border-gold-deep bg-panel px-4 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-panel-foreground/60">Rang</span>
          <span className="text-lg font-black text-gold-light">{league.rank}</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 border-gold-deep bg-panel px-4 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-panel-foreground/60">
            Points de spécialisation
          </span>
          <span className="text-lg font-black text-gold-light">{league.unspentPoints}</span>
        </div>
      </div>

      {error && <p className="mb-3 text-center text-xs font-bold text-stat-hp">{error}</p>}

      <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-gold-light">Prochains adversaires</h2>
      <ul className="mb-4 flex flex-col gap-2">
        {league.opponentPreview.map((opponent, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border-2 border-gold-deep bg-panel px-3 py-2">
            <img
              src={`/sprites/${opponent.spriteFile}`}
              alt={opponent.name}
              className="h-9 w-9 shrink-0 [image-rendering:pixelated]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-gold-light">{opponent.name}</p>
              <p className="text-xs font-semibold text-panel-foreground/60">Nv. {opponent.level}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mb-5 flex justify-center">
        <button
          type="button"
          onClick={handleChallenge}
          disabled={busy}
          className="flex items-center gap-2 rounded-full border-[3px] border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-6 py-3 text-sm font-black uppercase tracking-wide text-panel shadow-[0_6px_0_var(--gold-deep),0_10px_20px_rgba(0,0,0,0.5)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_var(--gold-deep)] disabled:opacity-60"
        >
          <span>🏆</span>
          <span>{league.inProgress ? "Reprendre" : "Défier"}</span>
        </button>
      </div>

      <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-gold-light">Spécialisation</h2>
      <ul className="flex flex-col gap-2">
        {ELEMENTAL_TYPES.map((type) => (
          <li key={type} className="flex items-center gap-3 rounded-xl border-2 border-gold-deep bg-panel px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-gold-light">{TYPE_LABEL[type]}</p>
              <p className="text-xs font-semibold text-panel-foreground/60">
                {league.specialization[type] ?? 0} point(s) investi(s)
              </p>
            </div>
            <button
              type="button"
              disabled={busy || league.unspentPoints < 1}
              onClick={() => handleSpecialize(type)}
              className="shrink-0 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase text-panel disabled:opacity-50"
            >
              Investir
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
