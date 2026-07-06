/**
 * One-off migration: re-derives every PlayerCreature's level/xp from the total XP they'd
 * already earned under the OLD xpToNextLevel curve, then re-spends that same total XP
 * against the NEW curve (packages/shared/src/game/battle.ts). Run once, right after
 * deploying the new curve — running it twice would re-interpret already-migrated
 * new-curve values as if they were old-curve totals and corrupt levels further.
 *
 * Usage: `pnpm --filter @farm-clicker/server exec tsx src/scripts/relevel-creatures.ts`
 * (or, on the VPS: `docker compose exec -T server npx tsx src/scripts/relevel-creatures.ts`)
 */
import { PrismaClient } from "@prisma/client";
import { SPECIES_CATALOG, MAX_LEVEL, xpToNextLevel, creatureMaxHp } from "@farm-clicker/shared";

/** Frozen snapshot of the pre-migration curve — do not "fix" this to match the new
 * xpToNextLevel, it must stay exactly what was live before this migration ran. */
function oldXpToNextLevel(level: number): number {
  return Math.round(20 * Math.pow(level, 1.4));
}

function totalXpEarned(level: number, xp: number): number {
  let total = xp;
  for (let l = 1; l < level; l++) total += oldXpToNextLevel(l);
  return total;
}

function relevel(totalXp: number): { level: number; xp: number } {
  let level = 1;
  let xp = totalXp;
  while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp = 0;
  }
  return { level, xp };
}

async function main() {
  const prisma = new PrismaClient();
  const creatures = await prisma.playerCreature.findMany();

  let changed = 0;
  for (const creature of creatures) {
    const species = SPECIES_CATALOG[creature.speciesKey];
    if (!species) continue;

    const totalXp = totalXpEarned(creature.level, creature.xp);
    const { level, xp } = relevel(totalXp);
    const newMaxHp = creatureMaxHp(species.baseHp, level);
    const currentHp = Math.min(creature.currentHp, newMaxHp);

    if (level !== creature.level || xp !== creature.xp || currentHp !== creature.currentHp) {
      await prisma.playerCreature.update({
        where: { id: creature.id },
        data: { level, xp, currentHp },
      });
      changed++;
      console.log(
        `${creature.speciesKey} (${creature.id}): level ${creature.level} -> ${level}, xp ${creature.xp} -> ${xp}, hp ${creature.currentHp} -> ${currentHp}`,
      );
    }
  }

  console.log(`Done. ${changed}/${creatures.length} creatures re-leveled.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
