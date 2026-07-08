import { create } from "zustand";
import type { EvolutionStep } from "@farm-clicker/shared";

export interface QueuedEvolution {
  step: EvolutionStep;
  isShiny: boolean;
  /** Distinguishes queue entries with the same step/shininess (e.g. two creatures of the
   * same species evolving in the same retroactive batch) so React keys stay unique. */
  queuedAt: number;
}

interface EvolutionQueueState {
  queue: QueuedEvolution[];
  enqueue: (items: { step: EvolutionStep; isShiny: boolean }[]) => void;
  dequeue: () => void;
}

// Module-level counter rather than Date.now() — guarantees unique React keys even across
// calls that land in the same millisecond (e.g. a big retroactive batch on login).
let nextQueuedAt = 0;

/** Single global queue so an evolution triggered live in battle and a batch of retroactive
 * evolutions caught up on login (see App.tsx) never try to render two overlays at once —
 * whichever fires first queues, the rest wait their turn. */
export const useEvolutionStore = create<EvolutionQueueState>((set) => ({
  queue: [],
  enqueue: (items) =>
    set((s) => {
      if (items.length === 0) return s;
      return { queue: [...s.queue, ...items.map((item) => ({ ...item, queuedAt: nextQueuedAt++ }))] };
    }),
  dequeue: () => set((s) => ({ queue: s.queue.slice(1) })),
}));
