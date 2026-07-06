export type QuestUiStatus = "locked" | "available" | "active" | "ready_to_claim" | "claimed";

export interface QuestObjectiveView {
  key: string;
  description: string;
  progress: number;
  target: number;
}

export interface QuestView {
  key: string;
  npcHotspotId: string;
  npcName: string;
  title: string;
  description: string;
  status: QuestUiStatus;
  /** True only when status is "available" but the player already has a different quest
   * active — they must finish (or the quest must be claimed) before starting this one. */
  blockedByOtherActiveQuest: boolean;
  objectives: QuestObjectiveView[];
  rewardGold: bigint;
  rewardUnlockAutoHeal: boolean;
  rewardUnlockAutoCapture: boolean;
}

export interface QuestStateResponse {
  quests: QuestView[];
}
