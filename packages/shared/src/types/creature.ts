import type { ElementalType } from "../world/species.js";

export interface SpeciesView {
  key: string;
  name: string;
  elementalType: ElementalType;
  baseAttack: number;
  baseHp: number;
}

export interface PlayerCreatureView {
  id: string;
  speciesKey: string;
  name: string;
  elementalType: ElementalType;
  nickname: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  isActive: boolean;
  caughtAt: string;
}

export interface WildEncounterView {
  routeKey: string;
  speciesKey: string;
  name: string;
  elementalType: ElementalType;
  level: number;
  currentHp: number;
  maxHp: number;
}
