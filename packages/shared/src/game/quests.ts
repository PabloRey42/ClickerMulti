export type QuestObjectiveType =
  | "visit_world_map"
  | "enter_route"
  | "win_battle"
  | "win_battle_on_route"
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
  /** Only used by "win_battle_on_route" objectives — which route/dungeon this counts wins on. */
  routeKey?: string;
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
  /** Must be CLAIMED before this quest becomes available. */
  prerequisiteQuestKey?: string;
  objectives: QuestObjective[];
  reward: QuestReward;
}

const AURORA_ROUTE_KEYS = [
  "aurora-route-1",
  "aurora-route-2",
  "aurora-route-3",
  "aurora-route-4",
  "aurora-route-7",
  "aurora-route-9",
];

/** A player can only have one quest accepted at a time (see quests.service.ts). Progress
 * still tracks passively once accepted, but the reward is only granted after returning to
 * the NPC and pressing "Valider" once every objective is done. */
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
  veteran_of_battle: {
    key: "veteran_of_battle",
    npcHotspotId: "aurora-gare",
    npcName: "Dresseur Max",
    title: "Vétéran des combats",
    description: "Remporte 10 000 combats. Une épreuve de patience réservée aux dresseurs les plus déterminés.",
    prerequisiteQuestKey: "ball_master",
    objectives: [
      { key: "win_battle_10000", type: "win_battle", description: "Remporte 10 000 combats", target: 10000 },
    ],
    reward: { goldReward: 5000n },
  },
  route_conqueror: {
    key: "route_conqueror",
    npcHotspotId: "aurora-gare",
    npcName: "Dresseur Max",
    title: "Conquérant des routes",
    description: "Remporte 100 combats sur chacune des routes d'Aurora.",
    prerequisiteQuestKey: "ball_master",
    objectives: AURORA_ROUTE_KEYS.map((routeKey, i) => ({
      key: `route_${i + 1}_100`,
      type: "win_battle_on_route" as const,
      description: `100 victoires sur ${routeKey.replace("aurora-route-", "la Route ")}`,
      target: 100,
      routeKey,
    })),
    reward: { goldReward: 8000n },
  },
};
