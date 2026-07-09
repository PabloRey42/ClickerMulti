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

/** The 12 numbered routes of the Mont Cendré region (see world/lumina.ts). */
const CENDRE_ROUTE_KEYS = Array.from({ length: 12 }, (_, i) => `cendre-route-${i + 2}`);
const CENDRE_ROUTES_LOWER = CENDRE_ROUTE_KEYS.slice(0, 6); // routes 2-7
const CENDRE_ROUTES_UPPER = CENDRE_ROUTE_KEYS.slice(6); // routes 8-13

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

  // ============================================================================
  // Mont Cendré — épreuves de fin de jeu, volontairement TRÈS TRÈS dures.
  // Chaîne linéaire (une quête active à la fois), récompenses en or colossales.
  // ============================================================================
  cendre_ascension: {
    key: "cendre_ascension",
    npcHotspotId: "cendre-gare",
    npcName: "Maître Ignis",
    title: "L'Ascension du Mont Cendré",
    description:
      "Prouve que tu mérites de gravir le volcan : remporte 250 combats sur chacune des routes basses du Mont Cendré (Routes 2 à 7).",
    objectives: CENDRE_ROUTES_LOWER.map((routeKey) => ({
      key: `asc_${routeKey}`,
      type: "win_battle_on_route" as const,
      description: `250 victoires sur la ${routeKey.replace("cendre-route-", "Route ")}`,
      target: 250,
      routeKey,
    })),
    reward: { goldReward: 100000n },
  },
  cendre_conquete: {
    key: "cendre_conquete",
    npcHotspotId: "cendre-maison-strategie",
    npcName: "Stratège Obsidienne",
    title: "Conquérant des Hauteurs",
    description:
      "Les routes hautes grouillent de Pokémon surpuissants. Remporte 250 combats sur chacune des Routes 8 à 13.",
    prerequisiteQuestKey: "cendre_ascension",
    objectives: CENDRE_ROUTES_UPPER.map((routeKey) => ({
      key: `conq_${routeKey}`,
      type: "win_battle_on_route" as const,
      description: `250 victoires sur la ${routeKey.replace("cendre-route-", "Route ")}`,
      target: 250,
      routeKey,
    })),
    reward: { goldReward: 250000n },
  },
  cendre_dresseur_dragon: {
    key: "cendre_dresseur_dragon",
    npcHotspotId: "cendre-bibliotheque",
    npcName: "Archiviste Draconis",
    title: "Le Dresseur de Dragons",
    description:
      "La Route 13 est le repaire des dragons du Mont Cendré. Domine-les 1 000 fois et capture 100 Pokémon pour graver ton nom dans les légendes.",
    prerequisiteQuestKey: "cendre_conquete",
    objectives: [
      {
        key: "dragon_route_13",
        type: "win_battle_on_route",
        description: "1 000 victoires sur la Route 13 (dragons)",
        target: 1000,
        routeKey: "cendre-route-13",
      },
      { key: "dragon_captures", type: "capture_creature", description: "Capture 100 Pokémon", target: 100 },
    ],
    reward: { goldReward: 500000n },
  },
  cendre_legende: {
    key: "cendre_legende",
    npcHotspotId: "cendre-autel-eclairs",
    npcName: "Gardien de l'Autel",
    title: "Légende du Mont Cendré",
    description:
      "Seuls les dresseurs éternels atteignent l'Autel des Éclairs. Remporte 25 000 combats et capture 300 Pokémon.",
    prerequisiteQuestKey: "cendre_dresseur_dragon",
    objectives: [
      { key: "legend_wins", type: "win_battle", description: "Remporte 25 000 combats", target: 25000 },
      { key: "legend_captures", type: "capture_creature", description: "Capture 300 Pokémon", target: 300 },
    ],
    reward: { goldReward: 1000000n },
  },
  cendre_perfection: {
    key: "cendre_perfection",
    npcHotspotId: "cendre-autel-eclairs",
    npcName: "Gardien de l'Autel",
    title: "Perfection Absolue",
    description:
      "L'ultime épreuve : deviens le maître incontesté du Mont Cendré en remportant 2 000 combats sur CHACUNE de ses 12 routes. Presque personne n'y parviendra.",
    prerequisiteQuestKey: "cendre_legende",
    objectives: CENDRE_ROUTE_KEYS.map((routeKey) => ({
      key: `perf_${routeKey}`,
      type: "win_battle_on_route" as const,
      description: `2 000 victoires sur la ${routeKey.replace("cendre-route-", "Route ")}`,
      target: 2000,
      routeKey,
    })),
    reward: { goldReward: 5000000n },
  },
};
