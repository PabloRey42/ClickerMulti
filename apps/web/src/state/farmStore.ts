import { create } from "zustand";
import type { FarmStateResponse } from "@farm-clicker/shared";

interface FarmStoreState {
  farmState: FarmStateResponse | null;
  lastGain: bigint | null;
  clickCount: number;
  setFarmState: (state: FarmStateResponse) => void;
  applyClick: (state: FarmStateResponse, gain: bigint) => void;
}

export const useFarmStore = create<FarmStoreState>((set, get) => ({
  farmState: null,
  lastGain: null,
  clickCount: 0,
  setFarmState: (farmState) => set({ farmState }),
  applyClick: (farmState, gain) =>
    set({ farmState, lastGain: gain, clickCount: get().clickCount + 1 }),
}));
