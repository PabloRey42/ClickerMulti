import type { PrismaClient, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import {
  SPECIES_CATALOG,
  POKEBALL_CATALOG,
  POTION_CATALOG,
  MAX_TEAM_SIZE,
  nextComboStacks,
  comboMultiplier,
  typeMultiplier,
  computeAttackDamage,
  rollCapture,
  creatureMaxHp,
  creatureAttack,
  goldReward,
  xpReward,
  buildLeagueRoster,
  leagueRankBonusMultiplier,
  computeSkillTreeBonuses,
  LEAGUE_SKILL_POINTS_PER_CLEAR,
  findEncounterHotspot,
  MAX_SAME_SPECIES_OWNED,
  MAX_SHINY_SAME_SPECIES_OWNED,
  SHINY_CHANCE,
  type SkillTreeBonuses,
  type EncounterTableEntry,
  type RouteHotspot,
  type DungeonHotspot,
  type SpeciesConfig,
  type ExplorationStateResponse,
  type AttackResponse,
  type CaptureResponse,
  type FinishEncounterResponse,
  type EvolutionStep,
} from "@farm-clicker/shared";
import {
  lockPlayerState,
  lockActiveCreature,
  lockWildEncounter,
  buildCreatureView,
  buildEncounterView,
  applyXpGain,
} from "../../lib/battle-db.js";
import { bumpQuestObjective } from "../quests/quests.service.js";

export class RouteNotFoundError extends Error {}
export class NoActiveCreatureError extends Error {}
export class ActiveCreatureFaintedError extends Error {}
export class NoEncounterError extends Error {}
export class EncounterNotDefeatedError extends Error {}
export class InvalidPokeballError extends Error {}
export class InsufficientPokeballsError extends Error {}
export class AutoHealLockedError extends Error {}
export class AutoCaptureLockedError extends Error {}
export class DuplicateSpeciesLimitError extends Error {}
export class LeagueInProgressError extends Error {}

/** All species keys, used to deterministically build a League trainer roster for a rank. */
export const ALL_SPECIES_KEYS = Object.keys(SPECIES_CATALOG);

function pickWeightedEntry(entries: EncounterTableEntry[], roll: number): EncounterTableEntry {
  const total = entries.reduce((sum, e) => sum + e.rarityWeight, 0);
  let cursor = roll * total;
  for (const entry of entries) {
    cursor -= entry.rarityWeight;
    if (cursor <= 0) return entry;
  }
  return entries[entries.length - 1];
}

function rollEncounterData(
  hotspot: RouteHotspot | DungeonHotspot,
  routeKey: string,
  forceShiny: boolean,
  shinyChanceMultiplier: number,
) {
  const entry = pickWeightedEntry(hotspot.encounterTable, Math.random());
  const level = entry.minLevel + Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1));
  const species = SPECIES_CATALOG[entry.speciesKey];
  const maxHp = creatureMaxHp(species.baseHp, level);
  const isShiny = forceShiny || Math.random() < SHINY_CHANCE * shinyChanceMultiplier;
  return { routeKey, speciesKey: entry.speciesKey, level, currentHp: maxHp, maxHp, isShiny };
}

/** Routes have infinite wild creatures — once a fight ends (finish/capture/flee) a new one
 * is rolled immediately on the same route instead of leaving the player with nothing to
 * fight. Only leaving the route entirely (back to the city map) ends the session. */
async function rerollOrClearEncounter(
  tx: Prisma.TransactionClient,
  userId: string,
  routeKey: string,
  forceShiny: boolean,
  shinyChanceMultiplier: number,
): Promise<void> {
  const hotspot = findEncounterHotspot(routeKey);
  if (hotspot && hotspot.encounterTable.length > 0) {
    await tx.wildEncounter.update({
      where: { userId },
      data: rollEncounterData(hotspot, routeKey, forceShiny, shinyChanceMultiplier),
    });
  } else {
    await tx.wildEncounter.delete({ where: { userId } });
  }
}

/** The Charme Shiny (League skill-tree completion reward) doubles shiny odds on every
 * future wild encounter roll. */
