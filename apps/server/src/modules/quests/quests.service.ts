import type { PrismaClient, Prisma } from "@prisma/client";
import { QUEST_CATALOG, type QuestConfig, type QuestObjectiveType, type QuestStateResponse } from "@farm-clicker/shared";

type Db = PrismaClient | Prisma.TransactionClient;

export class QuestNotFoundError extends Error {}
export class QuestLockedError extends Error {}
export class QuestAlreadyStartedError extends Error {}
export class AnotherQuestActiveError extends Error {}
export class QuestNotReadyError extends Error {}

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
 * possible). Cheap to call unconditionally: it no-ops unless the player has actually
 * accepted a quest that tracks this objective type and hasn't finished it yet. Since only
 * one quest can be IN_PROGRESS per player at a time, at most one quest is ever touched. */
export async function bumpQuestObjective(
  tx: Db,
  userId: string,
  type: QuestObjectiveType,
  amount = 1,
  context?: { routeKey?: string },
): Promise<void> {
  const relevantQuests = Object.values(QUEST_CATALOG).filter((q) => q.objectives.some((o) => o.type === type));
  if (relevantQuests.length === 0) return;

  for (const quest of relevantQuests) {
    const existing = await tx.playerQuestProgress.findUnique({
      where: { userId_questKey: { userId, questKey: quest.key } },
    });
    // Not accepted yet, or already finished — nothing to track.
    if (!existing || existing.status !== "IN_PROGRESS") continue;

    const progress = { ...((existing.objectiveProgress as Record<string, number> | null) ?? {}) };
    let changed = false;
    for (const objective of quest.objectives) {
      if (objective.type !== type) continue;
      if (objective.type === "win_battle_on_route" && objective.routeKey !== context?.routeKey) continue;
      const current = progress[objective.key] ?? 0;
      if (current >= objective.target) continue;
      progress[objective.key] = Math.min(objective.target, current + amount);
      changed = true;
    }
    if (!changed) continue;

    const allDone = quest.objectives.every((o) => (progress[o.key] ?? 0) >= o.target);

    await tx.playerQuestProgress.update({
      where: { userId_questKey: { userId, questKey: quest.key } },
      data: { objectiveProgress: progress, status: allDone ? "READY_TO_CLAIM" : "IN_PROGRESS" },
    });
  }
}

export async function getQuestState(prisma: PrismaClient, userId: string): Promise<QuestStateResponse> {
  const rows = await prisma.playerQuestProgress.findMany({ where: { userId } });
  const byKey = new Map(rows.map((r) => [r.questKey, r]));
  const hasActiveQuest = rows.some((r) => r.status === "IN_PROGRESS" || r.status === "READY_TO_CLAIM");

  const quests = Object.values(QUEST_CATALOG).map((quest) => {
    const row = byKey.get(quest.key);
    const prereqMet = !quest.prerequisiteQuestKey || byKey.get(quest.prerequisiteQuestKey)?.status === "CLAIMED";

    const status =
      !prereqMet
        ? ("locked" as const)
        : row?.status === "CLAIMED"
          ? ("claimed" as const)
          : row?.status === "READY_TO_CLAIM"
            ? ("ready_to_claim" as const)
            : row?.status === "IN_PROGRESS"
              ? ("active" as const)
              : ("available" as const);

    const progressMap = (row?.objectiveProgress as Record<string, number> | null) ?? {};

    return {
      key: quest.key,
      npcHotspotId: quest.npcHotspotId,
      npcName: quest.npcName,
      title: quest.title,
      description: quest.description,
      status,
      blockedByOtherActiveQuest: status === "available" && hasActiveQuest,
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

export async function acceptQuest(prisma: PrismaClient, userId: string, questKey: string): Promise<QuestStateResponse> {
  const quest = QUEST_CATALOG[questKey];
  if (!quest) throw new QuestNotFoundError();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.playerQuestProgress.findUnique({
      where: { userId_questKey: { userId, questKey } },
    });
    if (existing) throw new QuestAlreadyStartedError();

    if (quest.prerequisiteQuestKey) {
      const prereq = await tx.playerQuestProgress.findUnique({
        where: { userId_questKey: { userId, questKey: quest.prerequisiteQuestKey } },
      });
      if (prereq?.status !== "CLAIMED") throw new QuestLockedError();
    }

    const activeCount = await tx.playerQuestProgress.count({
      where: { userId, status: { in: ["IN_PROGRESS", "READY_TO_CLAIM"] } },
    });
    if (activeCount > 0) throw new AnotherQuestActiveError();

    await tx.playerQuestProgress.create({
      data: { userId, questKey, objectiveProgress: {}, status: "IN_PROGRESS" },
    });
  });

  return getQuestState(prisma, userId);
}

export async function claimQuest(prisma: PrismaClient, userId: string, questKey: string): Promise<QuestStateResponse> {
  const quest = QUEST_CATALOG[questKey];
  if (!quest) throw new QuestNotFoundError();

  await prisma.$transaction(async (tx) => {
    const row = await tx.playerQuestProgress.findUnique({
      where: { userId_questKey: { userId, questKey } },
    });
    if (!row || row.status !== "READY_TO_CLAIM") throw new QuestNotReadyError();

    await tx.playerQuestProgress.update({
      where: { userId_questKey: { userId, questKey } },
      data: { status: "CLAIMED", completedAt: new Date() },
    });
    await applyQuestReward(tx, userId, quest);
  });

  return getQuestState(prisma, userId);
}
