import { create } from "zustand";
import type { PlayerCreatureView } from "@farm-clicker/shared";
import { listCreatures, reorderTeam as reorderTeamApi } from "../api/creatures";

interface TeamState {
  creatures: PlayerCreatureView[];
  refresh: (accessToken: string) => Promise<void>;
  reorderTeam: (accessToken: string, orderedCreatureIds: string[]) => Promise<void>;
}

/** Backs the always-visible team sidebar. Any screen that mutates a creature (battle,
 * collection, starter pick) should call refresh() afterward to keep it in sync. */
export const useTeamStore = create<TeamState>((set, get) => ({
  creatures: [],
  refresh: async (accessToken) => {
    try {
      const creatures = await listCreatures(accessToken);
      set({ creatures });
    } catch {
      // best-effort — sidebar just keeps showing the last known roster
    }
  },
  reorderTeam: async (accessToken, orderedCreatureIds) => {
    const previous = get().creatures;
    const byId = new Map(previous.map((c) => [c.id, c]));
    const reordered = orderedCreatureIds
      .map((id, index) => {
        const creature = byId.get(id);
        return creature ? { ...creature, isActive: index === 0 } : null;
      })
      .filter((c): c is PlayerCreatureView => c !== null);
    const rest = previous.filter((c) => !c.isOnTeam);
    // Optimistic: the drop already looks right instantly, the server call below just
    // confirms it (or reverts on failure).
    set({ creatures: [...reordered, ...rest] });
    try {
      const creatures = await reorderTeamApi(accessToken, orderedCreatureIds);
      set({ creatures });
    } catch {
      set({ creatures: previous });
    }
  },
}));
