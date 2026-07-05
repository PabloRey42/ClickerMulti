import type { CreatureType } from "../game/combat.js";

export interface WildEncounterView {
  speciesId: string;
  speciesName: string;
  type: CreatureType;
  currentHp: bigint;
  maxHp: bigint;
}

export interface CreatureView {
  id: string;
  speciesId: string;
  speciesName: string;
  type: CreatureType;
  level: number;
  xp: bigint;
  xpToNextLevel: bigint;
  attack: bigint;
  canEvolveInto: string | null;
}

export interface BattleStateResponse {
  currencyBalance: bigint;
  totalAutoAttack: bigint;
  encounter: WildEncounterView;
}

export interface EvolutionEvent {
  creatureId: string;
  fromSpeciesName: string;
  toSpeciesName: string;
}

export interface AttackResponse {
  damageDealt: bigint;
  encounter: WildEncounterView;
  defeated: boolean;
  captured: boolean;
  goldEarned: bigint;
  evolutions: EvolutionEvent[];
}

export type CollectionResponse = CreatureView[];
