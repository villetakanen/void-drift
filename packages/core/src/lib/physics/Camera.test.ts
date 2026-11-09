import { describe, expect, it } from "vitest";
import {
  CAMERA_ARENA_RADIUS,
  CAMERA_CLOSEST_ZOOM,
  CAMERA_MIN_FIT,
  Camera,
} from "./Camera";

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

describe.each(STAGES)("on a $name stage", (stage) => {
  it("fits ship and star, with padding, inside the active area", () => {
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
  });

  it("keeps the camera centre at the render centre and covers the viewport", () => {
    const c = stageCamera(stage);
    c.frame(STAR.x + 700, STAR.y - 300, STAR.x, STAR.y, PADDING, 4, true);
    const centre = c.worldToScreen(c.pos.x, c.pos.y);
    expect(centre.x).toBeCloseTo(c.viewportWidth / 2);
    expect(centre.y).toBeCloseTo(c.viewportHeight / 2);
    const view = c.getViewRect();
    const topLeft = c.worldToScreen(view.x, view.y);
    const bottomRight = c.worldToScreen(
      view.x + view.width,
      view.y + view.height,
    );
    expect(topLeft.x).toBeCloseTo(0);
    expect(topLeft.y).toBeCloseTo(0);
    expect(bottomRight.x).toBeCloseTo(c.viewportWidth);
    expect(bottomRight.y).toBeCloseTo(c.viewportHeight);
  });

  it("contains the full arena with padding inside the active area at the widest level", () => {
    const c = stageCamera(stage);
    c.frame(STAR.x, STAR.y, STAR.x, STAR.y, PADDING, 4, true, 5, 0);
    expect(c.zoom).toBe(c.zoomLevels[0]);
    expect(c.zoomLevels[c.zoomLevels.length - 1]).toBeCloseTo(
      CAMERA_CLOSEST_ZOOM,
    );
    const box = activeBox(c);
    const reach = CAMERA_ARENA_RADIUS + PADDING;
    const min = c.worldToScreen(STAR.x - reach, STAR.y - reach);
    const max = c.worldToScreen(STAR.x + reach, STAR.y + reach);
    const eps = 1e-6;
    expect(min.x).toBeGreaterThanOrEqual(box.left - eps);
    expect(min.y).toBeGreaterThanOrEqual(box.top - eps);
    expect(max.x).toBeLessThanOrEqual(box.right + eps);
    expect(max.y).toBeLessThanOrEqual(box.bottom + eps);
  });
});

it("shows more of the arena across on a wider active area at the same level", () => {
  const [, wide, ultra] = STAGES;
  const a = stageCamera(wide);
  const b = stageCamera(ultra);
  for (const c of [a, b])
    c.frame(STAR.x, STAR.y, STAR.x, STAR.y, PADDING, 4, true, 5, 2);
  expect(b.zoom).toBeCloseTo(a.zoom);
  expect(b.getViewRect().width).toBeGreaterThan(a.getViewRect().width);
});

it("fits the full viewport when no active area is given", () => {
  const c = new Camera({ viewportWidth: 1000, viewportHeight: 600 });
  expect(c.activeWidth).toBe(c.viewportWidth);
  expect(c.activeHeight).toBe(c.viewportHeight);
  c.setActiveArea(800, 500);
  expect(c.activeWidth).toBe(800);
  c.setActiveArea(null, null);
  expect(c.activeHeight).toBe(c.viewportHeight);
});

it("frames ship and star and round-trips coordinates at every edge", () => {
  for (const stage of STAGES) {
    for (const [x, y] of [
      [STAR.x - CAMERA_ARENA_RADIUS, STAR.y],
      [STAR.x + CAMERA_ARENA_RADIUS, STAR.y],
      [STAR.x, STAR.y - CAMERA_ARENA_RADIUS],
      [STAR.x, STAR.y + CAMERA_ARENA_RADIUS],
    ]) {
      const c = stageCamera(stage);
      c.frame(x, y, STAR.x, STAR.y, PADDING, 4, true);
      const box = activeBox(c);
      for (const [wx, wy] of [
        [x, y],
        [STAR.x, STAR.y],
      ]) {
        const screen = c.worldToScreen(wx, wy);
        expect(screen.x).toBeGreaterThan(box.left);
        expect(screen.x).toBeLessThan(box.right);
        expect(screen.y).toBeGreaterThan(box.top);
        expect(screen.y).toBeLessThan(box.bottom);
        expect(c.screenToWorld(screen.x, screen.y).x).toBeCloseTo(wx);
        expect(c.screenToWorld(screen.x, screen.y).y).toBeCloseTo(wy);
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

it("snaps only to configured levels in both directions without aging world effects", () => {
  for (const stage of STAGES) {
    for (let count = 4; count <= 11; count++) {
      const c = stageCamera(stage);
      const visited = new Set<number>();
      for (const distance of [0, 300, 600, 900, 1190, 900, 600, 300, 0]) {
        c.frame(
          STAR.x,
          STAR.y + distance,
          STAR.x,
          STAR.y,
          PADDING,
          4,
          false,
          count,
        );
        const zoom = c.zoom;
        c.update(1 / 60);
        expect(c.zoom).toBe(zoom);
        expect(c.zoomLevels).toHaveLength(count);
        expect(c.zoomLevels).toContain(zoom);
        visited.add(zoom);
        const effect = c.worldToScreen(1000, 600);
        const back = c.screenToWorld(effect.x, effect.y);
        expect(back.x).toBeCloseTo(1000, 9);
        expect(back.y).toBeCloseTo(600, 9);
      }
      expect(visited.size).toBeGreaterThan(1);
    }
  }
});

it("holds the wider level near a threshold and previews every level", () => {
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
    for (let i = 0; i < 5; i++) {
      c.frame(STAR.x, STAR.y, STAR.x, STAR.y, PADDING, 4, false, 5, i);
      expect(c.zoom).toBe(c.zoomLevels[i]);
    }
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
