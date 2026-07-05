export interface PotionConfig {
  key: string;
  name: string;
  /** HP restored; a value far above any realistic max HP acts as a full heal. */
  healAmount: number;
  goldCost: bigint;
  /** Filename under /items/ in the web app's public assets. */
  spriteFile: string;
}

export const POTION_CATALOG: Record<string, PotionConfig> = {
  potion: {
    key: "potion",
    name: "Potion",
    healAmount: 20,
    goldCost: 10n,
    spriteFile: "potion.png",
  },
  super_potion: {
    key: "super_potion",
    name: "Super Potion",
    healAmount: 60,
    goldCost: 35n,
    spriteFile: "super_potion.png",
  },
  max_potion: {
    key: "max_potion",
    name: "Potion Max",
    healAmount: 9999,
    goldCost: 100n,
    spriteFile: "max_potion.png",
  },
};
