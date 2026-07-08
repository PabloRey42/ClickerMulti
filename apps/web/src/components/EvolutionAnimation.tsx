import { useEffect, useState, type CSSProperties } from "react";
import { SPECIES_CATALOG, type EvolutionStep } from "@farm-clicker/shared";
import { creatureSpriteSrc } from "../theme/typeColors";
import { playEvolutionSound } from "../theme/evolutionSound";

/** Phase timing, in ms. Deliberately the longest, most staged reveal in the game (the user
 * asked for the most epic animation, minimum 6s) — real Pokémon games' evolution sequence is
 * the model: silhouette build-up, whiteout, silhouette of the new form, second whiteout,
 * full-color pop-in reveal, then a held congratulations banner. Total run time is ~7.3s. */
const CHARGE_MS = 2200;
// Matches .evolution-flash's own 0.5s CSS animation duration exactly, so the flash div is
// never yanked out of the DOM mid-fade.
const FLASH1_MS = 500;
const CHARGE_NEW_MS = 2000;
const REVEAL_MS = 900;
const HOLD_MS = 1900;
const TOTAL_MS = CHARGE_MS + FLASH1_MS + CHARGE_NEW_MS + REVEAL_MS + HOLD_MS;

type Phase = "charge" | "flash1" | "chargeNew" | "reveal" | "hold";

/** Fixed radiating offsets for the reveal burst — deterministic, same idiom as every other
 * one-shot sparkle burst in this codebase (never Math.random()). */
const BURST_OFFSETS: { tx: number; ty: number; delay: number; size: number }[] = [
  { tx: -150, ty: -120, delay: 0, size: 24 },
  { tx: 140, ty: -130, delay: 0.08, size: 20 },
  { tx: -170, ty: 20, delay: 0.16, size: 28 },
  { tx: 160, ty: 40, delay: 0.05, size: 22 },
  { tx: -70, ty: -170, delay: 0.24, size: 18 },
  { tx: 80, ty: 160, delay: 0.12, size: 26 },
  { tx: -110, ty: 140, delay: 0.2, size: 20 },
  { tx: 120, ty: -160, delay: 0.28, size: 24 },
  { tx: 0, ty: -195, delay: 0.32, size: 18 },
  { tx: 0, ty: 195, delay: 0.36, size: 22 },
  { tx: -200, ty: -40, delay: 0.4, size: 20 },
  { tx: 200, ty: -10, delay: 0.44, size: 26 },
];

function EvolutionBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <div className="shiny-capture-ring" style={{ borderColor: "#fff6d5" }} />
      <div className="shiny-capture-ring" style={{ animationDelay: "0.4s", borderColor: "#d9b8ff" }} />
      <div className="shiny-capture-ring" style={{ animationDelay: "0.8s", borderColor: "#66e0ff" }} />
      {BURST_OFFSETS.map((star, i) => (
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

export function EvolutionAnimation({
  step,
  isShiny,
  onDone,
}: {
  step: EvolutionStep;
  isShiny: boolean;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("charge");
  const fromSpecies = SPECIES_CATALOG[step.fromSpeciesKey];
  const toSpecies = SPECIES_CATALOG[step.toSpeciesKey];

  useEffect(() => {
    playEvolutionSound();
    const timers = [
      setTimeout(() => setPhase("flash1"), CHARGE_MS),
      setTimeout(() => setPhase("chargeNew"), CHARGE_MS + FLASH1_MS),
      setTimeout(() => setPhase("reveal"), CHARGE_MS + FLASH1_MS + CHARGE_NEW_MS),
      setTimeout(() => setPhase("hold"), CHARGE_MS + FLASH1_MS + CHARGE_NEW_MS + REVEAL_MS),
      setTimeout(onDone, TOTAL_MS),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showingNew = phase === "chargeNew" || phase === "reveal" || phase === "hold";
  const silhouette = phase === "charge" || phase === "chargeNew";
  const displaySpecies = showingNew ? toSpecies : fromSpecies;
  const canSkip = phase === "reveal" || phase === "hold";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/90"
      onClick={() => canSkip && onDone()}
    >
      <div className="evolution-bg-rays" />
      {(phase === "flash1" || phase === "reveal") && <div className="evolution-flash" />}
      {phase === "reveal" && <EvolutionBurst />}

      <div className="relative z-10 flex flex-col items-center gap-5">
        <p className="evolution-caption text-center text-sm font-extrabold uppercase tracking-[0.3em] text-gold-light/80">
          {phase === "hold" ? " " : "Qu'est-ce que c'est ?!"}
        </p>

        <div className="relative flex h-64 w-64 items-center justify-center">
          <img
            key={showingNew ? "to" : "from"}
            src={creatureSpriteSrc(displaySpecies.spriteFile, isShiny)}
            alt={displaySpecies.name}
            className={[
              "h-56 w-56 object-contain [image-rendering:pixelated]",
              silhouette ? "evolution-silhouette" : "",
              phase === "charge" || phase === "chargeNew" ? "evolution-charge-pulse" : "",
              phase === "reveal" ? "evolution-reveal-pop" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </div>

        <div
          className={`flex min-h-[64px] flex-col items-center gap-1 text-center ${
            phase === "hold" ? "evolution-title-in" : "opacity-0"
          }`}
        >
          <p className="text-3xl font-black uppercase tracking-widest text-[#fff6d5] drop-shadow-[0_0_20px_#ffe066]">
            ✨ Félicitations ! ✨
          </p>
          <p className="text-lg font-extrabold text-gold-light">
            {fromSpecies.name} a évolué en {toSpecies.name} !
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
