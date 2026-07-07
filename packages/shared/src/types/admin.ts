import type { PlayerCreatureView } from "./creature.js";
import type { SkillBranchId } from "../game/skillTree.js";

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

export interface AdminSkillBranchView {
  branch: SkillBranchId;
  tier: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  goldBalance: bigint;
  autoHealEnabled: boolean;
  forceShinyMode: boolean;
  hasShinyCharm: boolean;
  leagueRank: number;
  unspentPoints: number;
  creatures: PlayerCreatureView[];
  inventoryItems: AdminInventoryItemView[];
  skillTree: AdminSkillBranchView[];
}

export interface AdminUserListResponse {
  users: AdminUserSummary[];
}
