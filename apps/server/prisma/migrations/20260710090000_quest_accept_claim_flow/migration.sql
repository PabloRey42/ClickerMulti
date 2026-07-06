-- Existing "COMPLETED" rows already had their reward granted under the old auto-complete
-- flow, so renaming to "CLAIMED" preserves their meaning exactly (reward already given).
ALTER TYPE "QuestStatus" RENAME VALUE 'COMPLETED' TO 'CLAIMED';

-- New intermediate state: every objective is done but the reward hasn't been claimed yet.
ALTER TYPE "QuestStatus" ADD VALUE 'READY_TO_CLAIM';
