export type QuestUiStatus = "locked" | "in_progress" | "completed";

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
  objectives: QuestObjectiveView[];
  rewardGold: bigint;
  rewardUnlockAutoHeal: boolean;
  rewardUnlockAutoCapture: boolean;
}

export interface QuestStateResponse {
  quests: QuestView[];
}
