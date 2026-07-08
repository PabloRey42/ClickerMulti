export interface StoneConfig {
  key: string;
  name: string;
  goldCost: bigint;
  /** Filename under /items/ in the web app's public assets. */
  spriteFile: string;
}

/** Flat 2.5M gold each, matching how pokéballs/potions are priced (see pokeballs.ts/
 * potions.ts) — a deliberately steep, late-game gold sink since stones unlock evolutions
 * (Ninetales, Poliwrath, the Eeveelutions...) that the pure level-up system can never reach
 * on its own (stone/trade/friendship evolutions have no real level to copy — see
 * SpeciesConfig.evolution's doc comment in species.ts). */
export const STONE_CATALOG: Record<string, StoneConfig> = {
  pierre_feu: { key: "pierre_feu", name: "Pierre Feu", goldCost: 2_500_000n, spriteFile: "pierre_feu.png" },
  pierre_eau: { key: "pierre_eau", name: "Pierre Eau", goldCost: 2_500_000n, spriteFile: "pierre_eau.png" },
  pierre_foudre: { key: "pierre_foudre", name: "Pierre Foudre", goldCost: 2_500_000n, spriteFile: "pierre_foudre.png" },
  pierre_feuille: { key: "pierre_feuille", name: "Pierre Feuille", goldCost: 2_500_000n, spriteFile: "pierre_feuille.png" },
  pierre_soleil: { key: "pierre_soleil", name: "Pierre Soleil", goldCost: 2_500_000n, spriteFile: "pierre_soleil.png" },
};
