-- AlterTable
ALTER TABLE "PlayerState" ADD COLUMN "hasShinyCharm" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "PlayerSpecialization";

-- CreateTable
CREATE TABLE "PlayerSkillBranch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerSkillBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerSkillBranch_userId_idx" ON "PlayerSkillBranch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSkillBranch_userId_branch_key" ON "PlayerSkillBranch"("userId", "branch");

-- AddForeignKey
ALTER TABLE "PlayerSkillBranch" ADD CONSTRAINT "PlayerSkillBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
