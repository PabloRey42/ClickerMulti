import { useEffect, useState, type CSSProperties } from "react";
import { Swords } from "lucide-react";
import type { ElementalType, PlayerCreatureView, PokeballCatalogEntry, ShinyCaptureInfo } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useBattleStore } from "../state/battleStore";
import { ApiError } from "../api/client";
import {
  getExplorationState,
  attackEncounter,
  captureEncounter,
  finishEncounter,
  fleeEncounter,
} from "../api/exploration";
import { listCreatures, activateCreature } from "../api/creatures";
import { getShopCatalog } from "../api/shop";
import { useTeamStore } from "../state/teamStore";
import { TYPE_LABEL, typeIconSrc, creatureSpriteSrc } from "../theme/typeColors";
import { playShinySound } from "../theme/shinySound";
import { LeagueVictoryModal } from "../components/LeagueVictoryModal";
import { ShinyCaptureModal } from "../components/ShinyCaptureModal";

/** Fixed radiating offsets for the one-shot star burst — a real Pokémon shiny sparkle is a
 * consistent pattern, not randomized, so there's no need for Math.random() here. */
const SHINY_STAR_OFFSETS: { tx: number; ty: number; delay: number }[] = [
  { tx: -60, ty: -50, delay: 0 },
  { tx: 55, ty: -55, delay: 0.08 },
  { tx: -70, ty: 10, delay: 0.16 },
  { tx: 65, ty: 20, delay: 0.05 },
  { tx: -20, ty: -70, delay: 0.22 },
  { tx: 25, ty: 65, delay: 0.12 },
];

function ShinyBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      <div className="shiny-reveal-ring" />
      {SHINY_STAR_OFFSETS.map((star, i) => (
        <span
          key={i}
          className="shiny-reveal-star text-2xl"
          style={
            {
              "--star-tx": `${star.tx}px`,
              "--star-ty": `${star.ty}px`,
              animationDelay: `${star.delay}s`,
            } as CSSProperties
          }
        >
          ✦
        </span>
      ))}
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: "hp" | "xp" }) {
  const barColor = color === "hp" ? "bg-stat-hp" : "bg-stat-xp";
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 text-[9px] font-bold uppercase text-panel-foreground/60">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-bar-track">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-[9px] font-bold tabular-nums text-panel-foreground/80">
        {value}/{max}
      </span>
    </div>
  );
}

