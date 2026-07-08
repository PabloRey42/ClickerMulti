import { SPECIES_CATALOG } from "../world/species.js";

export interface EvolutionStep {
  fromSpeciesKey: string;
  toSpeciesKey: string;
}

/** Walks a species' evolution chain as far as `level` allows, returning every threshold
 * crossed in order. Handles a creature leveling up multiple stages in a single XP grant
 * (e.g. a big multi-level jump), and doubles as the retroactive check for creatures that
 * predate this feature and are already past a threshold they never evolved at. Returns []
 * if the species has no evolution or hasn't reached the next one yet. */
export function resolveEvolutionSteps(speciesKey: string, level: number): EvolutionStep[] {
  const steps: EvolutionStep[] = [];
  let current = speciesKey;
  // A real chain is at most 2 stages deep; this cap only guards against a future data bug
  // (e.g. an accidental evolution cycle) turning into an infinite loop.
  for (let i = 0; i < 10; i++) {
    const evo = SPECIES_CATALOG[current]?.evolution;
    if (!evo || level < evo.level) break;
    steps.push({ fromSpeciesKey: current, toSpeciesKey: evo.intoKey });
    current = evo.intoKey;
  }
  return steps;
}