function shinyChanceMultiplierFor(state: { hasShinyCharm: boolean }): number {
  return state.hasShinyCharm ? 2 : 1;
}

/** Fetches the player's League skill-tree tiers and turns them into ready-to-use combat/
 * reward multipliers — computed once per transaction and threaded down to every place a
 * bonus applies, rather than re-querying PlayerSkillBranch at each call site. */
async function getSkillTreeBonuses(tx: Prisma.TransactionClient, userId: string): Promise<SkillTreeBonuses> {
  const rows = await tx.playerSkillBranch.findMany({ where: { userId } });
  const tiers = Object.fromEntries(rows.map((r) => [r.branch, r.tier]));
  return computeSkillTreeBonuses(tiers);
}

function scaledGoldReward(level: number, bonuses: SkillTreeBonuses): bigint {
  return BigInt(Math.round(Number(goldReward(level)) * bonuses.gold));
}

function scaledXpReward(level: number, bonuses: SkillTreeBonuses): number {
  return Math.round(xpReward(level) * bonuses.xp);
}

export async function buildExplorationState(
  prisma: PrismaClient,
  userId: string,
): Promise<ExplorationStateResponse> {
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });
  const activeCreature = await prisma.playerCreature.findFirst({ where: { userId, isActive: true } });
  const encounter = await prisma.wildEncounter.findUnique({ where: { userId } });

  return {
    goldBalance: playerState.goldBalance,
    activeCreature: activeCreature ? buildCreatureView(activeCreature) : null,
    encounter: encounter ? buildEncounterView(encounter) : null,
    autoHealEnabled: playerState.autoHealEnabled,
    autoHealUnlocked: playerState.autoHealUnlocked,
    autoCaptureEnabled: playerState.autoCaptureEnabled,
    autoCaptureUnlocked: playerState.autoCaptureUnlocked,
  };
}

export async function setAutoHeal(
  prisma: PrismaClient,
  userId: string,
  enabled: boolean,
): Promise<ExplorationStateResponse> {
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });
  if (!playerState.autoHealUnlocked) throw new AutoHealLockedError();
  await prisma.playerState.update({ where: { userId }, data: { autoHealEnabled: enabled } });
  return buildExplorationState(prisma, userId);
}

export async function setAutoCapture(
  prisma: PrismaClient,
  userId: string,
  enabled: boolean,
): Promise<ExplorationStateResponse> {
  const playerState = await prisma.playerState.findUniqueOrThrow({ where: { userId } });
  if (!playerState.autoCaptureUnlocked) throw new AutoCaptureLockedError();
  await prisma.playerState.update({ where: { userId }, data: { autoCaptureEnabled: enabled } });
  return buildExplorationState(prisma, userId);
}

/** If auto-heal is on, consumes owned potions (weakest first, to save the strong ones)
 * to top up the active Pokémon's HP — called at the end of a fight (finish/capture/flee)
 * so a player can keep grinding a route without manually visiting the Centre Pokémon, as
 * long as they still have potions. Never revives a fainted Pokémon (that needs a Revive,
 * not a Potion — out of scope for now; a full team wipe still requires manual healing). */
async function autoHealIfEnabled(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const playerState = await tx.playerState.findUnique({ where: { userId } });
  if (!playerState?.autoHealEnabled) return;

  const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
  if (!activeCreature || activeCreature.currentHp <= 0) return;

  const species = SPECIES_CATALOG[activeCreature.speciesKey];
  const maxHp = creatureMaxHp(species.baseHp, activeCreature.level);
  let currentHp = activeCreature.currentHp;
  if (currentHp >= maxHp) return;

  const potionsByWeakest = Object.values(POTION_CATALOG).sort((a, b) => a.healAmount - b.healAmount);
  for (const potion of potionsByWeakest) {
    if (currentHp >= maxHp) break;
    const inventory = await tx.playerInventoryItem.findUnique({
      where: { userId_itemKey: { userId, itemKey: potion.key } },
    });
    let owned = inventory?.quantity ?? 0;
    let used = 0;
    while (owned > 0 && currentHp < maxHp) {
      currentHp = Math.min(maxHp, currentHp + potion.healAmount);
      owned -= 1;
      used += 1;
    }
    if (used > 0) {
      await tx.playerInventoryItem.update({
        where: { userId_itemKey: { userId, itemKey: potion.key } },
        data: { quantity: owned },
      });
    }
  }

  await tx.playerCreature.update({ where: { id: activeCreature.id }, data: { currentHp } });
}

