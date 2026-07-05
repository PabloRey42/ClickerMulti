import type { PlayerCreatureView } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function listCreatures(accessToken: string) {
  return apiRequest<PlayerCreatureView[]>("/api/creatures", { accessToken });
}

export function activateCreature(accessToken: string, creatureId: string) {
  return apiRequest<PlayerCreatureView>(`/api/creatures/${creatureId}/activate`, {
    method: "POST",
    accessToken,
  });
}
