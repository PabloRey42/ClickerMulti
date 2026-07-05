import type { MarketListingsResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getListings(accessToken: string) {
  return apiRequest<MarketListingsResponse>("/api/market/listings", { accessToken });
}

export function createItemListing(accessToken: string, itemKey: string, quantity: number, askGoldPrice: string) {
  return apiRequest<MarketListingsResponse>("/api/market/listings", {
    method: "POST",
    accessToken,
    body: { assetType: "ITEM", itemKey, quantity, askGoldPrice },
  });
}

export function createCreatureListing(accessToken: string, creatureId: string, askGoldPrice: string) {
  return apiRequest<MarketListingsResponse>("/api/market/listings", {
    method: "POST",
    accessToken,
    body: { assetType: "CREATURE", creatureId, askGoldPrice },
  });
}

export function buyListing(accessToken: string, listingId: string) {
  return apiRequest<MarketListingsResponse>(`/api/market/listings/${listingId}/buy`, {
    method: "POST",
    accessToken,
  });
}

export function cancelListing(accessToken: string, listingId: string) {
  return apiRequest<MarketListingsResponse>(`/api/market/listings/${listingId}/cancel`, {
    method: "POST",
    accessToken,
  });
}
