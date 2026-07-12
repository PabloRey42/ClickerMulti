-- CreateEnum
CREATE TYPE "RaidLobbyStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'WON', 'LOST', 'EXPIRED');

-- CreateTable
CREATE TABLE "RaidLobby" (
    "id" TEXT NOT NULL,
    "raidBossKey" TEXT NOT NULL,
    "hotspotId" TEXT NOT NULL,
    "cityMapId" TEXT NOT NULL,
    "status" "RaidLobbyStatus" NOT NULL DEFAULT 'WAITING',
    "creatorId" TEXT NOT NULL,
    "bossMaxHp" INTEGER NOT NULL,
    "bossCurrentHp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "battleEndsAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "RaidLobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaidParticipant" (
    "id" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "caughtBoss" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RaidParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RaidLobby_hotspotId_status_idx" ON "RaidLobby"("hotspotId", "status");

-- CreateIndex
CREATE INDEX "RaidParticipant_userId_idx" ON "RaidParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RaidParticipant_lobbyId_userId_key" ON "RaidParticipant"("lobbyId", "userId");

-- AddForeignKey
ALTER TABLE "RaidLobby" ADD CONSTRAINT "RaidLobby_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaidParticipant" ADD CONSTRAINT "RaidParticipant_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "RaidLobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaidParticipant" ADD CONSTRAINT "RaidParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
