import type {
  ExplorationStateResponse,
  AttackResponse,
  CaptureResponse,
  FinishEncounterResponse,
} from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getExplorationState(accessToken: string) {
  return apiRequest<ExplorationStateResponse>("/api/exploration/state", { accessToken });
}

export function enterRoute(accessToken: string, routeKey: string) {
  return apiRequest<ExplorationStateResponse>(`/api/exploration/routes/${routeKey}/enter`, {
    method: "POST",
    accessToken,
  });
}

export function attackEncounter(accessToken: string) {
  return apiRequest<AttackResponse>("/api/exploration/encounter/attack", { method: "POST", accessToken });
}

export function captureEncounter(accessToken: string, pokeballKey: string) {
  return apiRequest<CaptureResponse>("/api/exploration/encounter/capture", {
    method: "POST",
    accessToken,
    body: { pokeballKey },
  });
}

export function finishEncounter(accessToken: string) {
  return apiRequest<FinishEncounterResponse>("/api/exploration/encounter/finish", {
    method: "POST",
    accessToken,
  });
}

export function fleeEncounter(accessToken: string) {
  return apiRequest<ExplorationStateResponse>("/api/exploration/encounter/flee", {
    method: "POST",
    accessToken,
  });
}

export function healTeam(accessToken: string) {
  return apiRequest<ExplorationStateResponse>("/api/exploration/heal", { method: "POST", accessToken });
}
