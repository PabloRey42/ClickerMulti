import { useEffect } from "react";
import { SPECIES_CATALOG } from "@farm-clicker/shared";
import { creatureSpriteSrc } from "../theme/typeColors";
import { playRaidCaptureSound } from "../theme/raidCaptureSound";

/** Shown to every winning participant individually, right after RaidVictoryAnimation — each
 * player's 1/1000 roll is independent (see raid.service.ts's resolveRaidVictory), so this
 * only ever reveals the LOCAL player's own outcome, never anyone else's. No close button,
 * same "can't be blown past by rapid clicking" idiom as ShinyCaptureModal. */
const REVEAL_DURATION_MS = 4000;

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

  useEffect(() => {
    playRaidCaptureSound(caught);
    const timer = setTimeout(onDone, REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!species) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/85">
      {caught && <div className="shiny-capture-flash" />}
      {caught && <div className="shiny-capture-rays" />}
      {caught && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="shiny-capture-ring" style={{ borderColor: "#d9b8ff" }} />
          <div className="shiny-capture-ring" style={{ animationDelay: "0.5s", borderColor: "#ffe066" }} />
          <div className="shiny-capture-ring" style={{ animationDelay: "1s", borderColor: "#d9b8ff" }} />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <img
            src={creatureSpriteSrc(species.spriteFile, false)}
            alt={species.name}
            className={`h-48 w-48 object-contain [image-rendering:pixelated] ${
              caught ? "shiny-capture-sprite" : "opacity-60"
            }`}
          />
        </div>

        <div className="shiny-capture-title flex flex-col items-center gap-1 text-center">
          {caught ? (
            <>
              <p className="text-3xl font-black uppercase tracking-widest text-[#d9b8ff] drop-shadow-[0_0_20px_#ffe066]">
                ✦ Capturé ! ✦
              </p>
              <p className="text-lg font-extrabold text-gold-light">{species.name} rejoint ta collection !</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black uppercase tracking-widest text-panel-foreground/80">
                Pas cette fois...
              </p>
              <p className="text-sm font-semibold text-panel-foreground/60">
                {species.name} s'est échappé. Retente ta chance au prochain raid !
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
