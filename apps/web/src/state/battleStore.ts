import { create } from "zustand";
import type { AttackResponse, BattleStateResponse } from "@farm-clicker/shared";

interface BattleStoreState {
  battleState: BattleStateResponse | null;
  lastAttack: AttackResponse | null;
  attackCount: number;
  setBattleState: (state: BattleStateResponse) => void;
  applyAttack: (result: AttackResponse, currencyBalance: bigint) => void;
}

export const useBattleStore = create<BattleStoreState>((set, get) => ({
  battleState: null,
  lastAttack: null,
  attackCount: 0,
  setBattleState: (battleState) => set({ battleState }),
  applyAttack: (result, currencyBalance) =>
    set({
      battleState: {
        currencyBalance,
        totalAutoAttack: get().battleState?.totalAutoAttack ?? 0n,
        encounter: result.encounter,
      },
      lastAttack: result,
      attackCount: get().attackCount + 1,
    }),
}));
