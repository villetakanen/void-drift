import type { FigureIcon } from "@void-drift/mode-a";

/** Placeholder glyphs, 12 units square. The game has no icons for these yet. */
export const FIGURE_GLYPH: Record<FigureIcon, string> = {
  mass: "M4 1h4v2h1.5L11 11H1L2.5 3H4z",
  thrust: "M1 2l5 4-5 4zM6 2l5 4-5 4z",
  energy: "M7 0L2 7h3l-1 5 6-7H7z",
  cruise: "M1 11L6 1l5 10H9L6 5l-3 6z",
  damage: "M6 0l1.5 4L12 6 7.5 8 6 12 4.5 8 0 6l4.5-2z",
  reach: "M0 6l3-3v2h6V3l3 3-3 3V7H3v2z",
  store: "M2 2h8v9H2zM4 0h4v2H4z",
};
