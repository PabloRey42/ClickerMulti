export interface PokeballCatalogEntry {
  key: string;
  name: string;
  catchMultiplier: number;
  goldCost: bigint;
  spriteFile: string;
  owned: number;
}

export interface PotionCatalogEntry {
  key: string;
  name: string;
  healAmount: number;
  goldCost: bigint;
  spriteFile: string;
  owned: number;
}

export interface StoneCatalogEntry {
  key: string;
  name: string;
  goldCost: bigint;
  spriteFile: string;
  owned: number;
}

export interface ShopCatalogResponse {
  goldBalance: bigint;
  pokeballs: PokeballCatalogEntry[];
  potions: PotionCatalogEntry[];
  stones: StoneCatalogEntry[];
}

export interface BuyItemResponse {
  goldBalance: bigint;
  itemKey: string;
  owned: number;
}
