-- AlterTable
ALTER TABLE "PlayerCreature" ADD COLUMN "isShiny" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WildEncounter" ADD COLUMN "isShiny" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PlayerState" ADD COLUMN "forceShinyMode" BOOLEAN NOT NULL DEFAULT false;
