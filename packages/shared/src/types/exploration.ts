import type { PlayerCreatureView, WildEncounterView } from "./creature.js";

export interface ExplorationStateResponse {
  goldBalance: bigint;
  activeCreature: PlayerCreatureView | null;
  encounter: WildEncounterView | null;
}

export interface AttackResponse {
  state: ExplorationStateResponse;
  damageDealt: number;
  damageTaken: number;
  victory: boolean;
  fainted: boolean;
  /** True if a healthy teammate can take over so the fight continues instead of ending. */
  canSwitch: boolean;
}

export interface CaptureResponse {
  success: boolean;
  state: ExplorationStateResponse;
  creature: PlayerCreatureView | null;
}

export interface FinishEncounterResponse {
  state: ExplorationStateResponse;
  goldGained: bigint;
  xpGained: number;
}
