import Decimal from "decimal.js";

export type SkillBranchId = "attack" | "defense" | "capture" | "gold" | "xp";

export interface SkillBranchConfig {
  id: SkillBranchId;
  label: string;
  description: string;
  icon: string;
  boostPerTier: number;
}

export const SKILL_TREE_TIERS_PER_BRANCH = 4;

export const SKILL_TREE_BRANCHES: SkillBranchConfig[] = [
  { id: "attack", label: "Attaque", description: "+3% de dégâts infligés par palier", icon: "⚔️", boostPerTier: 0.03 },
  { id: "defense", label: "Vitalité", description: "-3% de dégâts subis par palier", icon: "❤️", boostPerTier: 0.03 },
  { id: "capture", label: "Capture", description: "+5% de taux de capture par palier", icon: "🎯", boostPerTier: 0.05 },
  { id: "gold", label: "Fortune", description: "+10% d'or gagné par palier", icon: "💰", boostPerTier: 0.1 },
  { id: "xp", label: "Sagesse", description: "+10% d'XP gagnée par palier", icon: "✨", boostPerTier: 0.1 },
];

export const SKILL_TREE_BRANCH_IDS: SkillBranchId[] = SKILL_TREE_BRANCHES.map((b) => b.id);
export const SKILL_TREE_TOTAL_NODES = SKILL_TREE_BRANCHES.length * SKILL_TREE_TIERS_PER_BRANCH;

/** How many League skill points a rank-clear grants — one per victory over the whole
 * roster, spent one node at a time on whichever branch the player chooses. */
export const LEAGUE_SKILL_POINTS_PER_CLEAR = 1;

export function isValidSkillBranch(value: string): value is SkillBranchId {
  return (SKILL_TREE_BRANCH_IDS as string[]).includes(value);
}

export interface SkillTreeBonuses {
  attack: Decimal;
  defense: Decimal;
  capture: number;
  gold: number;
  xp: number;
}

function tierOf(tiers: Partial<Record<SkillBranchId, number>>, branch: SkillBranchId): number {
  return Math.min(tiers[branch] ?? 0, SKILL_TREE_TIERS_PER_BRANCH);
}

const BOOST_PER_TIER: Record<SkillBranchId, number> = Object.fromEntries(
  SKILL_TREE_BRANCHES.map((b) => [b.id, b.boostPerTier]),
) as Record<SkillBranchId, number>;

/** Permanent global boosts from the League skill tree, derived from how many tiers the
 * player has unlocked in each branch. Attack/gold/xp are multiplicative bonuses; defense
 * linearly reduces damage taken (capped at 4 tiers * 3% = 12%, so it can never go
 * negative); capture is meant to be multiplied directly into a pokéball's catch
 * multiplier at the call site, same idiom as the ball's own multiplier. */
export function computeSkillTreeBonuses(tiers: Partial<Record<SkillBranchId, number>>): SkillTreeBonuses {
  return {
    attack: new Decimal(1).plus(new Decimal(BOOST_PER_TIER.attack).mul(tierOf(tiers, "attack"))),
    defense: new Decimal(1).minus(new Decimal(BOOST_PER_TIER.defense).mul(tierOf(tiers, "defense"))),
    capture: 1 + BOOST_PER_TIER.capture * tierOf(tiers, "capture"),
    gold: 1 + BOOST_PER_TIER.gold * tierOf(tiers, "gold"),
    xp: 1 + BOOST_PER_TIER.xp * tierOf(tiers, "xp"),
  };
}

/** The Charme Shiny reward unlocks once every branch is maxed out (20 points total). */
export function isSkillTreeComplete(tiers: Partial<Record<SkillBranchId, number>>): boolean {
  return SKILL_TREE_BRANCH_IDS.every((branch) => tierOf(tiers, branch) >= SKILL_TREE_TIERS_PER_BRANCH);
}
