import type { CSSProperties } from "react";

const CONFETTI_COLORS = ["#ffe066", "#ff6b6b", "#4dabf7", "#69db7c", "#da77f2", "#ffa94d"];

/** Fixed spread of confetti pieces — a celebratory burst is a consistent pattern, not
 * randomized, same idiom as EncounterPage's SHINY_STAR_OFFSETS. Extracted from
 * LeagueVictoryModal so any other "you just won something big" screen (e.g. the raid boss
 * capture wheel) can reuse the exact same burst instead of duplicating this array. */
const CONFETTI_PIECES: { left: number; delay: number; duration: number; rotate: number; colorIndex: number }[] = [
  { left: 2, delay: 0, duration: 2.6, rotate: 220, colorIndex: 0 },
  { left: 8, delay: 0.3, duration: 2.1, rotate: -180, colorIndex: 1 },
  { left: 14, delay: 0.1, duration: 2.8, rotate: 300, colorIndex: 2 },
  { left: 20, delay: 0.5, duration: 2.3, rotate: -260, colorIndex: 3 },
  { left: 26, delay: 0.2, duration: 2.5, rotate: 200, colorIndex: 4 },
  { left: 32, delay: 0.6, duration: 2.0, rotate: -320, colorIndex: 5 },
  { left: 38, delay: 0.05, duration: 2.7, rotate: 260, colorIndex: 1 },
  { left: 44, delay: 0.35, duration: 2.2, rotate: -200, colorIndex: 2 },
  { left: 50, delay: 0.15, duration: 2.9, rotate: 240, colorIndex: 0 },
  { left: 56, delay: 0.45, duration: 2.1, rotate: -280, colorIndex: 3 },
  { left: 62, delay: 0.25, duration: 2.6, rotate: 320, colorIndex: 4 },
  { left: 68, delay: 0.55, duration: 2.0, rotate: -220, colorIndex: 5 },
  { left: 74, delay: 0.1, duration: 2.4, rotate: 280, colorIndex: 1 },
  { left: 80, delay: 0.4, duration: 2.8, rotate: -300, colorIndex: 2 },
  { left: 86, delay: 0.2, duration: 2.3, rotate: 260, colorIndex: 0 },
  { left: 92, delay: 0.5, duration: 2.5, rotate: -240, colorIndex: 3 },
  { left: 5, delay: 0.7, duration: 2.4, rotate: 300, colorIndex: 2 },
  { left: 17, delay: 0.85, duration: 2.1, rotate: -260, colorIndex: 5 },
  { left: 29, delay: 0.75, duration: 2.7, rotate: 220, colorIndex: 4 },
  { left: 41, delay: 0.9, duration: 2.2, rotate: -320, colorIndex: 1 },
  { left: 59, delay: 0.65, duration: 2.6, rotate: 280, colorIndex: 0 },
  { left: 71, delay: 0.8, duration: 2.0, rotate: -200, colorIndex: 3 },
  { left: 83, delay: 0.95, duration: 2.9, rotate: 240, colorIndex: 5 },
  { left: 95, delay: 0.6, duration: 2.3, rotate: -280, colorIndex: 2 },
];

export function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI_PIECES.map((piece, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: CONFETTI_COLORS[piece.colorIndex],
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-rotate": `${piece.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
