import { useEffect, useRef, useState } from "react";
import { findRaidBossByKey, SPECIES_CATALOG, type RaidLobbyStatus } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useRaidStore } from "../state/raidStore";
import { getSocket, connectSocket, disconnectSocket } from "../api/socket";
import { getRaidLobby, leaveRaidLobby, startRaidLobby, attackRaidBoss } from "../api/raid";
import { ApiError } from "../api/client";
import { creatureSpriteSrc, creatureSpriteTransform } from "../theme/typeColors";
import { RaidVictoryAnimation } from "../components/RaidVictoryAnimation";
import { RaidCaptureRevealModal } from "../components/RaidCaptureRevealModal";
import { RaidLossAnimation } from "../components/RaidLossAnimation";

const ERROR_MESSAGES: Record<string, string> = {
  raid_lobby_not_found: "Ce raid n'existe plus.",
  raid_not_participant: "Tu ne fais pas partie de ce groupe.",
  raid_not_creator: "Seul le créateur du groupe peut démarrer le combat.",
  raid_not_enough_participants: "Il faut au moins 2 dresseurs pour démarrer.",
  raid_lobby_not_joinable: "Ce raid a déjà démarré ou expiré.",
  raid_lobby_not_in_progress: "Le combat n'est pas en cours.",
  no_active_creature: "Tu n'as aucun Pokémon actif.",
  active_creature_fainted: "Ton Pokémon actif est K.O. — soigne-le d'abord.",
};