/** Gold + XP for defeating a wild creature without capturing it — shared by the manual
 * "Achever" action and the auto-capture fallback below (when auto-capture is on but never
 * lands, the player still shouldn't get stuck waiting on an AFK route). */
async function grantEncounterRewards(
  tx: Prisma.TransactionClient,
  userId: string,
  level: number,
  bonuses: SkillTreeBonuses,
): Promise<{ goldGained: bigint; xpGained: number; leveledUp: boolean; evolution: EvolutionStep[] }> {
  const goldGained = scaledGoldReward(level, bonuses);
  const xpGained = scaledXpReward(level, bonuses);
  let leveledUp = false;
  let evolution: EvolutionStep[] = [];

  const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
  if (activeCreature) {
    const result = await applyXpGain(tx, activeCreature, xpGained);
    leveledUp = result.leveledUp;
    evolution = result.evolution;
  }
  await tx.playerState.update({
    where: { userId },
    data: {
      goldBalance: { increment: goldGained },
      totalGoldEarned: { increment: goldGained },
      totalXpEarned: { increment: xpGained },
    },
  });

  return { goldGained, xpGained, leveledUp, evolution };
}

/** If auto-capture is on, throws owned balls cheapest-first (draining each tier before
 * moving to the pricier one, same idiom as autoHealIfEnabled's potions) until one lands or
 * the player is completely out of balls. Mirrors the manual capture flow's math exactly. */
async function autoCaptureIfEnabled(
  tx: Prisma.TransactionClient,
  userId: string,
  encounter: { speciesKey: string; level: number; isShiny: boolean },
  wildSpecies: SpeciesConfig,
  bonuses: SkillTreeBonuses,
): Promise<{ attempted: boolean; captured: boolean; leveledUp: boolean; evolution: EvolutionStep[] }> {
  const playerState = await tx.playerState.findUnique({ where: { userId } });
  if (!playerState?.autoCaptureEnabled) return { attempted: false, captured: false, leveledUp: false, evolution: [] };

  // Already at the species cap — don't waste balls on a capture that can never land. Shiny
  // and non-shiny each have their own separate slot(s), so a shiny doesn't compete with the
  // two regular slots (or vice versa).
  const speciesCap = encounter.isShiny ? MAX_SHINY_SAME_SPECIES_OWNED : MAX_SAME_SPECIES_OWNED;
  const ownedCount = await tx.playerCreature.count({
    where: { userId, speciesKey: encounter.speciesKey, isShiny: encounter.isShiny },
  });
  if (ownedCount >= speciesCap) return { attempted: true, captured: false, leveledUp: false, evolution: [] };

  const ballsByCheapest = Object.values(POKEBALL_CATALOG).sort((a, b) => Number(a.goldCost - b.goldCost));
  let anyBallThrown = false;

  for (const ball of ballsByCheapest) {
    const inventory = await tx.playerInventoryItem.findUnique({
      where: { userId_itemKey: { userId, itemKey: ball.key } },
    });
    let owned = inventory?.quantity ?? 0;

    while (owned > 0) {
      owned -= 1;
      anyBallThrown = true;
      const success = rollCapture(
        Math.random(),
        wildSpecies.baseCaptureRate,
        ball.catchMultiplier * bonuses.capture,
        0,
      );

      if (success) {
        await tx.playerInventoryItem.update({
          where: { userId_itemKey: { userId, itemKey: ball.key } },
          data: { quantity: owned },
        });
        const teamCount = await tx.playerCreature.count({ where: { userId, isOnTeam: true } });
        await tx.playerCreature.create({
          data: {
            userId,
            speciesKey: encounter.speciesKey,
            level: encounter.level,
            currentHp: creatureMaxHp(wildSpecies.baseHp, encounter.level),
            isOnTeam: teamCount < MAX_TEAM_SIZE,
            isShiny: encounter.isShiny,
          },
        });
        const goldGained = scaledGoldReward(encounter.level, bonuses) / 2n;
        const xpGained = Math.floor(scaledXpReward(encounter.level, bonuses) / 2);
        const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
        let leveledUp = false;
        let evolution: EvolutionStep[] = [];
        if (activeCreature) {
          const xpResult = await applyXpGain(tx, activeCreature, xpGained);
          leveledUp = xpResult.leveledUp;
          evolution = xpResult.evolution;
        }
        await tx.playerState.update({
          where: { userId },
          data: {
            goldBalance: { increment: goldGained },
            totalGoldEarned: { increment: goldGained },
            totalXpEarned: { increment: xpGained },
            totalCaptures: { increment: 1 },
            totalShinyCaptures: encounter.isShiny ? { increment: 1 } : undefined,
          },
        });
        await bumpQuestObjective(tx, userId, "capture_creature");
        return { attempted: true, captured: true, leveledUp, evolution };
      }
    }
    if (inventory) {
      await tx.playerInventoryItem.update({
        where: { userId_itemKey: { userId, itemKey: ball.key } },
        data: { quantity: owned },
      });
    }
  }

  return { attempted: anyBallThrown, captured: false, leveledUp: false, evolution: [] };
}

