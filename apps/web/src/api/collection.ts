import type { CollectionResponse } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function getCollection(accessToken: string) {
  return apiRequest<CollectionResponse>("/api/collection", { accessToken });
}
