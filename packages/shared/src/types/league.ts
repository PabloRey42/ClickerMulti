export interface LeagueOpponentPreview {
  speciesKey: string;
  name: string;
  spriteFile: string;
  level: number;
}

export interface LeagueStateResponse {
  rank: number;
  unspentPoints: number;
  specialization: Record<string, number>;
  opponentPreview: LeagueOpponentPreview[];
  inProgress: boolean;
}
