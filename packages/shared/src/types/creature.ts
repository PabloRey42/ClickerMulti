import type { ElementalType } from "../world/species.js";

export interface SpeciesView {
  key: string;
  name: string;
  dexNumber: number;
  elementalType: ElementalType;
  baseAttack: number;
  baseHp: number;
  spriteFile: string;
}

export interface PlayerCreatureView {
  id: string;
  speciesKey: string;
  name: string;
  dexNumber: number;
  elementalType: ElementalType;
  spriteFile: string;
  nickname: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  isOnTeam: boolean;
  isActive: boolean;
  caughtAt: string;
}

export interface WildEncounterView {
  routeKey: string;
  speciesKey: string;
  name: string;
  elementalType: ElementalType;
  spriteFile: string;
  level: number;
  currentHp: number;
  maxHp: number;
}
