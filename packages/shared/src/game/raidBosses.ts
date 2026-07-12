export interface RaidBossConfig {
  key: string;
  /** References SPECIES_CATALOG for name/types/sprite — the raid boss's own combat stats
   * (bossMaxHp/bossAttack below) are tuned separately from that species' baseAttack/baseHp,
   * since those are what a *captured* Groudon uses once owned, not what the boss itself
   * fights with during the raid. */
  speciesKey: string;
  hotspotId: string;
  cityMapId: string;
  name: string;
  /** Level shown/used for reward scaling (goldReward/xpReward) and for the captured
   * creature if the 1/1000 roll lands. */
  level: number;
  bossMaxHp: number;
  /** Raw attack stat fed straight into computeAttackDamage against the attacker's defense
   * bonus — no combo multiplier applies to the boss's counter-hit, same as a wild encounter's
   * counter-attack. */
  bossAttack: number;
  /** Hard minimum to actually start the fight (manual start or auto-start) — this is the
   * "impossible solo" rule, not a per-player team-level gate. */
  minParticipants: number;
  /** Soft cap purely to bound per-request snapshot cost (full team fetch per participant). */
  maxParticipants: number;
  /** Independent per-participant roll on victory. */
  captureChance: number;
  /** Auto-start deadline from lobby creation. */
  lobbyWaitMs: number;
  /** Hard battle timer from the moment the fight actually starts. */
  battleDurationMs: number;
}

/** Static raid boss definitions, same "shared config, not DB rows" pattern as
 * SPECIES_CATALOG/QUEST_CATALOG. Keyed by raidBossKey, referenced from a RaidHotspot in
 * world config. Add future raid bosses here + a matching RaidHotspot, nothing else needs
 * to change (raid.service.ts is written generically against this catalog). */
export const RAID_BOSS_CATALOG: Record<string, RaidBossConfig> = {
  groudon: {
    key: "groudon",
    speciesKey: "groudon",
    hotspotId: "cendre-cratere-groudon",
    cityMapId: "volcanique",
    name: "Groudon",
    level: 100,
    // Tuned so a duo of typical level-100 builds (see raid.service.ts balance notes) can
    // plausibly clear this within the 3-minute timer by attacking continuously, while a lone
    // attacker (even level 100) falls an order of magnitude short — verify/tune further via
    // the admin set-boss-hp escape hatch during VPS playtests.
    bossMaxHp: 1_800_000,
    bossAttack: 400,
    minParticipants: 2,
    maxParticipants: 20,
    captureChance: 1 / 1000,
    lobbyWaitMs: 120_000,
    battleDurationMs: 180_000,
  },
};

export function findRaidBossByHotspot(hotspotId: string): RaidBossConfig | undefined {
  return Object.values(RAID_BOSS_CATALOG).find((b) => b.hotspotId === hotspotId);
}

export function findRaidBossByKey(raidBossKey: string): RaidBossConfig | undefined {
  return RAID_BOSS_CATALOG[raidBossKey];
}
