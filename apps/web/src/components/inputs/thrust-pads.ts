import type { ThrustPad } from "@void-drift/core";

/**
 * One gutter's thrust-pad assembly (controls spec, Touch pads): an upper turn
 * pad and a lower burn pad nested in the bottom corner, split by a seam that
 * slopes down from the bezel inward. Drawing and hit-testing both read these
 * polygons, so what lights is what was touched.
 */

export type PadSide = "left" | "right";
export type PadRole = "turn" | "burn";
export type Point = readonly [x: number, y: number];

/** Burn pad width as a share of the gutter width. */
export const BURN_WIDTH_RATIO = 0.84;
/** Burn pad height at the bezel as a share of the assembly height. */
export const BURN_HEIGHT_RATIO = 0.54;
/** The seam (and the assembly's top edge) slopes this far below horizontal, from the bezel inward: a 60° seam. */
export const SEAM_SLOPE_DEG = 30;
/** Markings sit this far in from the screen edge, the same on both pads. */
export const MARK_INSET_PX = 72;

export const PAD_IDS = {
  left: { turn: "leftUpper", burn: "leftLower" },
  right: { turn: "rightUpper", burn: "rightLower" },
} as const satisfies Record<PadSide, Record<PadRole, ThrustPad>>;

export interface PadPane {
  pad: ThrustPad;
  role: PadRole;
  /** Closed polygon in the assembly's CSS pixels, origin top-left. */
  points: readonly Point[];
  /** Centre of the pane's two-line marking. */
  mark: Point;
}

export interface PadAssembly {
  side: PadSide;
  width: number;
  height: number;
  /** The whole assembly: both panes together cover exactly this polygon. */
  outline: readonly Point[];
  /** Turn pane first, then burn pane. */
  panes: readonly [PadPane, PadPane];
}

/** Lays out one gutter's assembly in a `width` × `height` CSS-pixel box; the bezel is the screen edge on `side`. */
export function padAssembly(
  side: PadSide,
  width: number,
  height: number,
): PadAssembly {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const slope = Math.tan((SEAM_SLOPE_DEG * Math.PI) / 180);
  const burnWidth = w * BURN_WIDTH_RATIO;
  const burnTop = h * (1 - BURN_HEIGHT_RATIO);
  // `u` runs inward from the bezel; `y` grows downward.
  const at = (u: number, y: number): Point => [side === "left" ? u : w - u, y];
  const top = (u: number) => Math.min(h, u * slope);
  const seam = (u: number) => Math.min(h, burnTop + u * slope);
  const inset = Math.min(MARK_INSET_PX, burnWidth / 2);
  const turn: PadPane = {
    pad: PAD_IDS[side].turn,
    role: "turn",
    points: [
      at(0, 0),
      at(w, top(w)),
      at(w, h),
      at(burnWidth, h),
      at(burnWidth, seam(burnWidth)),
      at(0, burnTop),
    ],
    mark: at(inset, (top(inset) + seam(inset)) / 2),
  };
  const burn: PadPane = {
    pad: PAD_IDS[side].burn,
    role: "burn",
    points: [
      at(0, burnTop),
      at(burnWidth, seam(burnWidth)),
      at(burnWidth, h),
      at(0, h),
    ],
    mark: at(inset, (seam(inset) + h) / 2),
  };
  return {
    side,
    width: w,
    height: h,
    outline: [at(0, 0), at(w, top(w)), at(w, h), at(0, h)],
    panes: [turn, burn],
  };
}

/** Even-odd ray cast: true when (x, y) lies inside `points`. */
export function insidePolygon(points: readonly Point[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** The pad under (x, y) in assembly CSS pixels, or null outside the assembly. */
export function hitPad(
  assembly: PadAssembly,
  x: number,
  y: number,
): ThrustPad | null {
  for (const pane of assembly.panes)
    if (insidePolygon(pane.points, x, y)) return pane.pad;
  return null;
}

/** SVG `points` attribute for a polygon. */
export function svgPoints(points: readonly Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}
