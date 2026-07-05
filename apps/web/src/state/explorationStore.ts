import { create } from "zustand";

type ExplorationScreen = { view: "world" } | { view: "city"; cityId: string };

interface ExplorationState {
  screen: ExplorationScreen;
  transitioning: boolean;
  goToCity: (cityId: string) => void;
  goToWorld: () => void;
}

const TRANSITION_MS = 350;

export const useExplorationStore = create<ExplorationState>((set) => ({
  screen: { view: "world" },
  transitioning: false,
  goToCity: (cityId) => {
    set({ transitioning: true });
    setTimeout(() => set({ screen: { view: "city", cityId }, transitioning: false }), TRANSITION_MS);
  },
  goToWorld: () => {
    set({ transitioning: true });
    setTimeout(() => set({ screen: { view: "world" }, transitioning: false }), TRANSITION_MS);
  },
}));
