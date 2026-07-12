import { useEffect, useMemo, useState } from "react";
import { SPECIES_CATALOG } from "@farm-clicker/shared";
import { creatureSpriteSrc } from "../theme/typeColors";
import { playRaidCaptureSound } from "../theme/raidCaptureSound";
import { ConfettiBurst } from "./ConfettiBurst";

/** Shown to every winning participant individually, right after RaidVictoryAnimation — each
 * player's 1/1000 roll is independent (see raid.service.ts's resolveRaidVictory), so this
 * only ever reveals the LOCAL player's own outcome, never anyone else's.
 *
 * A wheel-of-fortune spin, not a straight reveal: the outcome is already decided server-side
 * (`caught`), so the wheel isn't actually random — it always lands on the correct half. The
 * wheel is a 2-color disc (green = caught, red = missed) rotated via a CSS transform whose
 * final angle is derived from `caught`: rotating the wheel clockwise by R degrees puts wheel-
 * space angle `(360 - R) mod 360` under the fixed top pointer, so landing the green half
 * (wheel-space [0,180)) needs R mod 360 in the low-180s-to-360 range and red the opposite —
 * R mod 360 = 270 (±jitter) lands mid-green, 90 (±jitter) lands mid-red. Several extra full
 * spins are added purely for the visual "wheel of fortune" spin-down effect. */
const SPIN_COUNT = 6;
const SPIN_MS = 3800;
const RESULT_HOLD_MS = 2800;

export function RaidCaptureRevealModal({
  speciesKey,
  caught,
  onDone,
}: {
  speciesKey: string;
  caught: boolean;
  onDone: () => void;
}) {
  const species = SPECIES_CATALOG[speciesKey];
  const [spinning, setSpinning] = useState(true);
  // Starts at 0 and is bumped to the final angle a beat after mount (below) — setting the
  // target rotation directly on the very first render would paint the wheel already at its
  // final position with nothing to transition FROM, so it'd just appear stopped instead of
  // visibly spinning.
  const [rotation, setRotation] = useState(0);

  const finalRotation = useMemo(() => {
    const jitter = (Math.random() - 0.5) * 100;
    return 360 * SPIN_COUNT + (caught ? 270 : 90) + jitter;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    playRaidCaptureSound(caught);
    // Double rAF: the first callback fires right before the next paint (still at the initial
    // 0deg render), the second one fires after that paint has actually committed — only then
    // is it safe to change the transform and have the CSS transition pick it up.
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setRotation(finalRotation));
    });
    const stopTimer = setTimeout(() => setSpinning(false), SPIN_MS);
    const doneTimer = setTimeout(onDone, SPIN_MS + RESULT_HOLD_MS);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(stopTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!species) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/90">
      {!spinning && caught && <ConfettiBurst />}

      <div className="relative z-10 flex flex-col items-center gap-5">
        <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-gold-light/80">
          {spinning ? "La roue tourne..." : " "}
        </p>

        <div className="relative flex h-60 w-60 items-center justify-center">
          <div className="raid-wheel-pointer" />
          <div
            className="raid-wheel"
            style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${SPIN_MS}ms` }}
          />
          <div className="raid-wheel-hub">
            <img
              src={creatureSpriteSrc(species.spriteFile, false)}
              alt={species.name}
              className="h-9 w-9 object-contain [image-rendering:pixelated]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-panel-foreground/70">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#22c55e]" /> {species.name}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ef4444]" /> Raté
          </span>
        </div>

        {!spinning && (
          <div className="raid-victory-title-in flex flex-col items-center gap-1 text-center">
            {caught ? (
              <>
                <p className="text-3xl font-black uppercase tracking-widest text-[#4ade80] drop-shadow-[0_0_20px_#22c55e]">
                  ✦ Capturé ! ✦
                </p>
                <p className="text-lg font-extrabold text-gold-light">{species.name} rejoint ta collection !</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black uppercase tracking-widest text-[#f87171]">Pas cette fois...</p>
                <p className="text-sm font-semibold text-panel-foreground/60">
                  {species.name} s'est échappé. Retente ta chance au prochain raid !
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
