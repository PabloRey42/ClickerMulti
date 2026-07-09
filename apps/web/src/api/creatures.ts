import type { PlayerCreatureView, SpeciesView, UseStoneResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function listCreatures(accessToken: string) {
  return apiRequest<PlayerCreatureView[]>("/api/creatures", { accessToken });
}

export function getStarterOptions(accessToken: string) {
  return apiRequest<SpeciesView[]>("/api/creatures/starter-options", { accessToken });
}

export function chooseStarter(accessToken: string, speciesKey: string) {
  return apiRequest<PlayerCreatureView>("/api/creatures/starter", {
    method: "POST",
    accessToken,
    body: { speciesKey },
  });
}

export function activateCreature(accessToken: string, creatureId: string) {
  return apiRequest<PlayerCreatureView>(`/api/creatures/${creatureId}/activate`, {
    method: "POST",
    accessToken,
  });
}

export function setTeamMembership(accessToken: string, creatureId: string, onTeam: boolean) {
  return apiRequest<PlayerCreatureView[]>(`/api/creatures/${creatureId}/team`, {
    method: "POST",
    accessToken,
    body: { onTeam },
  });
}

export function clearTeam(accessToken: string) {
  return apiRequest<PlayerCreatureView[]>("/api/creatures/team/clear", {
    method: "POST",
    accessToken,
  });
}

/** Persists a drag-and-drop reorder of the team sidebar — `creatureIds` is the full team,
 * front-to-back. Whoever ends up first becomes the active creature server-side. */
export function reorderTeam(accessToken: string, creatureIds: string[]) {
  return apiRequest<PlayerCreatureView[]>("/api/creatures/team/reorder", {
    method: "POST",
    accessToken,
    body: { creatureIds },
  });
}

export function useEvolutionStone(accessToken: string, creatureId: string, stoneKey: string) {
  return apiRequest<UseStoneResponse>(`/api/creatures/${creatureId}/use-stone`, {
    method: "POST",
    accessToken,
    body: { stoneKey },
  });
}

/** Fired once the client has actually shown a retroactive evolution reveal, so it stops
 * being reported by listCreatures. Best-effort — see ackEvolutionReveal's server doc. */
export function ackEvolutionReveal(accessToken: string, creatureId: string) {
  return apiRequest<void>(`/api/creatures/${creatureId}/ack-evolution`, {
    method: "POST",
    accessToken,
  });
}
