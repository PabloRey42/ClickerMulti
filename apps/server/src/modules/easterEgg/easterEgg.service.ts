import type { PrismaClient } from "@prisma/client";
import { SPECIES_CATALOG, MAX_TEAM_SIZE, creatureMaxHp, type PlayerCreatureView } from "@farm-clicker/shared";
import { buildCreatureView, renumberTeamSlots } from "../../lib/battle-db.js";

export class DynavoltAlreadyClaimedError extends Error {}

const DYNAVOLT_SPECIES_KEY = "goupil-etincelle";
const DYNAVOLT_GIFT_LEVEL = 20;

/** Hidden reward for clicking the Statistiques page's shiny-captures emoji 10 times.
 * One-shot per account — gated on PlayerState.hasDynavoltEasterEgg, checked and flipped
 * inside the same transaction so a double-submit can't grant two Dynavolt. */
export async function claimDynavoltEasterEgg(prisma: PrismaClient, userId: string): Promise<PlayerCreatureView> {
  const species = SPECIES_CATALOG[DYNAVOLT_SPECIES_KEY];

  const creature = await prisma.$transaction(async (tx) => {
    const playerState = await tx.playerState.findUniqueOrThrow({ where: { userId } });
    if (playerState.hasDynavoltEasterEgg) throw new DynavoltAlreadyClaimedError();

    await tx.playerState.update({ where: { userId }, data: { hasDynavoltEasterEgg: true } });

    const teamCount = await tx.playerCreature.count({ where: { userId, isOnTeam: true } });
    const created = await tx.playerCreature.create({
      data: {
        userId,
        speciesKey: DYNAVOLT_SPECIES_KEY,
        level: DYNAVOLT_GIFT_LEVEL,
        currentHp: creatureMaxHp(species.baseHp, DYNAVOLT_GIFT_LEVEL),
        isOnTeam: teamCount < MAX_TEAM_SIZE,
      },
    });
    await renumberTeamSlots(tx, userId);
    return created;
  });

  return buildCreatureView(creature);
}
