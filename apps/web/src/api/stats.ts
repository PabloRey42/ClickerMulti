import type { PlayerStatsResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getPlayerStats(accessToken: string) {
  return apiRequest<PlayerStatsResponse>("/api/stats", { accessToken });
}
