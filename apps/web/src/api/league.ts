import type { LeagueStateResponse, ExplorationStateResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getLeagueState(accessToken: string) {
  return apiRequest<LeagueStateResponse>("/api/league/state", { accessToken });
}

export function challengeLeague(accessToken: string) {
  return apiRequest<ExplorationStateResponse>("/api/league/challenge", { method: "POST", accessToken });
}

export function investSpecializationPoint(accessToken: string, elementalType: string) {
  return apiRequest<LeagueStateResponse>("/api/league/specialize", {
    method: "POST",
    accessToken,
    body: { elementalType },
  });
}
