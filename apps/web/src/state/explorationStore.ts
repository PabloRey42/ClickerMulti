import { create } from "zustand";

export type EncounterReturnTarget = { view: "city"; cityId: string } | { view: "league" };

type ExplorationScreen =
  | { view: "world" }
  | { view: "city"; cityId: string }
  | { view: "league" }
  | { view: "encounter"; returnTo: EncounterReturnTarget };

interface ExplorationState {
  screen: ExplorationScreen;
  transitioning: boolean;
  goToCity: (cityId: string) => void;
  goToWorld: () => void;
  goToLeague: () => void;
  goToEncounter: (returnTo: EncounterReturnTarget) => void;
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
  goToLeague: () => {
    set({ transitioning: true });
    setTimeout(() => set({ screen: { view: "league" }, transitioning: false }), TRANSITION_MS);
  },
  goToEncounter: (returnTo) => {
    set({ transitioning: true });
    setTimeout(() => set({ screen: { view: "encounter", returnTo }, transitioning: false }), TRANSITION_MS);
  },
}));
