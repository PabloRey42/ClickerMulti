import type { PlayerCreatureView } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function claimDynavoltEasterEgg(accessToken: string) {
  return apiRequest<PlayerCreatureView>("/api/easter-eggs/dynavolt", { method: "POST", accessToken });
}
