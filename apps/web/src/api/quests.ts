import type { QuestStateResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getQuestState(accessToken: string) {
  return apiRequest<QuestStateResponse>("/api/quests", { accessToken });
}

export function pingQuestObjective(accessToken: string, type: "visit_world_map") {
  return apiRequest<QuestStateResponse>("/api/quests/ping", {
    method: "POST",
    accessToken,
    body: { type },
  });
}

export function acceptQuest(accessToken: string, questKey: string) {
  return apiRequest<QuestStateResponse>(`/api/quests/${questKey}/accept`, {
    method: "POST",
    accessToken,
  });
}

export function claimQuest(accessToken: string, questKey: string) {
  return apiRequest<QuestStateResponse>(`/api/quests/${questKey}/claim`, {
    method: "POST",
    accessToken,
  });
}
