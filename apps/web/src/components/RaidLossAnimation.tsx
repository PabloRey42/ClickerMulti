import { useEffect, useState } from "react";
import { findRaidBossByKey, SPECIES_CATALOG } from "@farm-clicker/shared";
import { creatureSpriteSrc } from "../theme/typeColors";
import { playRaidLossSound } from "../theme/raidLossSound";

/** Deliberately more understated than RaidVictoryAnimation (a loss shouldn't feel as
 * "produced" as a win) but still a real beat, not just inline text: a red vignette closes
 * in and the boss sprite drains to grayscale/sinks, then a held "Raid échoué" title. */
const FADE_MS = 900;
const HOLD_MS = 2600;
const TOTAL_MS = FADE_MS + HOLD_MS;

type Phase = "fade" | "hold";

export function RaidLossAnimation({ raidBossKey, onDone }: { raidBossKey: string; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("fade");
  const boss = findRaidBossByKey(raidBossKey);
  const species = boss ? SPECIES_CATALOG[boss.speciesKey] : undefined;

  useEffect(() => {
    playRaidLossSound();
    const timers = [setTimeout(() => setPhase("hold"), FADE_MS), setTimeout(onDone, TOTAL_MS)];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!species) return null;
  const canSkip = phase === "hold";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black/90"
      onClick={() => canSkip && onDone()}
    >
      <div className="raid-loss-vignette" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative flex h-64 w-64 items-center justify-center">
          <img
            src={creatureSpriteSrc(species.spriteFile, false)}
            alt={species.name}
            className="raid-loss-sprite-fade h-56 w-56 object-contain [image-rendering:pixelated]"
          />
        </div>

        <div
          className={`flex min-h-[80px] flex-col items-center gap-1 text-center ${
            phase === "hold" ? "raid-victory-title-in" : "opacity-0"
          }`}
        >
          <p className="text-3xl font-black uppercase tracking-widest text-[#f87171] drop-shadow-[0_0_18px_#7f1d1d]">
            Raid échoué...
          </p>
          <p className="text-sm font-semibold text-panel-foreground/60">
            {species.name} a résisté jusqu'au bout. Retentez votre chance !
          </p>
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
