import { useEffect, type CSSProperties } from "react";
import type { PlayerCreatureView } from "@farm-clicker/shared";
import { creatureSpriteSrc } from "../theme/typeColors";
import { playElectricShockSound } from "../theme/electricSound";

const BOLT_OFFSETS: { tx: number; ty: number; delay: number; size: number }[] = [
  { tx: -140, ty: -110, delay: 0.6, size: 26 },
  { tx: 130, ty: -120, delay: 0.68, size: 20 },
  { tx: -160, ty: 20, delay: 0.76, size: 30 },
  { tx: 150, ty: 40, delay: 0.62, size: 22 },
  { tx: -60, ty: -160, delay: 0.84, size: 18 },
  { tx: 70, ty: 150, delay: 0.7, size: 26 },
  { tx: -100, ty: 130, delay: 0.78, size: 20 },
  { tx: 110, ty: -150, delay: 0.9, size: 24 },
];

/** The whole screen "takes a jolt" (shake + strobing flash) before settling into an
 * electric-blue reveal — this is a deliberate one-time secret, so unlike the shiny capture
 * reveal it has a manual close button instead of an auto-dismiss timer. */
export function DynavoltUnlockModal({ creature, onClose }: { creature: PlayerCreatureView; onClose: () => void }) {
  useEffect(() => {
    playElectricShockSound();
    document.body.classList.add("electric-shock-screen");
    const timer = setTimeout(() => document.body.classList.remove("electric-shock-screen"), 750);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove("electric-shock-screen");
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center overflow-hidden bg-black/85">
      <div className="electric-shock-flash" />
      <div className="pointer-events-none absolute inset-0 overflow-visible">
        {BOLT_OFFSETS.map((bolt, i) => (
          <span
            key={i}
            className="electric-bolt"
            style={
              {
                "--star-tx": `${bolt.tx}px`,
                "--star-ty": `${bolt.ty}px`,
                animationDelay: `${bolt.delay}s`,
                fontSize: `${bolt.size}px`,
              } as CSSProperties
            }
          >
            ⚡
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <img
            src={creatureSpriteSrc(creature.spriteFile, false)}
            alt={creature.name}
            className="dynavolt-sprite-pop h-48 w-48 object-contain [image-rendering:pixelated]"
          />
        </div>

        <div className="dynavolt-title flex flex-col items-center gap-1 text-center">
          <p className="text-3xl font-black uppercase tracking-widest text-[#eaffff] drop-shadow-[0_0_20px_#66e0ff]">
            ⚡ Easter Egg déclenché ! ⚡
          </p>
          <p className="text-lg font-extrabold text-gold-light">{creature.name} rejoint ta collection !</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="dynavolt-title mt-2 rounded-full border-[3px] border-[#66e0ff] bg-gradient-to-b from-[#eaffff] to-[#66e0ff] px-6 py-3 text-sm font-black uppercase tracking-wide text-panel shadow-[0_6px_0_#2fa9d6,0_10px_20px_rgba(0,0,0,0.5)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#2fa9d6]"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
