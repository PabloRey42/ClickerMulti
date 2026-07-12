import { create } from "zustand";
import type { RaidLobbySnapshot } from "@farm-clicker/shared";

interface RaidState {
  snapshot: RaidLobbySnapshot | null;
  setSnapshot: (snapshot: RaidLobbySnapshot) => void;
  clear: () => void;
}

/** Deliberately not a global animation queue like evolutionStore.ts — a raid outcome only
 * matters while the player is actively viewing that lobby (unlike evolutions, which can
 * resolve passively mid-grind and must survive until acknowledged), so victory/capture-reveal
 * sequencing lives as local state in RaidLobbyPage, not a cross-cutting queue here. */
export const useRaidStore = create<RaidState>((set) => ({
  snapshot: null,
  setSnapshot: (snapshot) => set({ snapshot }),
  clear: () => set({ snapshot: null }),
}));
