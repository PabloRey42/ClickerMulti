import { useEffect, useState } from "react";
import type { QuestView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useBattleStore } from "../state/battleStore";
import { getQuestState } from "../api/quests";

export function ActiveQuestTracker() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const encounter = useBattleStore((s) => s.state?.encounter ?? null);
  const battleState = useBattleStore((s) => s.state);
  const [activeQuest, setActiveQuest] = useState<QuestView | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getQuestState(accessToken)
      .then((state) => {
        const active = state.quests.find((q) => q.status === "active" || q.status === "ready_to_claim");
        setActiveQuest(active ?? null);
      })
      .catch(() => {});
  }, [accessToken, battleState]);

  if (!encounter || encounter.isLeagueBattle || !activeQuest) return null;

  return (
    <aside className="w-full rounded-3xl border-[3px] border-gold bg-gold-deep/30 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h2 className="mb-1 text-center text-sm font-black uppercase tracking-widest text-gold-light">
        Quête en cours
      </h2>
      <p className="mb-3 text-center text-xs font-extrabold text-panel-foreground/80">{activeQuest.title}</p>

      <ul className="flex flex-col gap-2">
        {activeQuest.objectives.map((objective) => (
          <li key={objective.key} className="rounded-xl border-2 border-gold-deep bg-panel px-2.5 py-1.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-gold-light">{objective.description}</span>
              <span className="shrink-0 text-[10px] font-bold text-panel-foreground/60">
                {objective.progress}/{objective.target}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bar-track">
              <div
                className="h-full rounded-full bg-stat-xp transition-all"
                style={{ width: `${Math.min(100, (objective.progress / objective.target) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {activeQuest.status === "ready_to_claim" && (
        <p className="mt-2 text-center text-[11px] font-bold text-stat-xp">
          Termine ! Retourne voir {activeQuest.npcName} pour valider.
        </p>
      )}
    </aside>
  );
}
