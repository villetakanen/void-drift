import { expect, it } from "vitest";
import { CAMERA_ARENA_RADIUS, CAMERA_MIN_FIT, Camera } from "./Camera";

const HEIGHT = 1080;
const PADDING = 160;
const STAR = { x: 960, y: 540 };
// Stage ratios with an active area inset by side and edge gutters.
const STAGES = [
  { name: "4:3", width: (HEIGHT * 4) / 3 },
  { name: "16:9", width: (HEIGHT * 16) / 9 },
  { name: "ultra-wide", width: (HEIGHT * 64) / 27 },
].map((stage) => ({
  ...stage,
  fitWidth: stage.width - 2 * 180,
  fitHeight: HEIGHT - 2 * 48,
}));

function stageCamera(stage: (typeof STAGES)[number]) {
  return new Camera({
    viewportWidth: stage.width,
    viewportHeight: HEIGHT,
    fitWidth: stage.fitWidth,
    fitHeight: stage.fitHeight,
  });
}

/** The active box in screen units: centred on the render viewport. */
function activeBox(c: Camera) {
  const left = (c.viewportWidth - c.activeWidth) / 2;
  const top = (c.viewportHeight - c.activeHeight) / 2;
  return {
    left,
    top,
    right: left + c.activeWidth,
    bottom: top + c.activeHeight,
  };
}

function expectPaddedInside(c: Camera, x: number, y: number) {
  const box = activeBox(c);
  const p = c.worldToScreen(x, y);
  const pad = PADDING * c.zoom;
  const eps = 1e-6;
  expect(p.x - pad).toBeGreaterThanOrEqual(box.left - eps);
  expect(p.x + pad).toBeLessThanOrEqual(box.right + eps);
  expect(p.y - pad).toBeGreaterThanOrEqual(box.top - eps);
  expect(p.y + pad).toBeLessThanOrEqual(box.bottom + eps);
}

it("fits ship and star, with padding, inside the active area", () => {
  for (const stage of STAGES) {
    const c = stageCamera(stage);
    const reach = CAMERA_ARENA_RADIUS;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      for (const distance of [0, reach * 0.25, reach * 0.5, reach]) {
        const ship = {
          x: STAR.x + Math.cos(angle) * distance,
          y: STAR.y + Math.sin(angle) * distance,
        };
        c.frame(ship.x, ship.y, STAR.x, STAR.y, PADDING, 4, true);
        const closest = c.zoomLevels[c.zoomLevels.length - 1];
        const fitsAtClosest =
          (Math.abs(ship.x - STAR.x) + PADDING * 2) * closest <=
            c.activeWidth &&
          (Math.abs(ship.y - STAR.y) + PADDING * 2) * closest <= c.activeHeight;
        // Below the closest level, framing fits the subjects; at it, they
        // fit only when their span allows.
        if (c.zoomLevel < c.zoomLevels.length - 1 || fitsAtClosest) {
          expectPaddedInside(c, ship.x, ship.y);
          expectPaddedInside(c, STAR.x, STAR.y);
        }
      }
    }
  }
});

it("reframes immediately on a wrap instead of panning across the arena", () => {
  const c = stageCamera(STAGES[1]);
  const before = STAR.x + CAMERA_ARENA_RADIUS - 10;
  const after = STAR.x - CAMERA_ARENA_RADIUS + 10;
  c.frame(before, STAR.y, STAR.x, STAR.y, PADDING, 4, true);
  c.frame(after, STAR.y, STAR.x, STAR.y, PADDING, 4, true);
  expect(c.pos.x).toBe((after + STAR.x) / 2);
});

it("holds the wider level near a threshold", () => {
  for (const stage of STAGES) {
    const c = stageCamera(stage);
    c.frame(STAR.x, STAR.y, STAR.x, STAR.y, PADDING, 4, true);
    const threshold = c.zoomLevels[3];
    // The vertical span at which level 3 exactly fits the active height.
    const distance = c.activeHeight / threshold - PADDING * 2;
    c.frame(STAR.x, STAR.y + distance + 1, STAR.x, STAR.y, PADDING, 4);
    const wider = c.zoom;
    expect(wider).toBeLessThan(threshold);
    c.frame(STAR.x, STAR.y + distance - 1, STAR.x, STAR.y, PADDING, 4);
    expect(c.zoom).toBe(wider);
  }
});

it("shrinks the widest level continuously as the active area collapses", () => {
  const zooms = [8, 2, CAMERA_MIN_FIT, CAMERA_MIN_FIT / 2, 0].map((height) => {
    const c = new Camera({ fitWidth: 1000, fitHeight: height });
    c.frame(STAR.x, STAR.y, STAR.x, STAR.y, PADDING, 4, true, 5, 0);
    return c.zoom;
  });
  for (const zoom of zooms) {
    expect(Number.isFinite(zoom)).toBe(true);
    expect(zoom).toBeGreaterThan(0);
  }
  for (let i = 1; i < zooms.length; i++)
    expect(zooms[i]).toBeLessThanOrEqual(zooms[i - 1]);
  // An empty box never falls back to the larger full viewport.
  const full = new Camera();
  full.frame(STAR.x, STAR.y, STAR.x, STAR.y, PADDING, 4, true, 5, 0);
  expect(zooms[zooms.length - 1]).toBeLessThan(full.zoom);
});
