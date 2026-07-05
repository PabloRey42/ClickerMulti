import type { ShopCatalogResponse, BuyItemResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getShopCatalog(accessToken: string) {
  return apiRequest<ShopCatalogResponse>("/api/shop/pokeballs", { accessToken });
}

export function buyItem(accessToken: string, key: string) {
  return apiRequest<BuyItemResponse>(`/api/shop/items/${key}/buy`, {
    method: "POST",
    accessToken,
  });
}
