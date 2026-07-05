import type { BuyGeneratorResponse, ClickResponse, FarmStateResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getFarmState(accessToken: string) {
  return apiRequest<FarmStateResponse>("/api/farm/state", { accessToken });
}

export function clickFarm(accessToken: string) {
  return apiRequest<ClickResponse>("/api/farm/click", { method: "POST", accessToken });
}

export function buyGenerator(accessToken: string, key: string) {
  return apiRequest<BuyGeneratorResponse>(`/api/farm/generators/${key}/buy`, {
    method: "POST",
    accessToken,
  });
}
