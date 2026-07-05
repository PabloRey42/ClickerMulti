export interface GeneratorView {
  key: string;
  name: string;
  cost: bigint;
  baseProduction: bigint;
  owned: number;
}

export interface FarmStateResponse {
  resourceBalance: bigint;
  affectionBalance: bigint;
  productionPerSec: bigint;
  comboStacks: number;
  comboMultiplier: string;
  generators: GeneratorView[];
}

export interface ClickResponse {
  state: FarmStateResponse;
  gain: bigint;
}

export interface BuyGeneratorResponse {
  state: FarmStateResponse;
  cost: bigint;
}
