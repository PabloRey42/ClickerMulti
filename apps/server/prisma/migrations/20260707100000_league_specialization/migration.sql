-- AlterTable
ALTER TABLE "WildEncounter" ADD COLUMN "isLeagueBattle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WildEncounter" ADD COLUMN "leagueOpponentIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PlayerLeagueProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "unspentPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerLeagueProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSpecialization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elementalType" TEXT NOT NULL,
    "pointsInvested" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerLeagueProgress_userId_key" ON "PlayerLeagueProgress"("userId");

-- CreateIndex
CREATE INDEX "PlayerSpecialization_userId_idx" ON "PlayerSpecialization"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSpecialization_userId_elementalType_key" ON "PlayerSpecialization"("userId", "elementalType");

-- AddForeignKey
ALTER TABLE "PlayerLeagueProgress" ADD CONSTRAINT "PlayerLeagueProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSpecialization" ADD CONSTRAINT "PlayerSpecialization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