export async function getExplorationState(prisma: PrismaClient, userId: string): Promise<ExplorationStateResponse> {
  return buildExplorationState(prisma, userId);
}

export async function enterRoute(
  prisma: PrismaClient,
  userId: string,
  routeKey: string,
): Promise<ExplorationStateResponse> {
  const hotspot = findEncounterHotspot(routeKey);
  if (!hotspot || hotspot.encounterTable.length === 0) throw new RouteNotFoundError();

  await prisma.$transaction(async (tx) => {
    const lockedState = await lockPlayerState(tx, userId);

    // An in-progress encounter on the SAME route (e.g. awaiting a team switch after a
    // faint) takes precedence, even if nobody is currently active — that's exactly the
    // state a player needs to get back into to pick a replacement and keep fighting. Any
    // other leftover encounter (a different route, or a stale/abandoned League run — League
    // never resumes, see league.service.ts's challengeLeague) just gets overwritten below,
    // same as switching between two different routes already does.
    const existingEncounter = await tx.wildEncounter.findUnique({ where: { userId } });
    if (existingEncounter && !existingEncounter.isLeagueBattle && existingEncounter.routeKey === routeKey) return;

    const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
    if (!activeCreature) throw new NoActiveCreatureError();
    if (activeCreature.currentHp <= 0) throw new ActiveCreatureFaintedError();

    const rolled = rollEncounterData(
      hotspot,
      routeKey,
      lockedState.forceShinyMode,
      shinyChanceMultiplierFor(lockedState),
    );
    await tx.wildEncounter.upsert({
      where: { userId },
      update: rolled,
      create: { userId, ...rolled },
    });
    await bumpQuestObjective(tx, userId, "enter_route");
  });

  return buildExplorationState(prisma, userId);
}

/** Advances a League run: either lines up the next trainer opponent, or — if the whole
 * roster is cleared — bumps rank (never resets) and grants a League skill point to spend
 * on the skill tree. */
async function resolveLeagueVictory(
  tx: Prisma.TransactionClient,
  userId: string,
  encounter: { leagueOpponentIndex: number },
): Promise<{ cleared: boolean }> {
  const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
  const rank = progress?.rank ?? 0;
  const roster = buildLeagueRoster(rank, ALL_SPECIES_KEYS);
  const nextIndex = encounter.leagueOpponentIndex + 1;

  if (nextIndex >= roster.length) {
    await tx.playerLeagueProgress.upsert({
      where: { userId },
      update: { rank: rank + 1, unspentPoints: { increment: LEAGUE_SKILL_POINTS_PER_CLEAR } },
      create: { userId, rank: rank + 1, unspentPoints: LEAGUE_SKILL_POINTS_PER_CLEAR },
    });
    await tx.wildEncounter.delete({ where: { userId } });
    return { cleared: true };
  }

  const next = roster[nextIndex];
  const species = SPECIES_CATALOG[next.speciesKey];
  const maxHp = creatureMaxHp(species.baseHp, next.level);
  await tx.wildEncounter.update({
    where: { userId },
    data: { speciesKey: next.speciesKey, level: next.level, currentHp: maxHp, maxHp, leagueOpponentIndex: nextIndex },
  });
  return { cleared: false };
}

