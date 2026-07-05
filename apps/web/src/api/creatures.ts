import type { PlayerCreatureView, SpeciesView } from "@farm-clicker/shared";
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
