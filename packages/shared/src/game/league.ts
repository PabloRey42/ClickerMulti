import Decimal from "decimal.js";

export const LEAGUE_ROSTER_SIZE = 6;
export const LEAGUE_BASE_LEVEL = 40;
// Calibrated so rank 12 opponents are exactly level 200 (40 + 12 * 40/3 = 200). Trainer
// Pokémon aren't player-owned creatures, so they aren't bound by the player's MAX_LEVEL cap.
export const LEAGUE_LEVEL_PER_RANK = LEAGUE_BASE_LEVEL / 3;
export const LEAGUE_RANK_BONUS_PER_RANK = 0.02;

export interface LeagueOpponent {
  speciesKey: string;
  level: number;
}

export function leagueOpponentLevel(rank: number): number {
  return Math.round(LEAGUE_BASE_LEVEL + rank * LEAGUE_LEVEL_PER_RANK);
}

/** Deterministic given (rank, speciesKeys) so it can be recomputed at any point during a
 * run (e.g. resolving the next opponent) without persisting the roster anywhere. */
export function buildLeagueRoster(rank: number, speciesKeys: string[]): LeagueOpponent[] {
  const level = leagueOpponentLevel(rank);
  const roster: LeagueOpponent[] = [];
  for (let i = 0; i < LEAGUE_ROSTER_SIZE; i++) {
    const key = speciesKeys[(rank * 3 + i * 7) % speciesKeys.length];
    roster.push({ speciesKey: key, level });
  }
  return roster;
}

/** Permanent global combat bonus from League rank — applies to every attack, not just
 * League fights, so clearing the League makes the player stronger everywhere. */
export function leagueRankBonusMultiplier(rank: number): Decimal {
  return new Decimal(1).plus(new Decimal(LEAGUE_RANK_BONUS_PER_RANK).mul(rank));
}
