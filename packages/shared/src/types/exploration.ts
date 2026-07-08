import type { PlayerCreatureView, WildEncounterView } from "./creature.js";
import type { EvolutionStep } from "../game/evolution.js";

export interface ExplorationStateResponse {
  goldBalance: bigint;
  activeCreature: PlayerCreatureView | null;
  encounter: WildEncounterView | null;
  autoHealEnabled: boolean;
  autoHealUnlocked: boolean;
  autoCaptureEnabled: boolean;
  autoCaptureUnlocked: boolean;
}

export interface ShinyCaptureInfo {
  name: string;
  spriteFile: string;
}

export interface AttackResponse {
  state: ExplorationStateResponse;
  damageDealt: number;
  damageTaken: number;
  victory: boolean;
  fainted: boolean;
  /** True if a healthy teammate can take over so the fight continues instead of ending. */
  canSwitch: boolean;
  /** True if this attack just cleared a League run (whole trainer roster defeated). */
  leagueCleared: boolean;
  /** Set when auto-capture just landed on a shiny — the client shows the same big reveal
   * as a manual shiny capture, so AFK/autoclicker farming can't silently skip past it. */
  capturedShiny: ShinyCaptureInfo | null;
  /** True if the XP granted by this attack (via an auto-capture/auto-finish branch) leveled
   * up the active creature. */
  leveledUp: boolean;
  /** Evolution step(s) the active creature's speciesKey just underwent, in order (usually
   * one, but a big multi-level jump can cross two thresholds at once). Empty if none. */
  evolution: EvolutionStep[];
}

export interface CaptureResponse {
  success: boolean;
  state: ExplorationStateResponse;
  creature: PlayerCreatureView | null;
  xpGained: number;
  leveledUp: boolean;
  evolution: EvolutionStep[];
}

export interface FinishEncounterResponse {
  state: ExplorationStateResponse;
  goldGained: bigint;
  xpGained: number;
  leveledUp: boolean;
  evolution: EvolutionStep[];
}
