export type MarketAssetType = "ITEM" | "CREATURE";
export type MarketListingStatus = "ACTIVE" | "SOLD" | "CANCELLED";

export interface MarketListingView {
  id: string;
  sellerId: string;
  sellerUsername: string;
  assetType: MarketAssetType;
  itemKey: string | null;
  itemName: string | null;
  quantity: number | null;
  creatureId: string | null;
  creatureName: string | null;
  creatureSpriteFile: string | null;
  creatureLevel: number | null;
  askGoldPrice: bigint;
  status: MarketListingStatus;
  createdAt: string;
  isMine: boolean;
}

export interface MarketListingsResponse {
  goldBalance: bigint;
  listings: MarketListingView[];
}

export interface CreateListingRequest {
  assetType: MarketAssetType;
  itemKey?: string;
  quantity?: number;
  creatureId?: string;
  askGoldPrice: string;
}
