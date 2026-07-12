import type { RaidLobbySnapshot, RaidLobbySummary, RaidAttackResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function listRaidLobbies(accessToken: string, hotspotId: string) {
  return apiRequest<RaidLobbySummary[]>(`/api/raids/hotspot/${hotspotId}`, { accessToken });
}

export function createRaidLobby(accessToken: string, hotspotId: string) {
  return apiRequest<RaidLobbySnapshot>(`/api/raids/hotspot/${hotspotId}`, { method: "POST", accessToken });
}

export function getRaidLobby(accessToken: string, lobbyId: string) {
  return apiRequest<RaidLobbySnapshot>(`/api/raids/${lobbyId}`, { accessToken });
}

export function joinRaidLobby(accessToken: string, lobbyId: string) {
  return apiRequest<RaidLobbySnapshot>(`/api/raids/${lobbyId}/join`, { method: "POST", accessToken });
}

export function leaveRaidLobby(accessToken: string, lobbyId: string) {
  return apiRequest<RaidLobbySnapshot>(`/api/raids/${lobbyId}/leave`, { method: "POST", accessToken });
}

export function startRaidLobby(accessToken: string, lobbyId: string) {
  return apiRequest<RaidLobbySnapshot>(`/api/raids/${lobbyId}/start`, { method: "POST", accessToken });
}

export function attackRaidBoss(accessToken: string, lobbyId: string) {
  return apiRequest<RaidAttackResponse>(`/api/raids/${lobbyId}/attack`, { method: "POST", accessToken });
}
