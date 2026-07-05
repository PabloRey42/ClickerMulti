import type { ElementalType } from "../world/species.js";
import type { PlayerCreatureView } from "./creature.js";

export interface AdminUserSummary {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  goldBalance: bigint;
  creatureCount: number;
  leagueRank: number;
}

export interface AdminInventoryItemView {
  itemKey: string;
  quantity: number;
}

export interface AdminSpecializationView {
  elementalType: ElementalType;
  pointsInvested: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  goldBalance: bigint;
  autoHealEnabled: boolean;
  leagueRank: number;
  unspentPoints: number;
  creatures: PlayerCreatureView[];
  inventoryItems: AdminInventoryItemView[];
  specializations: AdminSpecializationView[];
}

export interface AdminUserListResponse {
  users: AdminUserSummary[];
}
