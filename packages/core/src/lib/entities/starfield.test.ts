import { expect, it } from "vitest";
import { CAMERA_ARENA_RADIUS, Camera } from "../physics/Camera";
import {
  forEachStar,
  STARFIELD_CELL_BUDGET,
  starfieldCell,
  type WorldRect,
} from "./starfield";

const HEIGHT = 1080;
const STAR = { x: 960, y: 540 };
// Example gutters in logical units at a 1080-unit-tall stage.
const SIDE = 180;
const EDGE = 48;

function stars(view: WorldRect) {
  const out: Array<[number, number, number, number]> = [];
  forEachStar(view, (x, y, size, alpha) => out.push([x, y, size, alpha]));
  return out;
}

/** Visible world rectangles from real cameras across widths, zooms and positions. */
function views() {
  const out: WorldRect[] = [];
  for (const ratio of [4 / 3, 16 / 9, 64 / 27, 32 / 9]) {
    for (const [x, y] of [
      [STAR.x, STAR.y],
      [STAR.x + CAMERA_ARENA_RADIUS, STAR.y],
      [STAR.x - CAMERA_ARENA_RADIUS * 1.5, STAR.y - CAMERA_ARENA_RADIUS],
    ]) {
      const c = new Camera({
        viewportWidth: HEIGHT * ratio,
        viewportHeight: HEIGHT,
        fitWidth: HEIGHT * ratio - SIDE * 2,
        fitHeight: HEIGHT - EDGE * 2,
      });
      for (let level = 0; level < 5; level++) {
        c.frame(x, y, x, y, 160, 4, true, 5, level);
        if (level === 0) c.pos.set(x, y);
        out.push({ ...c.getViewRect() });
      }
    }
  }
  return out;
}

/**
 * Widest views of very short stages that still pass the 4:3 gate: a stage of
 * fixed CSS width whose height shrinks towards twice the edge gutter, so the
 * active height in logical units approaches zero.
 */
function extremeViews() {
  const out: WorldRect[] = [];
  const cssWidth = 1600;
  for (const cssHeight of [160, 120, 100, 97, 96.01, 96]) {
    const scale = cssHeight / HEIGHT;
    const width = cssWidth / scale;
    const c = new Camera({
      viewportWidth: width,
      viewportHeight: HEIGHT,
      fitWidth: width - (SIDE * 2) / scale,
      fitHeight: HEIGHT - (EDGE * 2) / scale,
    });
    for (const [x, y] of [
      [STAR.x, STAR.y],
      [STAR.x + CAMERA_ARENA_RADIUS, STAR.y - CAMERA_ARENA_RADIUS],
    ]) {
      c.frame(x, y, STAR.x, STAR.y, 160, 4, true, 5, 0);
      out.push({ ...c.getViewRect() });
    }
  }
  return out;
}

function expectCovered(view: WorldRect) {
  const found = stars(view);
  // A coarse grid whose cells each hold at least one whole starfield cell.
  const cell = starfieldCell(view);
  const columns = Math.max(1, Math.floor(view.width / (cell * 2)));
  const rows = Math.max(1, Math.floor(view.height / (cell * 2)));
  expect(columns * rows).toBeGreaterThan(1);
  const w = view.width / columns;
  const h = view.height / rows;
  const hit = new Uint8Array(columns * rows);
  for (const [x, y] of found) {
    const column = Math.floor((x - view.x) / w);
    const row = Math.floor((y - view.y) / h);
    if (column >= 0 && column < columns && row >= 0 && row < rows)
      hit[row * columns + column] = 1;
  }
  expect(hit.indexOf(0), JSON.stringify(view)).toBe(-1);
}

it("bounds the work per frame and still covers extreme views", () => {
  for (const view of extremeViews()) {
    let visited = 0;
    forEachStar(view, () => {
      visited++;
    });
    expect(visited).toBeLessThanOrEqual(STARFIELD_CELL_BUDGET);
    expectCovered(view);
  }
  for (const view of [
    { x: -1e7, y: -1e7, width: 2e7, height: 10 },
    { x: 0, y: 0, width: 1e12, height: 1e12 },
  ]) {
    let visited = 0;
    forEachStar(view, () => {
      visited++;
    });
    expect(visited).toBeLessThanOrEqual(STARFIELD_CELL_BUDGET);
  }
});

it("covers every part of the visible world at every zoom, width and position", () => {
  for (const view of views()) {
    expectCovered(view);
  }
});
