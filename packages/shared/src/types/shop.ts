export interface PokeballCatalogEntry {
  key: string;
  name: string;
  catchMultiplier: number;
  goldCost: bigint;
  owned: number;
}

export interface ShopCatalogResponse {
  goldBalance: bigint;
  pokeballs: PokeballCatalogEntry[];
}

export interface BuyPokeballResponse {
  goldBalance: bigint;
  itemKey: string;
  owned: number;
}
