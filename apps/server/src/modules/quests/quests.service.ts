import type { PrismaClient, Prisma } from "@prisma/client";
import { QUEST_CATALOG, type QuestConfig, type QuestObjectiveType, type QuestStateResponse } from "@farm-clicker/shared";

type Db = PrismaClient | Prisma.TransactionClient;

async function applyQuestReward(tx: Db, userId: string, quest: QuestConfig): Promise<void> {
  const data: Record<string, unknown> = {};
  if (quest.reward.goldReward > 0n) data.goldBalance = { increment: quest.reward.goldReward };
  if (quest.reward.unlockAutoHeal) data.autoHealUnlocked = true;
  if (quest.reward.unlockAutoCapture) data.autoCaptureUnlocked = true;
  if (Object.keys(data).length > 0) {
    await tx.playerState.update({ where: { userId }, data });
  }
}

/** Called from wherever the underlying gameplay action happens (same transaction where
 * possible). Cheap to call unconditionally: it no-ops for any quest that's locked, already
 * completed, or doesn't track this objective type. Quests auto-activate the first time a
 * relevant objective is bumped (no separate "accept" step), and auto-complete + grant their
 * reward the instant every objective hits its target. */
export async function bumpQuestObjective(
  tx: Db,
  userId: string,
  type: QuestObjectiveType,
  amount = 1,
): Promise<void> {
  const relevantQuests = Object.values(QUEST_CATALOG).filter((q) => q.objectives.some((o) => o.type === type));
  if (relevantQuests.length === 0) return;

  for (const quest of relevantQuests) {
    const existing = await tx.playerQuestProgress.findUnique({
      where: { userId_questKey: { userId, questKey: quest.key } },
    });
    if (existing?.status === "COMPLETED") continue;

    if (quest.prerequisiteQuestKey) {
      const prereq = await tx.playerQuestProgress.findUnique({
        where: { userId_questKey: { userId, questKey: quest.prerequisiteQuestKey } },
      });
      if (prereq?.status !== "COMPLETED") continue;
    }

    const progress = { ...((existing?.objectiveProgress as Record<string, number> | null) ?? {}) };
    let changed = false;
    for (const objective of quest.objectives) {
      if (objective.type !== type) continue;
      const current = progress[objective.key] ?? 0;
      if (current >= objective.target) continue;
      progress[objective.key] = Math.min(objective.target, current + amount);
      changed = true;
    }
    if (!changed) continue;

    const allDone = quest.objectives.every((o) => (progress[o.key] ?? 0) >= o.target);

    await tx.playerQuestProgress.upsert({
      where: { userId_questKey: { userId, questKey: quest.key } },
      update: { objectiveProgress: progress, status: allDone ? "COMPLETED" : "IN_PROGRESS", completedAt: allDone ? new Date() : null },
      create: {
        userId,
        questKey: quest.key,
        objectiveProgress: progress,
        status: allDone ? "COMPLETED" : "IN_PROGRESS",
        completedAt: allDone ? new Date() : null,
      },
    });

    if (allDone) {
      await applyQuestReward(tx, userId, quest);
    }
  }
}

export async function getQuestState(prisma: PrismaClient, userId: string): Promise<QuestStateResponse> {
  const rows = await prisma.playerQuestProgress.findMany({ where: { userId } });
  const byKey = new Map(rows.map((r) => [r.questKey, r]));

  const quests = Object.values(QUEST_CATALOG).map((quest) => {
    const row = byKey.get(quest.key);
    const prereqDone = !quest.prerequisiteQuestKey || byKey.get(quest.prerequisiteQuestKey)?.status === "COMPLETED";
    const status = !prereqDone ? ("locked" as const) : row?.status === "COMPLETED" ? ("completed" as const) : ("in_progress" as const);
    const progressMap = (row?.objectiveProgress as Record<string, number> | null) ?? {};

    return {
      key: quest.key,
      npcHotspotId: quest.npcHotspotId,
      npcName: quest.npcName,
      title: quest.title,
      description: quest.description,
      status,
      objectives: quest.objectives.map((o) => ({
        key: o.key,
        description: o.description,
        progress: Math.min(o.target, progressMap[o.key] ?? 0),
        target: o.target,
      })),
      rewardGold: quest.reward.goldReward,
      rewardUnlockAutoHeal: quest.reward.unlockAutoHeal ?? false,
      rewardUnlockAutoCapture: quest.reward.unlockAutoCapture ?? false,
    };
  });

  return { quests };
}