export async function attackEncounter(prisma: PrismaClient, userId: string): Promise<AttackResponse> {
  let damageDealt = 0;
  let damageTaken = 0;
  let victory = false;
  let fainted = false;
  let canSwitch = false;
  let leagueCleared = false;
  let capturedShiny: { name: string; spriteFile: string } | null = null;
  let leveledUp = false;
  let evolution: EvolutionStep[] = [];

  await prisma.$transaction(async (tx) => {
    const lockedState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    const activeCreature = await lockActiveCreature(tx, userId);
    if (!activeCreature) throw new NoActiveCreatureError();

    const now = new Date();
    const stacks = nextComboStacks(lockedState.comboStacks, lockedState.lastClickAt, now);
    const comboMult = comboMultiplier(stacks);

    const playerSpecies = SPECIES_CATALOG[activeCreature.speciesKey];
    const wildSpecies = SPECIES_CATALOG[encounter.speciesKey];

    // Permanent bonuses: League rank boosts every attack; the skill-tree "Attaque" branch
    // adds a further flat bonus on top. Both apply everywhere, not just in League fights,
    // so clearing the League/tree actually makes the player stronger everywhere.
    const progress = await tx.playerLeagueProgress.findUnique({ where: { userId } });
    const skillBonuses = await getSkillTreeBonuses(tx, userId);
    const bonusMultiplier = leagueRankBonusMultiplier(progress?.rank ?? 0).mul(skillBonuses.attack);

    const playerAttack = creatureAttack(playerSpecies.baseAttack, activeCreature.level);
    damageDealt = computeAttackDamage(
      playerAttack,
      comboMult.mul(bonusMultiplier),
      typeMultiplier(playerSpecies.types, wildSpecies.types),
    );
    const wildHpAfter = Math.max(0, encounter.currentHp - damageDealt);

    await tx.playerState.update({
      where: { userId },
      data: { comboStacks: stacks, lastClickAt: now, totalClicks: { increment: 1 } },
    });

    if (wildHpAfter <= 0) {
      victory = true;
      await tx.playerState.update({ where: { userId }, data: { totalPokemonDefeated: { increment: 1 } } });
      await bumpQuestObjective(tx, userId, "win_battle");
      if (encounter.isLeagueBattle) {
        const result = await resolveLeagueVictory(tx, userId, encounter);
        leagueCleared = result.cleared;
      } else {
        await bumpQuestObjective(tx, userId, "win_battle_on_route", 1, { routeKey: encounter.routeKey });
        const autoCapture = await autoCaptureIfEnabled(tx, userId, encounter, wildSpecies, skillBonuses);
        if (autoCapture.captured && encounter.isShiny) {
          capturedShiny = { name: wildSpecies.name, spriteFile: wildSpecies.spriteFile };
        }
        if (autoCapture.captured) {
          leveledUp = autoCapture.leveledUp;
          evolution = autoCapture.evolution;
          await autoHealIfEnabled(tx, userId);
          await rerollOrClearEncounter(
            tx,
            userId,
            encounter.routeKey,
            lockedState.forceShinyMode,
            shinyChanceMultiplierFor(lockedState),
          );
        } else if (autoCapture.attempted) {
          // Auto-capture was on but never landed (or ran out of balls) — still auto-finish
          // so a fully AFK player isn't left stuck waiting on a defeated encounter forever.
          const rewards = await grantEncounterRewards(tx, userId, encounter.level, skillBonuses);
          leveledUp = rewards.leveledUp;
          evolution = rewards.evolution;
          await autoHealIfEnabled(tx, userId);
          await rerollOrClearEncounter(
            tx,
            userId,
            encounter.routeKey,
            lockedState.forceShinyMode,
            shinyChanceMultiplierFor(lockedState),
          );
        } else {
          await tx.wildEncounter.update({ where: { userId }, data: { currentHp: 0 } });
        }
      }
      return;
    }

    // The skill-tree "Vitalité" branch reduces damage taken from every wild counter-attack.
    const wildAttack = creatureAttack(wildSpecies.baseAttack, encounter.level);
    damageTaken = computeAttackDamage(
      wildAttack,
      skillBonuses.defense,
      typeMultiplier(wildSpecies.types, playerSpecies.types),
    );
    const playerHpAfter = Math.max(0, activeCreature.currentHp - damageTaken);
    fainted = playerHpAfter <= 0;

    const healthyTeammates = fainted
      ? await tx.playerCreature.count({
          where: { userId, isOnTeam: true, currentHp: { gt: 0 }, id: { not: activeCreature.id } },
        })
      : 0;
    canSwitch = healthyTeammates > 0;

    // Only clear "active" when there's actually another healthy teammate to switch into —
    // that's a real choice the player needs to make. A full team wipe has no such choice,
    // so the same creature stays flagged active and simply resumes once healed, instead of
    // forcing a re-pick from the collection every time the whole team goes down.
    await tx.playerCreature.update({
      where: { id: activeCreature.id },
      data: { currentHp: playerHpAfter, isActive: canSwitch ? false : true },
    });

    if (!fainted) {
      await tx.wildEncounter.update({ where: { userId }, data: { currentHp: wildHpAfter } });
      return;
    }

    if (canSwitch) {
      await tx.wildEncounter.update({ where: { userId }, data: { currentHp: wildHpAfter } });
    } else {
      await tx.wildEncounter.delete({ where: { userId } });
    }
  });

  const state = await buildExplorationState(prisma, userId);
  return { state, damageDealt, damageTaken, victory, fainted, canSwitch, leagueCleared, capturedShiny, leveledUp, evolution };
}

