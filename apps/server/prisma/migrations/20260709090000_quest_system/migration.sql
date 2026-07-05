-- AlterTable
ALTER TABLE "PlayerState"
  ADD COLUMN "autoHealUnlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "autoCaptureEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "autoCaptureUnlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "PlayerQuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questKey" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "objectiveProgress" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerQuestProgress_userId_idx" ON "PlayerQuestProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerQuestProgress_userId_questKey_key" ON "PlayerQuestProgress"("userId", "questKey");

-- AddForeignKey
ALTER TABLE "PlayerQuestProgress" ADD CONSTRAINT "PlayerQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
