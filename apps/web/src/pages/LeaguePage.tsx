import { useEffect, useState } from "react";
import type { LeagueStateResponse, SkillBranchId } from "@farm-clicker/shared";
import { SKILL_TREE_BRANCHES, SKILL_TREE_TIERS_PER_BRANCH } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useExplorationStore } from "../state/explorationStore";
import { useBattleStore } from "../state/battleStore";
import { getLeagueState, challengeLeague, investSkillNode } from "../api/league";
import { ApiError } from "../api/client";

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

  async function handleInvest(branch: SkillBranchId) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      setLeague(await investSkillNode(accessToken, branch));
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
            Points de compétence
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

      <SkillTreePanel league={league} busy={busy} onInvest={handleInvest} />
    </section>
  );
}

function SkillTreePanel({
  league,
  busy,
  onInvest,
}: {
  league: LeagueStateResponse;
  busy: boolean;
  onInvest: (branch: SkillBranchId) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gold-light">
          <img src="/ui/skill-tree-icon.png" alt="" className="h-6 w-6 [image-rendering:pixelated]" />
          Arbre de compétence
        </h2>
        {league.hasShinyCharm && (
          <span className="rounded-full border-2 border-amber-300 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.6)]">
            ✨ Charme Shiny obtenu
          </span>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border-2 border-indigo-400/40 p-4 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.9) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 75% 10%, rgba(255,255,255,0.7) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 40% 65%, rgba(255,255,255,0.8) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 85% 55%, rgba(255,255,255,0.6) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 60% 85%, rgba(255,255,255,0.9) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 25% 90%, rgba(255,255,255,0.5) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 92% 25%, rgba(255,255,255,0.7) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 8% 55%, rgba(255,255,255,0.6) 0 1px, transparent 1px)," +
            "radial-gradient(circle at 50% 15%, rgba(255,255,255,0.5) 0 1px, transparent 1px)," +
            "linear-gradient(180deg, #0a0f2c 0%, #171238 55%, #21123f 100%)",
          backgroundSize: "100% 100%",
        }}
      >
        {/* Charme Shiny reward node, above the branches */}
        <div className="mb-4 flex justify-center">
          <div
            className={[
              "flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-2 text-center transition-all",
              league.hasShinyCharm
                ? "border-amber-300 bg-amber-300/15 shadow-[0_0_20px_rgba(252,211,77,0.7)]"
                : "border-indigo-300/30 bg-indigo-950/40",
            ].join(" ")}
          >
            <span className="text-2xl">✨</span>
            <span className={`text-[10px] font-black uppercase tracking-wide ${league.hasShinyCharm ? "text-amber-200" : "text-indigo-200/60"}`}>
              Charme Shiny
            </span>
            <span className="text-[9px] font-semibold text-indigo-200/50">x2 chances de shiny</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {SKILL_TREE_BRANCHES.map((branch) => {
            const tier = league.skillTree[branch.id] ?? 0;
            return (
              <div key={branch.id} className="flex flex-col items-center gap-2">
                <span className="text-lg sm:text-xl">{branch.icon}</span>
                <span className="text-center text-[9px] font-black uppercase tracking-wide text-indigo-100 sm:text-[10px]">
                  {branch.label}
                </span>
                <div className="flex flex-col-reverse items-center gap-1.5">
                  {Array.from({ length: SKILL_TREE_TIERS_PER_BRANCH }, (_, i) => i + 1).map((nodeTier) => {
                    const owned = nodeTier <= tier;
                    const unlockable = nodeTier === tier + 1 && league.unspentPoints > 0;
                    return (
                      <button
                        key={nodeTier}
                        type="button"
                        disabled={busy || !unlockable}
                        onClick={() => onInvest(branch.id)}
                        title={branch.description}
                        className={[
                          "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black transition-all sm:h-8 sm:w-8",
                          owned
                            ? "border-amber-300 bg-amber-300/80 text-indigo-950 shadow-[0_0_10px_rgba(252,211,77,0.7)]"
                            : unlockable
                              ? "border-indigo-200 bg-indigo-500/40 text-indigo-50 hover:bg-indigo-400/60"
                              : "border-indigo-300/20 bg-indigo-950/60 text-indigo-300/30",
                        ].join(" ")}
                      >
                        {nodeTier}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
