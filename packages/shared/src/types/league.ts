import type { SkillBranchId } from "../game/skillTree.js";

export interface LeagueOpponentPreview {
  speciesKey: string;
  name: string;
  spriteFile: string;
  level: number;
}

export interface LeagueStateResponse {
  rank: number;
  unspentPoints: number;
  skillTree: Record<SkillBranchId, number>;
  hasShinyCharm: boolean;
  opponentPreview: LeagueOpponentPreview[];
  inProgress: boolean;
}
