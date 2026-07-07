import { useEffect, type CSSProperties } from "react";
import type { ShinyCaptureInfo } from "@farm-clicker/shared";
import { creatureSpriteSrc } from "../theme/typeColors";
import { playShinySound } from "../theme/shinySound";

/** Total time the reveal stays on screen before auto-dismissing. Deliberately long enough
 * that it can't be blown past by rapid clicking/autoclicking — there is no close button,
 * the overlay just absorbs clicks and calls onDone itself once this elapses. */
const REVEAL_DURATION_MS = 4200;

const SPARKLE_OFFSETS: { tx: number; ty: number; delay: number; size: number }[] = [
  { tx: -140, ty: -110, delay: 0, size: 22 },
  { tx: 130, ty: -120, delay: 0.1, size: 18 },
  { tx: -160, ty: 20, delay: 0.2, size: 26 },
  { tx: 150, ty: 40, delay: 0.05, size: 20 },
  { tx: -60, ty: -160, delay: 0.3, size: 16 },
  { tx: 70, ty: 150, delay: 0.15, size: 24 },
  { tx: -100, ty: 130, delay: 0.25, size: 18 },
  { tx: 110, ty: -150, delay: 0.35, size: 22 },
  { tx: 0, ty: -180, delay: 0.4, size: 16 },
  { tx: 0, ty: 180, delay: 0.45, size: 20 },
  { tx: -190, ty: -40, delay: 0.5, size: 18 },
  { tx: 190, ty: -10, delay: 0.55, size: 24 },
];

function SparkleBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {SPARKLE_OFFSETS.map((star, i) => (
        <span
          key={i}
          className="shiny-reveal-star"
          style={
            {
              "--star-tx": `${star.tx}px`,
              "--star-ty": `${star.ty}px`,
              animationDelay: `${star.delay}s`,
              fontSize: `${star.size}px`,
            } as CSSProperties
          }
        >
          ✦
        </span>
      ))}
    </div>
  );
}

export function ShinyCaptureModal({ creature, onDone }: { creature: ShinyCaptureInfo; onDone: () => void }) {
  useEffect(() => {
    playShinySound();
    const timer = setTimeout(onDone, REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/85">
      <div className="shiny-capture-flash" />
      <div className="shiny-capture-rays" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="shiny-capture-ring" />
        <div className="shiny-capture-ring" style={{ animationDelay: "0.5s" }} />
        <div className="shiny-capture-ring" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <SparkleBurst />
          <img
            src={creatureSpriteSrc(creature.spriteFile, true)}
            alt={creature.name}
            className="shiny-capture-sprite h-48 w-48 object-contain [image-rendering:pixelated]"
          />
        </div>

        <div className="shiny-capture-title flex flex-col items-center gap-1 text-center">
          <p className="text-3xl font-black uppercase tracking-widest text-[#fff6d5] drop-shadow-[0_0_20px_#ffe066]">
            ✨ Pokémon Shiny ! ✨
          </p>
          <p className="text-lg font-extrabold text-gold-light">{creature.name} rejoint ta collection !</p>
        </div>
      </div>
    </div>
  );
}
