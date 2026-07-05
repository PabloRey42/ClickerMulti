import { create } from "zustand";
import type { PlayerCreatureView } from "@farm-clicker/shared";
import { listCreatures } from "../api/creatures";

interface TeamState {
  creatures: PlayerCreatureView[];
  refresh: (accessToken: string) => Promise<void>;
}

/** Backs the always-visible team sidebar. Any screen that mutates a creature (battle,
 * collection, starter pick) should call refresh() afterward to keep it in sync. */
export const useTeamStore = create<TeamState>((set) => ({
  creatures: [],
  refresh: async (accessToken) => {
    try {
      const creatures = await listCreatures(accessToken);
      set({ creatures });
    } catch {
      // best-effort — sidebar just keeps showing the last known roster
    }
  },
}));
