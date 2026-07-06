import type { AdminUserListResponse, AdminUserDetail } from "@farm-clicker/shared";
import { apiRequest } from "./client";

export function listAdminUsers(accessToken: string) {
  return apiRequest<AdminUserListResponse>("/api/admin/users", { accessToken });
}

export function getAdminUserDetail(accessToken: string, userId: string) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}`, { accessToken });
}

export function setAdminUserGold(accessToken: string, userId: string, goldBalance: string) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/gold`, {
    method: "PATCH",
    accessToken,
    body: { goldBalance },
  });
}

export function setAdminForceShiny(accessToken: string, userId: string, enabled: boolean) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/force-shiny`, {
    method: "PATCH",
    accessToken,
    body: { enabled },
  });
}

export function setAdminUserPassword(accessToken: string, userId: string, password: string) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/password`, {
    method: "PATCH",
    accessToken,
    body: { password },
  });
}

export function giveAdminCreature(accessToken: string, userId: string, speciesKey: string, level: number) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/creatures`, {
    method: "POST",
    accessToken,
    body: { speciesKey, level },
  });
}

export function setAdminCreatureShiny(accessToken: string, userId: string, creatureId: string, isShiny: boolean) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/creatures/${creatureId}/shiny`, {
    method: "PATCH",
    accessToken,
    body: { isShiny },
  });
}

export function deleteAdminCreature(accessToken: string, userId: string, creatureId: string) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/creatures/${creatureId}`, {
    method: "DELETE",
    accessToken,
  });
}

export function setAdminInventoryItem(accessToken: string, userId: string, itemKey: string, quantity: number) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/items/${itemKey}`, {
    method: "PATCH",
    accessToken,
    body: { quantity },
  });
}

export function deleteAdminUser(accessToken: string, userId: string) {
  return apiRequest<void>(`/api/admin/users/${userId}`, {
    method: "DELETE",
    accessToken,
  });
}
