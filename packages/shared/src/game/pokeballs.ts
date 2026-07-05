export interface PokeballConfig {
  key: string;
  name: string;
  catchMultiplier: number;
  goldCost: bigint;
}

export const POKEBALL_CATALOG: Record<string, PokeballConfig> = {
  pokeball_basic: {
    key: "pokeball_basic",
    name: "Balle Basique",
    catchMultiplier: 1,
    goldCost: 15n,
  },
  pokeball_super: {
    key: "pokeball_super",
    name: "Super Balle",
    catchMultiplier: 1.5,
    goldCost: 60n,
  },
  pokeball_hyper: {
    key: "pokeball_hyper",
    name: "Hyper Balle",
    catchMultiplier: 2.5,
    goldCost: 200n,
  },
};
