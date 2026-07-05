-- CreateEnum
CREATE TYPE "MarketAssetType" AS ENUM ('ITEM', 'CREATURE');

-- CreateEnum
CREATE TYPE "MarketListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- CreateTable
CREATE TABLE "MarketListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "assetType" "MarketAssetType" NOT NULL,
    "itemKey" TEXT,
    "quantity" INTEGER,
    "creatureId" TEXT,
    "askGoldPrice" BIGINT NOT NULL,
    "status" "MarketListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "MarketListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketListing_sellerId_idx" ON "MarketListing"("sellerId");

-- CreateIndex
CREATE INDEX "MarketListing_status_idx" ON "MarketListing"("status");

-- AddForeignKey
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_creatureId_fkey" FOREIGN KEY ("creatureId") REFERENCES "PlayerCreature"("id") ON DELETE SET NULL ON UPDATE CASCADE;
