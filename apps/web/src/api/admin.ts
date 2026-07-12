import type {
  AdminUserListResponse,
  AdminUserDetail,
  RaidLobbySnapshot,
  AdminRaidLobbySummary,
} from "@farm-clicker/shared";
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

export function setAdminShinyCharm(accessToken: string, userId: string, enabled: boolean) {
  return apiRequest<AdminUserDetail>(`/api/admin/users/${userId}/shiny-charm`, {
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

/** Every currently active raid lobby across every hotspot, so the admin panel can list real
 * lobby ids to act on instead of requiring them to be copied from a URL or server logs. */
export function listAdminRaidLobbies(accessToken: string) {
  return apiRequest<AdminRaidLobbySummary[]>("/api/admin/raids", { accessToken });
}

/** QA escape hatch: fast-forwards a raid lobby's current deadline (auto-start while
 * WAITING, or the battle timer while IN_PROGRESS) and resolves it immediately — avoids
 * waiting out real 2min/3min timers on every playtest iteration. */
export function forceRaidLobbyTimeout(accessToken: string, lobbyId: string) {
  return apiRequest<RaidLobbySnapshot>(`/api/admin/raids/${lobbyId}/force-timeout`, {
    method: "PATCH",
    accessToken,
  });
}

/** QA escape hatch: directly sets the shared boss HP (e.g. down to 0 to instantly test the
 * victory/capture-roll/animation flow without grinding the real HP pool). */
export function setAdminRaidBossHp(accessToken: string, lobbyId: string, bossCurrentHp: number) {
  return apiRequest<RaidLobbySnapshot>(`/api/admin/raids/${lobbyId}/set-boss-hp`, {
    method: "PATCH",
    accessToken,
    body: { bossCurrentHp },
  });
}
