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
