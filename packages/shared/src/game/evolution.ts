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

/** Every intermediate evolution step from `fromSpeciesKey` up to `toSpeciesKey`, walking the
 * linear `evolution.intoKey` chain. Used to animate a creature that caught up **several** stages
 * at once (e.g. a base form that already had the level for its final form): it returns each step
 * (base→mid, mid→final) so the reveal plays both, instead of a single base→final jump that skips
 * the middle form. Falls back to a direct from→to step if the chain can't be walked (data
 * safety) so a reveal is never silently dropped; returns [] only when from === to. */
export function resolveEvolutionPath(fromSpeciesKey: string, toSpeciesKey: string): EvolutionStep[] {
  const steps: EvolutionStep[] = [];
  let current = fromSpeciesKey;
  for (let i = 0; i < 10 && current !== toSpeciesKey; i++) {
    const evo = SPECIES_CATALOG[current]?.evolution;
    if (!evo) break;
    steps.push({ fromSpeciesKey: current, toSpeciesKey: evo.intoKey });
    current = evo.intoKey;
  }
  if (current !== toSpeciesKey) {
    return fromSpeciesKey === toSpeciesKey ? [] : [{ fromSpeciesKey, toSpeciesKey }];
  }
  return steps;
}

/** Resolves a player-initiated stone evolution: does `speciesKey` have a stone-evolution
 * option for this exact `stoneKey`? Returns the target speciesKey, or null if this species
 * has no such option (wrong stone, or a species with no stone evolutions at all). */
export function resolveStoneEvolution(speciesKey: string, stoneKey: string): string | null {
  const options = SPECIES_CATALOG[speciesKey]?.stoneEvolutions;
  return options?.find((o) => o.stoneKey === stoneKey)?.intoKey ?? null;
}
