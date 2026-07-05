import { useEffect, useState } from "react";
import type { QuestView } from "@farm-clicker/shared";
import { useAuthStore } from "../../state/authStore";
import { getQuestState } from "../../api/quests";
import { ApiError } from "../../api/client";

const STATUS_LABEL: Record<QuestView["status"], string> = {
  locked: "Verrouillée",
  in_progress: "En cours",
  completed: "Terminée",
};

export function QuestNpcPanel({ npcHotspotId, onClose }: { npcHotspotId: string; onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [quest, setQuest] = useState<QuestView | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getQuestState(accessToken)
      .then((state) => {
        const match = state.quests.find((q) => q.npcHotspotId === npcHotspotId);
        if (match) setQuest(match);
        else setNotFound(true);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, npcHotspotId, logout]);

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-panel/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border-[3px] border-gold bg-panel p-5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        {!quest && !notFound && <p className="text-sm font-semibold text-panel-foreground/60">Chargement...</p>}
        {notFound && <p className="text-sm font-semibold text-panel-foreground/60">Rien à signaler ici pour l'instant.</p>}

        {quest && (
          <>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-panel-foreground/60">
              {quest.npcName}
            </p>
            <h2 className="mb-1 text-lg font-black tracking-wide text-gold-light">{quest.title}</h2>
            <span
              className={[
                "mb-3 inline-block rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                quest.status === "completed"
                  ? "border-stat-xp bg-stat-xp/20 text-stat-xp"
                  : quest.status === "locked"
                    ? "border-panel-foreground/30 bg-panel-light text-panel-foreground/60"
                    : "border-gold-deep bg-gold-deep/20 text-gold-light",
              ].join(" ")}
            >
              {STATUS_LABEL[quest.status]}
            </span>

            {quest.status === "locked" ? (
              <p className="mb-3 text-sm font-semibold text-panel-foreground/70">
                Reviens plus tard — cette quête n'est pas encore disponible.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm font-semibold text-panel-foreground/70">{quest.description}</p>

                <ul className="mb-3 flex flex-col gap-1.5 text-left">
                  {quest.objectives.map((objective) => (
                    <li
                      key={objective.key}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gold-deep/60 bg-panel-light px-2.5 py-1.5"
                    >
                      <span
                        className={`text-xs font-bold ${
                          objective.progress >= objective.target ? "text-stat-xp" : "text-panel-foreground/80"
                        }`}
                      >
                        {objective.progress >= objective.target ? "✓ " : ""}
                        {objective.description}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-panel-foreground/60">
                        {objective.progress}/{objective.target}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mb-1 rounded-lg border border-gold-deep/60 bg-panel-light px-2.5 py-2 text-left text-xs font-semibold text-panel-foreground/80">
                  Récompense : {quest.rewardGold.toString()} or
                  {quest.rewardUnlockAutoHeal ? " · débloque le soin automatique" : ""}
                  {quest.rewardUnlockAutoCapture ? " · débloque la capture automatique" : ""}
                </div>
              </>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs font-bold text-panel-foreground/60 underline-offset-2 hover:text-gold-light hover:underline"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
