import type { ElementalType } from "../world/species.js";
import type { EvolutionStep } from "../game/evolution.js";

export interface SpeciesView {
  key: string;
  name: string;
  dexNumber: number;
  types: ElementalType[];
  baseAttack: number;
  baseHp: number;
  spriteFile: string;
}

export interface PlayerCreatureView {
  id: string;
  speciesKey: string;
  name: string;
  dexNumber: number;
  types: ElementalType[];
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
  isShiny: boolean;
  caughtAt: string;
  /** Evolution step(s) this creature's speciesKey just caught up to on this fetch — only
   * ever non-empty from `listCreatures`, which retroactively evolves any creature whose
   * level already qualifies (e.g. a high-level creature caught before this feature shipped).
   * Empty everywhere else. See EvolutionAnimation.tsx for how the client queues these. */
  evolvedNow: EvolutionStep[];
}

export interface WildEncounterView {
  routeKey: string;
  speciesKey: string;
  name: string;
  types: ElementalType[];
  spriteFile: string;
  level: number;
  currentHp: number;
  maxHp: number;
  isShiny: boolean;
  isLeagueBattle: boolean;
  /** Identifies this particular encounter instance (changes every reroll, even for a
   * repeated species/level) so the client can detect "a genuinely new encounter just
   * appeared" and trigger the shiny reveal exactly once instead of on every re-fetch. */
  startedAt: string;
}
