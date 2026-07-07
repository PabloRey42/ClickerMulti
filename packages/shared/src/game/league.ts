import Decimal from "decimal.js";
import { MAX_LEVEL } from "./constants.js";

export const LEAGUE_ROSTER_SIZE = 6;
export const LEAGUE_BASE_LEVEL = 40;
export const LEAGUE_LEVEL_PER_RANK = 4;
export const LEAGUE_RANK_BONUS_PER_RANK = 0.02;

/** Rank 12 is a hardcoded spike to level 200, bypassing both the normal linear curve and
 * the MAX_LEVEL cap — trainer Pokémon aren't player-owned creatures, so nothing stops a
 * single rank from jumping the curve. Every other rank uses the normal formula. */
const LEAGUE_LEVEL_SPIKE_RANK = 12;
const LEAGUE_LEVEL_SPIKE_LEVEL = 200;

export interface LeagueOpponent {
  speciesKey: string;
  level: number;
}

export function leagueOpponentLevel(rank: number): number {
  if (rank === LEAGUE_LEVEL_SPIKE_RANK) return LEAGUE_LEVEL_SPIKE_LEVEL;
  return Math.min(MAX_LEVEL, LEAGUE_BASE_LEVEL + rank * LEAGUE_LEVEL_PER_RANK);
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