export async function captureEncounter(
  prisma: PrismaClient,
  userId: string,
  pokeballKey: string,
): Promise<CaptureResponse> {
  const pokeball = POKEBALL_CATALOG[pokeballKey];
  if (!pokeball) throw new InvalidPokeballError();

  let success = false;
  let createdCreatureId: string | null = null;
  let xpGained = 0;
  let leveledUp = false;
  let evolution: EvolutionStep[] = [];

  await prisma.$transaction(async (tx) => {
    const lockedState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    if (encounter.currentHp > 0) throw new EncounterNotDefeatedError();

    const speciesCap = encounter.isShiny ? MAX_SHINY_SAME_SPECIES_OWNED : MAX_SAME_SPECIES_OWNED;
    const ownedCount = await tx.playerCreature.count({
      where: { userId, speciesKey: encounter.speciesKey, isShiny: encounter.isShiny },
    });
    if (ownedCount >= speciesCap) throw new DuplicateSpeciesLimitError();

    const inventory = await tx.playerInventoryItem.findUnique({
      where: { userId_itemKey: { userId, itemKey: pokeballKey } },
    });
    if (!inventory || inventory.quantity < 1) throw new InsufficientPokeballsError();

    await tx.playerInventoryItem.update({
      where: { userId_itemKey: { userId, itemKey: pokeballKey } },
      data: { quantity: { decrement: 1 } },
    });

    const skillBonuses = await getSkillTreeBonuses(tx, userId);
    const species = SPECIES_CATALOG[encounter.speciesKey];
    success = rollCapture(Math.random(), species.baseCaptureRate, pokeball.catchMultiplier * skillBonuses.capture, 0);

    if (success) {
      const teamCount = await tx.playerCreature.count({ where: { userId, isOnTeam: true } });
      const created = await tx.playerCreature.create({
        data: {
          userId,
          speciesKey: encounter.speciesKey,
          level: encounter.level,
          currentHp: creatureMaxHp(species.baseHp, encounter.level),
          isOnTeam: teamCount < MAX_TEAM_SIZE,
          isShiny: encounter.isShiny,
        },
      });
      createdCreatureId = created.id;

      const goldGained = scaledGoldReward(encounter.level, skillBonuses) / 2n;
      xpGained = Math.floor(scaledXpReward(encounter.level, skillBonuses) / 2);
      const activeCreature = await tx.playerCreature.findFirst({ where: { userId, isActive: true } });
      if (activeCreature) {
        const xpResult = await applyXpGain(tx, activeCreature, xpGained);
        leveledUp = xpResult.leveledUp;
        evolution = xpResult.evolution;
      }
      await tx.playerState.update({
        where: { userId },
        data: {
          goldBalance: { increment: goldGained },
          totalGoldEarned: { increment: goldGained },
          totalXpEarned: { increment: xpGained },
          totalCaptures: { increment: 1 },
          totalShinyCaptures: encounter.isShiny ? { increment: 1 } : undefined,
        },
      });
      await bumpQuestObjective(tx, userId, "capture_creature");

      await autoHealIfEnabled(tx, userId);
      await rerollOrClearEncounter(
        tx,
        userId,
        encounter.routeKey,
        lockedState.forceShinyMode,
        shinyChanceMultiplierFor(lockedState),
      );
    }
  });

  const state = await buildExplorationState(prisma, userId);
  const creature = createdCreatureId
    ? buildCreatureView((await prisma.playerCreature.findUniqueOrThrow({ where: { id: createdCreatureId } })))
    : null;
  return { success, state, creature, xpGained, leveledUp, evolution };
}

