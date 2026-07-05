import { create } from "zustand";
import type { ExplorationStateResponse } from "@farm-clicker/shared";

interface LastHit {
  damageDealt: number;
  damageTaken: number;
}

interface BattleState {
  state: ExplorationStateResponse | null;
  lastHit: LastHit | null;
  hitCount: number;
  setState: (state: ExplorationStateResponse) => void;
  applyAttack: (state: ExplorationStateResponse, damageDealt: number, damageTaken: number) => void;
  clear: () => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  state: null,
  lastHit: null,
  hitCount: 0,
  setState: (state) => set({ state }),
  applyAttack: (state, damageDealt, damageTaken) =>
    set((s) => ({ state, lastHit: { damageDealt, damageTaken }, hitCount: s.hitCount + 1 })),
  clear: () => set({ state: null, lastHit: null, hitCount: 0 }),
}));
