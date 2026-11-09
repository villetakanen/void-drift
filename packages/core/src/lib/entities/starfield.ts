/**
 * World-anchored background starfield without bounds.
 *
 * The world is divided into square cells, and each cell holds one star whose
 * position, size and alpha come from a hash of the cell's integer coordinates.
 * The pattern is therefore identical on every run and frame, covers any view
 * rectangle, and is enumerated over the visible cells only, with no allocation.
 */

/** Seed of the background pattern. */
export const STARFIELD_SEED = 2026;
/**
 * Cell side in world units. One star per cell keeps the original density of
 * 200 stars in a 3000-unit square.
 */
export const STARFIELD_CELL = 3000 / Math.sqrt(200);
/** Star radius range in world units. */
export const STARFIELD_MIN_SIZE = 0.5;
export const STARFIELD_MAX_SIZE = 2.5;

export interface WorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StarVisitor = (
  x: number,
  y: number,
  size: number,
  alpha: number,
) => void;

function mix(value: number) {
  let h = value | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Most cells visited in one call. Normal play stays far below it; only a very
 * short active area (a tiny widest zoom) reaches it, and coarser cells take over.
 */
export const STARFIELD_CELL_BUDGET = 4096;

/**
 * Cell side used for `view`: the base cell, doubled until the cells that can
 * touch the view fit the budget. Each doubling is its own seeded, world-anchored
 * layer, so the choice depends on the view size only and stays deterministic.
 */
export function starfieldCell(view: WorldRect) {
  const span = STARFIELD_MAX_SIZE * 2;
  let cell = STARFIELD_CELL;
  while (
    ((view.width + span) / cell + 2) * ((view.height + span) / cell + 2) >
    STARFIELD_CELL_BUDGET
  )
    cell *= 2;
  return cell;
}

/** Visits every star whose disc can touch `view`, in a stable order. */
export function forEachStar(view: WorldRect, visit: StarVisitor) {
  if (
    !Number.isFinite(view.x) ||
    !Number.isFinite(view.y) ||
    !Number.isFinite(view.width) ||
    !Number.isFinite(view.height)
  )
    return;
  const cell = starfieldCell(view);
  // The base layer keeps the plain seed; coarser layers mix in their level.
  const level = Math.round(Math.log2(cell / STARFIELD_CELL));
  const seed = STARFIELD_SEED ^ Math.imul(level, 0x2545f491);
  const reach = STARFIELD_MAX_SIZE;
  const firstX = Math.floor((view.x - reach) / cell);
  const lastX = Math.floor((view.x + view.width + reach) / cell);
  const firstY = Math.floor((view.y - reach) / cell);
  const lastY = Math.floor((view.y + view.height + reach) / cell);
  for (let iy = firstY; iy <= lastY; iy++) {
    for (let ix = firstX; ix <= lastX; ix++) {
      let h = mix(Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iy, 0x165667b1) ^ seed);
      const u = h / 4294967296;
      h = mix(h + 0x9e3779b9);
      const v = h / 4294967296;
      h = mix(h + 0x9e3779b9);
      const size =
        (h / 4294967296) * (STARFIELD_MAX_SIZE - STARFIELD_MIN_SIZE) +
        STARFIELD_MIN_SIZE;
      h = mix(h + 0x9e3779b9);
      const alpha = (h / 4294967296) * 0.5 + 0.1;
      visit((ix + u) * cell, (iy + v) * cell, size, alpha);
    }
  }
}
