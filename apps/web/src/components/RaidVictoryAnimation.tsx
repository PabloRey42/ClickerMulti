import { useEffect, useState } from "react";
import { SPECIES_CATALOG, findRaidBossByKey } from "@farm-clicker/shared";
import { creatureSpriteSrc } from "../theme/typeColors";
import { playRaidVictorySound } from "../theme/raidVictorySound";

/** The biggest, most staged reveal in the game (bigger than EvolutionAnimation) — the user
 * explicitly asked for an "extremely epic" raid victory animation. Impact shake (boss going
 * down) -> rays + sprite pop -> held trophy banner. ~4.4s total. */
const IMPACT_MS = 700;
const REVEAL_MS = 1300;
const HOLD_MS = 2400;
const TOTAL_MS = IMPACT_MS + REVEAL_MS + HOLD_MS;

type Phase = "impact" | "reveal" | "hold";

export function RaidVictoryAnimation({ raidBossKey, onDone }: { raidBossKey: string; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("impact");
  const boss = findRaidBossByKey(raidBossKey);
  const species = boss ? SPECIES_CATALOG[boss.speciesKey] : undefined;

  useEffect(() => {
    playRaidVictorySound();
    const timers = [
      setTimeout(() => setPhase("reveal"), IMPACT_MS),
      setTimeout(() => setPhase("hold"), IMPACT_MS + REVEAL_MS),
      setTimeout(onDone, TOTAL_MS),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!species) return null;
  const canSkip = phase === "reveal" || phase === "hold";

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black/95 ${
        phase === "impact" ? "raid-victory-shake" : ""
      }`}
      onClick={() => canSkip && onDone()}
    >
      {phase !== "impact" && <div className="raid-victory-rays" />}

      <div className="relative z-10 flex flex-col items-center gap-5">
        <p className="text-center text-sm font-extrabold uppercase tracking-[0.35em] text-gold-light/80">
          {phase === "impact" ? "..." : "Le raid est terminé !"}
        </p>

        {phase !== "impact" && (
          <div className="relative flex h-72 w-72 items-center justify-center">
            <img
              src={creatureSpriteSrc(species.spriteFile, false)}
              alt={species.name}
              className="raid-victory-sprite-pop h-64 w-64 object-contain [image-rendering:pixelated]"
            />
          </div>
        )}

        <div
          className={`flex min-h-[80px] flex-col items-center gap-1 text-center ${
            phase === "hold" ? "raid-victory-title-in" : "opacity-0"
          }`}
        >
          <p className="text-4xl font-black uppercase tracking-widest text-[#d9b8ff] drop-shadow-[0_0_24px_#ffe066]">
            🏆 Raid vaincu ! 🏆
          </p>
          <p className="text-lg font-extrabold text-gold-light">{species.name} s'effondre...</p>
        </div>
      </div>

      {canSkip && (
        <p className="pointer-events-none absolute bottom-6 text-center text-[10px] font-bold uppercase tracking-widest text-panel-foreground/50">
          Touche l'écran pour continuer
        </p>
      )}
    </div>
  );
}
