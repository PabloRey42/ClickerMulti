export type QuestObjectiveType =
  | "visit_world_map"
  | "enter_route"
  | "win_battle"
  | "capture_creature"
  | "open_collection"
  | "open_shop"
  | "open_market"
  | "heal_at_center"
  | "own_potion";

export interface QuestObjective {
  key: string;
  type: QuestObjectiveType;
  description: string;
  target: number;
}

export interface QuestReward {
  goldReward: bigint;
  unlockAutoHeal?: boolean;
  unlockAutoCapture?: boolean;
}

export interface QuestConfig {
  key: string;
  /** Which POI hotspot (in world/lumina.ts) the NPC giving this quest stands at. */
  npcHotspotId: string;
  npcName: string;
  title: string;
  description: string;
  /** Must be COMPLETED before this quest becomes available. */
  prerequisiteQuestKey?: string;
  objectives: QuestObjective[];
  reward: QuestReward;
}

/** Quests auto-activate once unlocked (no separate "accept" step) and auto-complete +
 * auto-grant their reward the moment every objective hits its target — talking to the NPC
 * is purely informational (title/description/live progress/reward), not a required step. */
export const QUEST_CATALOG: Record<string, QuestConfig> = {
  tutorial: {
    key: "tutorial",
    npcHotspotId: "aurora-parc",
    npcName: "Léa",
    title: "Premiers pas à Aurora",
    description:
      "Découvre les bases de la ville : consulte la carte du monde, explore une route, remporte un combat, jette un œil à ton Pokédex et visite le Marché Artisanal.",
    objectives: [
      { key: "visit_world_map", type: "visit_world_map", description: "Consulte la carte du monde", target: 1 },
      { key: "enter_route", type: "enter_route", description: "Explore une route ou un donjon", target: 1 },
      { key: "win_battle", type: "win_battle", description: "Remporte un combat", target: 1 },
      { key: "open_collection", type: "open_collection", description: "Consulte ton Pokédex", target: 1 },
      { key: "open_shop", type: "open_shop", description: "Visite le Marché Artisanal", target: 1 },
    ],
    reward: { goldReward: 150n },
  },
  potion_master: {
    key: "potion_master",
    npcHotspotId: "aurora-bibliotheque",
    npcName: "Professeure Ivy",
    title: "L'art de la potion",
    description:
      "Apprends à soigner ton équipe efficacement pour débloquer le soin automatique en fin de combat.",
    prerequisiteQuestKey: "tutorial",
    objectives: [
      { key: "own_potion", type: "own_potion", description: "Achète au moins une potion", target: 1 },
      { key: "heal_at_center", type: "heal_at_center", description: "Soigne ton équipe au Centre Pokémon", target: 1 },
    ],
    reward: { goldReward: 100n, unlockAutoHeal: true },
  },
  ball_master: {
    key: "ball_master",
    npcHotspotId: "aurora-gare",
    npcName: "Dresseur Max",
    title: "Lancer parfait",
    description:
      "Prouve ton talent de dresseur en capturant plusieurs Pokémon pour débloquer la capture automatique.",
    prerequisiteQuestKey: "potion_master",
    objectives: [
      { key: "capture_creature", type: "capture_creature", description: "Capture 3 Pokémon", target: 3 },
      {
        key: "enter_route_thrice",
        type: "enter_route",
        description: "Explore une route ou un donjon 3 fois",
        target: 3,
      },
    ],
    reward: { goldReward: 200n, unlockAutoCapture: true },
  },
};
