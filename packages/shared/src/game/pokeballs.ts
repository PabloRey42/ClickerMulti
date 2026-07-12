export interface PokeballConfig {
  key: string;
  name: string;
  catchMultiplier: number;
  goldCost: bigint;
  /** Filename under /items/ in the web app's public assets. */
  spriteFile: string;
}

export const POKEBALL_CATALOG: Record<string, PokeballConfig> = {
  pokeball_basic: {
    key: "pokeball_basic",
    name: "Poké Ball",
    catchMultiplier: 1,
    goldCost: 4n,
    spriteFile: "pokeball_basic.png",
  },
  pokeball_super: {
    key: "pokeball_super",
    name: "Great Ball",
    catchMultiplier: 1.5,
    goldCost: 15n,
    spriteFile: "pokeball_super.png",
  },
  pokeball_hyper: {
    key: "pokeball_hyper",
    name: "Ultra Ball",
    catchMultiplier: 2.5,
    goldCost: 50n,
    spriteFile: "pokeball_hyper.png",
  },
};