export async function finishEncounter(prisma: PrismaClient, userId: string): Promise<FinishEncounterResponse> {
  let goldGained = 0n;
  let xpGained = 0;
  let leveledUp = false;
  let evolution: EvolutionStep[] = [];

  await prisma.$transaction(async (tx) => {
    const lockedState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    if (encounter.currentHp > 0) throw new EncounterNotDefeatedError();

    const skillBonuses = await getSkillTreeBonuses(tx, userId);
    ({ goldGained, xpGained, leveledUp, evolution } = await grantEncounterRewards(
      tx,
      userId,
      encounter.level,
      skillBonuses,
    ));

    await autoHealIfEnabled(tx, userId);
    await rerollOrClearEncounter(
      tx,
      userId,
      encounter.routeKey,
      lockedState.forceShinyMode,
      shinyChanceMultiplierFor(lockedState),
    );
  });

  const state = await buildExplorationState(prisma, userId);
  return { state, goldGained, xpGained, leveledUp, evolution };
}

export async function fleeEncounter(prisma: PrismaClient, userId: string): Promise<ExplorationStateResponse> {
  await prisma.$transaction(async (tx) => {
    const lockedState = await lockPlayerState(tx, userId);
    const encounter = await lockWildEncounter(tx, userId);
    if (!encounter) throw new NoEncounterError();
    await autoHealIfEnabled(tx, userId);
    await rerollOrClearEncounter(
      tx,
      userId,
      encounter.routeKey,
      lockedState.forceShinyMode,
      shinyChanceMultiplierFor(lockedState),
    );
  });

  return buildExplorationState(prisma, userId);
}

/** Heals the player's whole team, not just whoever's active — mirrors a real Pokémon
 * Center. This also has to work when nobody is active (e.g. the last fight ended with
 * the active Pokémon fainting and no switch has happened yet), which "heal the active
 * one" could never handle. */
export async function healTeam(prisma: PrismaClient, userId: string) {
  await prisma.$transaction(async (tx) => {
    const encounter = await tx.wildEncounter.findUnique({ where: { userId } });
    if (encounter?.isLeagueBattle) throw new LeagueInProgressError();

    const team = await tx.playerCreature.findMany({ where: { userId, isOnTeam: true } });
    for (const member of team) {
      const species = SPECIES_CATALOG[member.speciesKey];
      await tx.playerCreature.update({
        where: { id: member.id },
        data: { currentHp: creatureMaxHp(species.baseHp, member.level) },
      });
    }
    await bumpQuestObjective(tx, userId, "heal_at_center");
  });

  return buildExplorationState(prisma, userId);
}
