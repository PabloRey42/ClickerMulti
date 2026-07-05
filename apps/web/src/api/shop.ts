import type { ShopCatalogResponse, BuyPokeballResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getShopCatalog(accessToken: string) {
  return apiRequest<ShopCatalogResponse>("/api/shop/pokeballs", { accessToken });
}

export function buyPokeball(accessToken: string, key: string) {
  return apiRequest<BuyPokeballResponse>(`/api/shop/pokeballs/${key}/buy`, {
    method: "POST",
    accessToken,
  });
}