function CombatantCard({
  name,
  level,
  types,
  align,
  bars,
  isShiny,
}: {
  name: string;
  level: number;
  types: ElementalType[];
  align: "left" | "right";
  bars: { label: string; value: number; max: number; color: "hp" | "xp" }[];
  isShiny?: boolean;
}) {
  return (
    <div
      className={`w-44 rounded-xl border-2 px-3 py-2 shadow-lg backdrop-blur-sm ${
        isShiny ? "border-[#ffe066] bg-panel/90" : "border-gold-deep bg-panel/90"
      } ${align === "right" ? "text-right" : "text-left"}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`flex min-w-0 items-center gap-1 truncate text-sm font-extrabold text-gold-light ${
            align === "right" ? "flex-row-reverse" : ""
          }`}
        >
          {isShiny && <span title="Shiny">✨</span>}
          <span className="truncate">{name}</span>
          {types.map((type) => (
            <img key={type} src={typeIconSrc(type)} alt={TYPE_LABEL[type]} title={TYPE_LABEL[type]} className="h-4 w-4 shrink-0" />
          ))}
        </span>
        <span className="shrink-0 text-[11px] font-bold text-panel-foreground/70">Niv. {level}</span>
      </div>
      <div className="mt-1.5 flex flex-col gap-1">
        {bars.map((bar) => (
          <StatBar key={bar.label} {...bar} />
        ))}
      </div>
    </div>
  );
}

export function EncounterPage({ onLeave }: { onLeave: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const { state, lastHit, hitCount, setState, applyAttack, clear } = useBattleStore();
  const refreshTeamSidebar = useTeamStore((s) => s.refresh);
  const [pokeballs, setPokeballs] = useState<PokeballCatalogEntry[]>([]);
  const [team, setTeam] = useState<PlayerCreatureView[]>([]);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [levelUpKey, setLevelUpKey] = useState(0);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [showLeagueVictory, setShowLeagueVictory] = useState(false);
  const [shinyReveal, setShinyReveal] = useState<ShinyCaptureInfo | null>(null);

  useEffect(() => {
    if (!accessToken || state) return;
    getExplorationState(accessToken)
      .then(setState)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, state, setState, logout]);

  useEffect(() => {
    if (!accessToken) return;
    getShopCatalog(accessToken)
      .then((catalog) => setPokeballs(catalog.pokeballs))
      .catch(() => {});
  }, [accessToken]);

  // Plays the chime once per distinct encounter instance (startedAt changes on every
  // reroll, even if the same species/level comes up twice in a row) instead of on every
  // state refetch after an attack.
  useEffect(() => {
    if (state?.encounter?.isShiny) playShinySound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.encounter?.startedAt]);

  const awaitingSwitch = state !== null && state.encounter !== null && state.activeCreature === null;

  // Derived from state shape (not an ephemeral flag from the last attack) so this also
  // fires correctly when resuming an encounter left mid-switch on a fresh page load.
  useEffect(() => {
    if (!accessToken || !awaitingSwitch) return;
    listCreatures(accessToken)
      .then(setTeam)
      .catch(() => {});
  }, [accessToken, awaitingSwitch]);

  function triggerLevelUp(leveledUp: boolean) {
    setJustLeveledUp(leveledUp);
    if (leveledUp) setLevelUpKey((k) => k + 1);
  }

  async function handleAttack() {
    if (!accessToken || acting) return;
    setActing(true);
    setMessage(null);
    try {
      const result = await attackEncounter(accessToken);
      applyAttack(result.state, result.damageDealt, result.damageTaken);
      if (result.capturedShiny) {
        setShinyReveal(result.capturedShiny);
      } else if (result.leagueCleared) {
        setShowLeagueVictory(true);
      } else if (result.fainted && !result.canSwitch) {
        setMessage("Ton équipe est K.O. ! Retourne te soigner.");
      }
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActing(false);
    }
  }

  async function handleSwitch(creatureId: string) {
    if (!accessToken || acting) return;
    setActing(true);
    try {
      await activateCreature(accessToken, creatureId);
      const refreshed = await getExplorationState(accessToken);
      setState(refreshed);
      setMessage(null);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActing(false);
    }
  }

  async function handleFinish() {
    if (!accessToken || acting) return;
    setActing(true);
    try {
      const result = await finishEncounter(accessToken);
      setState(result.state);
      setMessage(`+${result.goldGained.toString()} or, +${result.xpGained} XP`);
      triggerLevelUp(result.leveledUp);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    } finally {
      setActing(false);
    }
  }

  async function handleCapture(pokeballKey: string) {
    if (!accessToken || acting) return;
    setActing(true);
    try {
      const result = await captureEncounter(accessToken, pokeballKey);
      setState(result.state);
      setPokeballs((prev) =>
        prev.map((p) => (p.key === pokeballKey ? { ...p, owned: Math.max(0, p.owned - 1) } : p)),
      );
      if (result.success && result.creature?.isShiny) {
        setShinyReveal({ name: result.creature.name, spriteFile: result.creature.spriteFile });
      } else {
        setMessage(result.success ? `${result.creature?.name} capturé !` : "Le Pokémon s'est échappé de la balle...");
      }
      triggerLevelUp(result.leveledUp);
      await refreshTeamSidebar(accessToken);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        if (body?.error === "duplicate_species_limit") {
          setMessage("Tu as déjà atteint la limite pour ce Pokémon (2 classiques + 1 shiny).");
        }
      }
    } finally {
      setActing(false);
    }
  }

  async function handleFlee() {
    if (!accessToken) return;
    try {
      await fleeEncounter(accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
    } finally {
      clear();
      onLeave();
    }
  }

  // A League run never resumes (see league.service.ts's challengeLeague) — leaving mid-fight
  // must actually flee server-side too, not just navigate away client-side, otherwise the
  // abandoned League encounter lingers and blocks entering a normal route afterwards.
  async function handleLeave() {
    if (accessToken && state?.encounter?.isLeagueBattle) {
      try {
        await fleeEncounter(accessToken);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return logout();
      }
    }
    clear();
    onLeave();
  }

  function handleCloseLeagueVictory() {
    setShowLeagueVictory(false);
    handleLeave();
  }

  const encounter = state?.encounter ?? null;
  const creature = state?.activeCreature ?? null;
  const defeated = encounter !== null && encounter.currentHp <= 0;
  const switchOptions = team.filter((c) => c.isOnTeam && c.currentHp > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border-[3px] border-gold bg-gold-deep/40 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div className="mb-1.5 flex items-center justify-between px-3 py-1 text-sm">
          <span className="font-extrabold text-gold-light">
            Or : {state ? state.goldBalance.toString() : "..."}
            {encounter?.isLeagueBattle ? " · 🏆 Combat de Ligue" : ""}
          </span>
          <button
            type="button"
            onClick={handleLeave}
            className="font-bold text-panel-foreground/70 underline-offset-2 transition-colors hover:text-gold-light hover:underline"
          >
            Quitter
          </button>
        </div>

        <div
          className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border-2 border-gold-deep bg-cover bg-center"
          style={{ backgroundImage: "url('/battle/battle-bg.png')" }}
        >
          <div className="absolute inset-0 bg-panel/20" />

          {encounter && (
            <>
              <div className="absolute right-3 top-3">
                <CombatantCard
                  name={encounter.name}
                  level={encounter.level}
                  types={encounter.types}
                  align="right"
                  isShiny={encounter.isShiny}
                  bars={[{ label: "PV", value: encounter.currentHp, max: encounter.maxHp, color: "hp" }]}
                />
              </div>
              <div className="absolute right-6 top-[32%] h-28 w-28 sm:h-48 sm:w-48">
                {encounter.isShiny && <ShinyBurst key={encounter.startedAt} />}
                <img
                  src={creatureSpriteSrc(encounter.spriteFile, encounter.isShiny)}
                  alt={encounter.name}
                  className={`h-full w-full object-contain [image-rendering:pixelated] drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] ${
                    encounter.isShiny ? "shiny-sprite" : ""
                  }`}
                />
              </div>
            </>
          )}

          {creature && (
            <>
              <div className="absolute bottom-3 left-3">
                <CombatantCard
                  name={creature.nickname ?? creature.name}
                  level={creature.level}
                  types={creature.types}
                  align="left"
                  isShiny={creature.isShiny}
                  bars={[
                    { label: "PV", value: creature.currentHp, max: creature.maxHp, color: "hp" },
                    { label: "XP", value: creature.xp, max: creature.xpToNextLevel, color: "xp" },
                  ]}
                />
              </div>
              <img
                src={creatureSpriteSrc(creature.spriteFile, creature.isShiny)}
                alt={creature.name}
                className={`absolute bottom-2 left-1/2 h-32 w-32 -translate-x-1/2 scale-x-[-1] object-contain [image-rendering:pixelated] drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] sm:h-60 sm:w-60 ${
                  creature.isShiny ? "shiny-sprite" : ""
                }`}
              />
            </>
          )}

          {!encounter && (
            <div className="absolute inset-0 flex items-center justify-center bg-panel/50 p-4 text-center text-sm font-bold text-panel-foreground">
              Aucun Pokémon sauvage ici pour l'instant.
            </div>
          )}
        </div>
      </div>

      {justLeveledUp && (
        <p key={levelUpKey} className="level-up-flash text-center">
          🌟 Niveau supérieur !
        </p>
      )}

      {message && (
        <p key={`msg-${hitCount}`} className="text-center text-sm font-bold text-gold-light">
          {message}
        </p>
      )}

      {lastHit && !message && (
        <p key={`hit-${hitCount}`} className="text-center text-sm font-bold text-stat-hp">
          -{lastHit.damageDealt} / -{lastHit.damageTaken}
        </p>
      )}

      <div className="flex items-center justify-center">
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-[2rem] border-[3px] border-gold bg-gold-deep/30 px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          {encounter && !defeated && creature && (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleAttack}
                disabled={acting}
                className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-[3px] border-gold-light bg-gradient-to-b from-gold-light to-gold-deep text-panel shadow-[0_6px_0_var(--gold-deep),0_10px_20px_rgba(0,0,0,0.5)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_var(--gold-deep)] disabled:opacity-60"
              >
                <Swords className="h-6 w-6" />
                <span className="mt-0.5 text-[11px] font-black uppercase tracking-wide">Attaquer</span>
              </button>
              <button
                type="button"
                onClick={handleFlee}
                className="rounded-full border-2 border-gold-deep bg-panel px-4 py-0.5 text-xs font-bold text-panel-foreground/80 transition-colors hover:text-gold-light"
              >
                Fuir
              </button>
            </div>
          )}

          {encounter && defeated && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleFinish}
                disabled={acting}
                className="rounded-full border-2 border-gold-deep bg-panel px-4 py-2 text-xs font-extrabold text-gold-light transition-colors hover:bg-panel-light disabled:opacity-50"
              >
                Achever (or + XP)
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                {pokeballs.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    disabled={acting || p.owned < 1}
                    onClick={() => handleCapture(p.key)}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-gold-deep bg-panel px-2 py-1.5 text-[10px] font-bold text-gold-light transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <img src={`/items/${p.spriteFile}`} alt={p.name} className="h-6 w-6 [image-rendering:pixelated]" />
                    {p.name} ({p.owned})
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleFlee}
                className="text-xs font-bold text-panel-foreground/70 underline-offset-2 hover:text-gold-light hover:underline"
              >
                Fuir
              </button>
            </div>
          )}

          {awaitingSwitch && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-stat-hp">Ton Pokémon est K.O. ! Choisis un remplaçant :</p>
              <div className="flex flex-wrap justify-center gap-2">
                {switchOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={acting}
                    onClick={() => handleSwitch(c.id)}
                    className="rounded-full border-2 border-gold-deep bg-panel px-3 py-1.5 text-[11px] font-bold text-gold-light transition-colors hover:bg-panel-light disabled:opacity-50"
                  >
                    {c.nickname ?? c.name} (Nv.{c.level}, {c.currentHp}/{c.maxHp} PV)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLeagueVictory && <LeagueVictoryModal onClose={handleCloseLeagueVictory} />}
      {shinyReveal && <ShinyCaptureModal creature={shinyReveal} onDone={() => setShinyReveal(null)} />}
    </div>
  );
}