function formatCountdown(targetIso: string, now: number): string {
  const remainingMs = new Date(targetIso).getTime() - now;
  if (remainingMs <= 0) return "0:00";
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RaidLobbyPage({ lobbyId, onLeave }: { lobbyId: string; onLeave: () => void }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const snapshot = useRaidStore((s) => s.snapshot);
  const setSnapshot = useRaidStore((s) => s.setSnapshot);
  const clearSnapshot = useRaidStore((s) => s.clear);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showVictory, setShowVictory] = useState(false);
  const [showCaptureReveal, setShowCaptureReveal] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const prevStatusRef = useRef<RaidLobbyStatus | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    clearSnapshot();

    connectSocket();
    const socket = getSocket();
    socket.emit("raid:subscribe", { lobbyId });
    socket.on("raid:update", setSnapshot);

    getRaidLobby(accessToken, lobbyId)
      .then(setSnapshot)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });

    return () => {
      socket.off("raid:update", setSnapshot);
      socket.emit("raid:unsubscribe", { lobbyId });
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, lobbyId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Edge-triggers the victory/loss sequence exactly once, the moment the status actually
  // flips — not on every snapshot update while already resolved (which would replay the
  // animation on every subsequent broadcast, e.g. another participant's late attack landing
  // after the timer already expired the lobby).
  useEffect(() => {
    if (!snapshot) return;
    if (prevStatusRef.current !== "WON" && snapshot.status === "WON") setShowVictory(true);
    if (prevStatusRef.current !== "LOST" && snapshot.status === "LOST") setShowLoss(true);
    prevStatusRef.current = snapshot.status;
  }, [snapshot?.status]);

  async function handleStart() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await startRaidLobby(accessToken, lobbyId));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Impossible de démarrer le combat.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!accessToken || busy) return;
    setBusy(true);
    try {
      await leaveRaidLobby(accessToken, lobbyId);
      onLeave();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Impossible de quitter ce groupe.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAttack() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await attackRaidBoss(accessToken, lobbyId);
      setSnapshot(result.lobby);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Impossible d'attaquer.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!snapshot) {
    return (
      <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
        <p className="text-sm font-bold text-panel-foreground/70">Chargement du raid...</p>
      </section>
    );
  }

  const boss = findRaidBossByKey(snapshot.raidBossKey);
  const species = boss ? SPECIES_CATALOG[boss.speciesKey] : undefined;
  const me = snapshot.participants.find((p) => p.userId === user?.id);
  const isCreator = me?.isCreator ?? false;
  const bossHpPercent = Math.max(0, Math.min(100, (snapshot.bossCurrentHp / snapshot.bossMaxHp) * 100));

  return (
    <section className="rounded-3xl border-[3px] border-stat-pp bg-gold-deep/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black tracking-wide text-gold-light">{species?.name ?? "Raid"}</h1>
        {snapshot.status === "WAITING" ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleLeave}
            className="text-xs font-bold text-panel-foreground/70 underline-offset-2 hover:text-gold-light hover:underline disabled:opacity-60"
          >
            Quitter le groupe
          </button>
        ) : (
          <button
            type="button"
            onClick={onLeave}
            className="text-xs font-bold text-panel-foreground/70 underline-offset-2 hover:text-gold-light hover:underline"
          >
            Retour
          </button>
        )}
      </div>

      {species && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <img
            src={creatureSpriteSrc(species.spriteFile, false)}
            alt={species.name}
            style={{ transform: creatureSpriteTransform(species.spriteFile) }}
            className="h-32 w-32 object-contain [image-rendering:pixelated]"
          />
          <div className="w-full max-w-sm">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-panel-foreground/60">
              <span>PV du boss</span>
              <span>{Math.round(bossHpPercent)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-bar-track">
              <div className="h-full rounded-full bg-stat-hp transition-all" style={{ width: `${bossHpPercent}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 text-center">
        {snapshot.status === "WAITING" && (
          <p className="text-sm font-bold text-gold-light">
            Démarrage automatique dans {formatCountdown(snapshot.startsAt, now)}
          </p>
        )}
        {snapshot.status === "IN_PROGRESS" && snapshot.battleEndsAt && (
          <p className="text-sm font-bold text-gold-light">
            Temps restant : {formatCountdown(snapshot.battleEndsAt, now)}
          </p>
        )}
        {snapshot.status === "LOST" && (
          <p className="text-sm font-black uppercase tracking-wide text-stat-hp">
            Le temps est écoulé — le raid a échoué.
          </p>
        )}
        {snapshot.status === "EXPIRED" && (
          <p className="text-sm font-black uppercase tracking-wide text-panel-foreground/70">
            Pas assez de dresseurs — le groupe a expiré.
          </p>
        )}
      </div>

      {error && <p className="mb-2 text-center text-xs font-bold text-stat-hp">{error}</p>}

      <div className="mb-4 flex flex-col items-center gap-2">
        {snapshot.status === "WAITING" && isCreator && (
          <button
            type="button"
            disabled={busy || snapshot.participants.length < snapshot.minParticipants}
            onClick={handleStart}
            className="rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-5 py-2.5 text-sm font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50"
          >
            Démarrer maintenant
          </button>
        )}
        {snapshot.status === "IN_PROGRESS" && (
          <button
            type="button"
            disabled={busy}
            onClick={handleAttack}
            className="rounded-full border-2 border-stat-pp bg-gradient-to-b from-stat-pp to-gold px-6 py-3 text-base font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-60"
          >
            Attaquer !
          </button>
        )}
      </div>

      <h2 className="mb-2 text-center text-xs font-black uppercase tracking-widest text-panel-foreground/60">
        Dresseurs ({snapshot.participants.length}
        {snapshot.status === "WAITING" ? `/${snapshot.minParticipants}+` : ""})
      </h2>
      <ul className="flex flex-col gap-2">
        {snapshot.participants.map((p) => (
          <li key={p.userId} className="rounded-xl border-2 border-gold-deep bg-panel px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-extrabold text-gold-light">
                {p.username} {p.isCreator ? "👑" : ""}
              </span>
              {snapshot.status !== "WAITING" && (
                <span className="shrink-0 text-[10px] font-bold text-panel-foreground/60">
                  {p.damageDealt.toLocaleString("fr-FR")} dégâts
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.team.map((c) => (
                <div
                  key={c.id}
                  title={`${c.nickname ?? c.name} — Nv.${c.level}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    c.isActive ? "border-gold" : "border-gold-deep/60"
                  } bg-panel-light ${c.currentHp <= 0 ? "opacity-40 grayscale" : ""}`}
                >
                  <img
                    src={creatureSpriteSrc(c.spriteFile, c.isShiny)}
                    alt={c.name}
                    style={{ transform: creatureSpriteTransform(c.spriteFile) }}
                    className="h-9 w-9 object-contain [image-rendering:pixelated]"
                  />
                </div>
              ))}
              {p.team.length === 0 && (
                <span className="text-[10px] font-semibold text-panel-foreground/50">Aucune équipe.</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {showVictory && boss && (
        <RaidVictoryAnimation
          raidBossKey={boss.key}
          onDone={() => {
            setShowVictory(false);
            setShowCaptureReveal(true);
          }}
        />
      )}
      {showCaptureReveal && boss && (
        <RaidCaptureRevealModal
          speciesKey={boss.speciesKey}
          caught={me?.caughtBoss ?? false}
          onDone={() => setShowCaptureReveal(false)}
        />
      )}
      {showLoss && boss && <RaidLossAnimation raidBossKey={boss.key} onDone={() => setShowLoss(false)} />}
    </section>
  );
}
