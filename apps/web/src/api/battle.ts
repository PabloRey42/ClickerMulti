import type { AttackResponse, BattleStateResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getBattleState(accessToken: string) {
  return apiRequest<BattleStateResponse>("/api/battle/state", { accessToken });
}

export function attack(accessToken: string) {
  return apiRequest<AttackResponse>("/api/battle/attack", {
    method: "POST",
    accessToken,
  });
}
