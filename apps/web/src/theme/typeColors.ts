import type { ElementalType } from "@farm-clicker/shared";

/** Canonical real-game type colors (used as inline styles, not Tailwind classes, since
 * Tailwind's JIT scanner can't pick up dynamically interpolated arbitrary-value classes). */
export const TYPE_ACCENT: Record<ElementalType, string> = {
  normal: "#A8A878",
  feu: "#F08030",
  eau: "#6890F0",
  plante: "#78C850",
  electrique: "#F8D030",
  glace: "#98D8D8",
  combat: "#C03028",
  poison: "#A040A0",
  sol: "#E0C068",
  vol: "#A890F0",
  psy: "#F85888",
  insecte: "#A8B820",
  roche: "#B8A038",
  spectre: "#705898",
  dragon: "#7038F8",
  tenebres: "#705848",
  acier: "#B8B8D0",
  fee: "#EE99AC",
};

export const TYPE_LABEL: Record<ElementalType, string> = {
  normal: "Normal",
  feu: "Feu",
  eau: "Eau",
  plante: "Plante",
  electrique: "Électrik",
  glace: "Glace",
  combat: "Combat",
  poison: "Poison",
  sol: "Sol",
  vol: "Vol",
  psy: "Psy",
  insecte: "Insecte",
  roche: "Roche",
  spectre: "Spectre",
  dragon: "Dragon",
  tenebres: "Ténèbres",
  acier: "Acier",
  fee: "Fée",
};

/** Type icon under /types/ in the web app's public assets. */
export function typeIconSrc(type: ElementalType): string {
  return `/types/${type}.png`;
}

/** Shiny variants live under /sprites/shiny/ using the same filename as the normal sprite. */
export function creatureSpriteSrc(spriteFile: string, isShiny: boolean): string {
  return isShiny ? `/sprites/shiny/${spriteFile}` : `/sprites/${spriteFile}`;
}

/** Types whose accent color is light enough to need dark text for contrast. */
const DARK_TEXT_TYPES = new Set<ElementalType>([
  "normal",
  "feu",
  "plante",
  "electrique",
  "glace",
  "sol",
  "vol",
  "psy",
  "insecte",
  "roche",
  "acier",
  "fee",
]);

export function typeBadgeTextClassName(type: ElementalType): string {
  return DARK_TEXT_TYPES.has(type) ? "text-black/75" : "text-white";
}

export function typeBadgeStyle(type: ElementalType): { backgroundColor: string } {
  return { backgroundColor: TYPE_ACCENT[type] };
}
