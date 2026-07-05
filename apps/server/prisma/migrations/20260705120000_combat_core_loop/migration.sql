-- DropForeignKey
ALTER TABLE "PlayerGenerator" DROP CONSTRAINT "PlayerGenerator_userId_fkey";
ALTER TABLE "PlayerGenerator" DROP CONSTRAINT "PlayerGenerator_generatorId_fkey";

-- DropTable
DROP TABLE "PlayerGenerator";
DROP TABLE "Generator";

-- AlterTable
ALTER TABLE "PlayerState" RENAME COLUMN "resourceBalance" TO "goldBalance";
ALTER TABLE "PlayerState" DROP COLUMN "affectionBalance";
ALTER TABLE "PlayerState" DROP COLUMN "lastTickAt";

-- CreateTable
CREATE TABLE "PlayerCreature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesKey" TEXT NOT NULL,
    "nickname" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "currentHp" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "caughtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCreature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WildEncounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "speciesKey" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WildEncounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerInventoryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerCreature_userId_idx" ON "PlayerCreature"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WildEncounter_userId_key" ON "WildEncounter"("userId");

-- CreateIndex
CREATE INDEX "PlayerInventoryItem_userId_idx" ON "PlayerInventoryItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerInventoryItem_userId_itemKey_key" ON "PlayerInventoryItem"("userId", "itemKey");

-- AddForeignKey
ALTER TABLE "PlayerCreature" ADD CONSTRAINT "PlayerCreature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WildEncounter" ADD CONSTRAINT "WildEncounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerInventoryItem" ADD CONSTRAINT "PlayerInventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
