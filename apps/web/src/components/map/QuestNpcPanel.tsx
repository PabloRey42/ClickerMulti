import { useEffect, useState } from "react";
import type { QuestView } from "@farm-clicker/shared";
import { useAuthStore } from "../../state/authStore";
import { getQuestState, acceptQuest, claimQuest } from "../../api/quests";
import { ApiError } from "../../api/client";

const STATUS_LABEL: Record<QuestView["status"], string> = {
  locked: "Verrouillée",
  available: "Disponible",
  active: "En cours",
  ready_to_claim: "Terminée — à valider",
  claimed: "Validée",
};

const STATUS_CLASS: Record<QuestView["status"], string> = {
  locked: "border-panel-foreground/30 bg-panel-light text-panel-foreground/60",
  available: "border-gold-deep bg-gold-deep/20 text-gold-light",
  active: "border-gold-deep bg-gold-deep/20 text-gold-light",
  ready_to_claim: "border-stat-xp bg-stat-xp/20 text-stat-xp",
  claimed: "border-stat-xp/60 bg-stat-xp/10 text-stat-xp/80",
};

function QuestCard({
  quest,
  busy,
  error,
  onAccept,
  onClaim,
}: {
  quest: QuestView;
  busy: boolean;
  error: string | null;
  onAccept: () => void;
  onClaim: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-gold-deep bg-panel-light p-3 text-left">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-gold-light">{quest.title}</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${STATUS_CLASS[quest.status]}`}
        >
          {STATUS_LABEL[quest.status]}
        </span>
      </div>

      {quest.status === "locked" && (
        <p className="text-xs font-semibold text-panel-foreground/60">
          Termine la quête précédente pour la débloquer.
        </p>
      )}

      {quest.status !== "locked" && <p className="mb-2 text-xs font-semibold text-panel-foreground/70">{quest.description}</p>}

      {(quest.status === "active" || quest.status === "ready_to_claim" || quest.status === "claimed") && (
        <ul className="mb-2 flex flex-col gap-1">
          {quest.objectives.map((objective) => (
            <li key={objective.key} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-panel-foreground/80">{objective.description}</span>
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
      )}

      {quest.status !== "locked" && (
        <div className="mb-2 rounded-lg border border-gold-deep/60 bg-panel px-2.5 py-1.5 text-[11px] font-semibold text-panel-foreground/80">
          Récompense : {quest.rewardGold.toString()} or
          {quest.rewardUnlockAutoHeal ? " · débloque le soin automatique" : ""}
          {quest.rewardUnlockAutoCapture ? " · débloque la capture automatique" : ""}
        </div>
      )}

      {error && <p className="mb-2 text-xs font-bold text-stat-hp">{error}</p>}

      {quest.status === "available" && (
        <>
          <button
            type="button"
            disabled={busy || quest.blockedByOtherActiveQuest}
            onClick={onAccept}
            className="w-full rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase tracking-wide text-panel disabled:opacity-50"
          >
            Accepter
          </button>
          {quest.blockedByOtherActiveQuest && (
            <p className="mt-1.5 text-[11px] font-semibold text-panel-foreground/60">
              Termine ta quête en cours avant d'en accepter une autre.
            </p>
          )}
        </>
      )}

      {quest.status === "ready_to_claim" && (
        <button
          type="button"
          disabled={busy}
          onClick={onClaim}
          className="w-full rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase tracking-wide text-panel disabled:opacity-50"
        >
          Valider
        </button>
      )}
    </div>
  );
}

export function QuestNpcPanel({ npcHotspotId, onClose }: { npcHotspotId: string; onClose: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [quests, setQuests] = useState<QuestView[] | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, npcHotspotId]);

  async function refresh() {
    if (!accessToken) return;
    try {
      const state = await getQuestState(accessToken);
      setQuests(state.quests.filter((q) => q.npcHotspotId === npcHotspotId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function handleAccept(questKey: string) {
    if (!accessToken || busyKey) return;
    setBusyKey(questKey);
    setError(null);
    try {
      const state = await acceptQuest(accessToken, questKey);
      setQuests(state.quests.filter((q) => q.npcHotspotId === npcHotspotId));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError(
          body?.error === "another_quest_active"
            ? "Tu as déjà une quête en cours."
            : "Impossible d'accepter cette quête.",
        );
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function handleClaim(questKey: string) {
    if (!accessToken || busyKey) return;
    setBusyKey(questKey);
    setError(null);
    try {
      const state = await claimQuest(accessToken, questKey);
      setQuests(state.quests.filter((q) => q.npcHotspotId === npcHotspotId));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        setError("Impossible de valider cette quête.");
      }
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-panel/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-3xl border-[3px] border-gold bg-panel p-5 shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        {quests === null && <p className="text-center text-sm font-semibold text-panel-foreground/60">Chargement...</p>}
        {quests?.length === 0 && (
          <p className="text-center text-sm font-semibold text-panel-foreground/60">
            Rien à signaler ici pour l'instant.
          </p>
        )}

        {quests && quests.length > 0 && (
          <>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-panel-foreground/60">
              {quests[0].npcName}
            </p>
            <div className="flex flex-col gap-3">
              {quests.map((quest) => (
                <QuestCard
                  key={quest.key}
                  quest={quest}
                  busy={busyKey === quest.key}
                  error={busyKey === null ? error : null}
                  onAccept={() => handleAccept(quest.key)}
                  onClaim={() => handleClaim(quest.key)}
                />
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs font-bold text-panel-foreground/60 underline-offset-2 hover:text-gold-light hover:underline"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
