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

it("speed framing has continuous bounded outward demand", () => {
  const c = stageCamera(STAGES[1]);
  let extent = 0;
  for (let speed = 0; speed <= 2000; speed += 5) {
    c.frameSpeed(460, 540, speed, 0, 40, true);
    expect(c.activeHeight / c.zoom).toBeGreaterThanOrEqual(extent);
    extent = c.activeHeight / c.zoom;
    const p = c.worldToScreen(460, 540);
    expect(p.x).toBeLessThanOrEqual(c.viewportWidth / 2 + 1e-8);
    expect(p.y).toBeCloseTo(c.viewportHeight / 2, 10);
  }
  const wide = c.zoom;
  c.frameSpeed(460, 540, 1e6, 0, 40, true);
  expect(c.zoom).toBe(wide);
  c.frameSpeed(460, 540, 0, 0, 40, true);
  expect(c.worldToScreen(460, 540).x).toBeCloseTo(c.viewportWidth / 2, 10);
  expect(c.worldToScreen(460, 540).y).toBeCloseTo(c.viewportHeight / 2, 10);
});

it("settles with equivalent simulation time at different update rates", () => {
  const result = (hz: number) => {
    const c = stageCamera(STAGES[1]);
    c.frameSpeed(460, 540, 0, 0, 40, true);
    for (let i = 0; i < hz * 2; i++) {
      c.frameSpeed(460, 540, 300, -300, 40);
      c.update(1 / hz);
    }
    return c;
  };
  const a = result(30),
    b = result(144);
  expect(a.zoom).toBeCloseTo(b.zoom, 10);
  expect(a.pos.x).toBeCloseTo(b.pos.x, 10);
  expect(a.pos.y).toBeCloseTo(b.pos.y, 10);
  const previous = a.zoom;
  a.frameSpeed(460, 540, 300, -300, 40);
  a.update(10);
  expect(Math.abs(a.zoom - previous)).toBeLessThan(0.00001);
});

it("contains the body through reversals, wraps, resizing and both policy transitions", () => {
  for (const stage of STAGES) {
    const c = stageCamera(stage);
    const radius = 90;
    let x = 460,
      y = 540;
    const inside = () => {
      const p = c.worldToScreen(x, y),
        box = activeBox(c),
        hull = radius * c.zoom;
      expect(p.x - hull).toBeGreaterThan(box.left);
      expect(p.x + hull).toBeLessThan(box.right);
      expect(p.y - hull).toBeGreaterThan(box.top);
      expect(p.y + hull).toBeLessThan(box.bottom);
      const world = c.screenToWorld(p.x, p.y);
      expect(world.x).toBeCloseTo(x, 8);
      expect(world.y).toBeCloseTo(y, 8);
    };
    c.frame(x, y, STAR.x, STAR.y, PADDING, 4, true);
    const before = { x: c.pos.x, y: c.pos.y, zoom: c.zoom };
    c.frameSpeed(x, y, 300, -300, radius);
    expect({ x: c.pos.x, y: c.pos.y, zoom: c.zoom }).toEqual(before);
    for (let i = 0; i < 600; i++) {
      const vx = i < 150 ? 1800 : -1800;
      x += vx / 60;
      const wrap = Math.abs(x - STAR.x) > CAMERA_ARENA_RADIUS;
      if (wrap) x = STAR.x - Math.sign(x - STAR.x) * (CAMERA_ARENA_RADIUS - 1);
      c.frameSpeed(x, y, vx, -20, radius, wrap);
      c.update(1 / 60);
      inside();
      if (i === 200) {
        c.setActiveArea(140, 120);
        inside();
      }
      if (i === 220) c.setActiveArea(stage.fitWidth, stage.fitHeight);
    }
    const speedZoom = c.zoom;
    c.frame(x, y, STAR.x, STAR.y, PADDING, 4);
    expect(c.zoom).toBe(speedZoom);
    for (let i = 0; i < 1200; i++) {
      c.frame(x, y, STAR.x, STAR.y, PADDING, 4);
      c.keepShipVisible(x, y, radius);
      c.update(1 / 60);
      inside();
    }
    expect(c.zoomLevels).toContain(c.zoom);
  }
});

function wideSpeedCamera() {
  const camera = stageCamera(STAGES[1]);
  camera.frameSpeed(460, 540, 1e6, 0, 40, true);
  return { camera, widest: camera.zoom };
}

/** Find input for a relative demand without pinning world-speed tuning. */
function speedForMagnification(magnification: number) {
  const { camera, widest } = wideSpeedCamera();
  let lower = 0,
    upper = 1e6;
  for (let i = 0; i < 64; i++) {
    const speed = (lower + upper) / 2;
    camera.frameSpeed(460, 540, speed, 0, 40, true);
    if (camera.zoom / widest > magnification) lower = speed;
    else upper = speed;
  }
  return (lower + upper) / 2;
}

function advanceSpeed(camera: Camera, seconds: number, speed = 0, radius = 40) {
  camera.frameSpeed(460, 540, speed, 0, radius);
  camera.update(seconds);
}

it("holds every inward scale for 1.5 active seconds and cuts one relative level at a time", () => {
  for (const hz of [30, 60, 144]) {
    const { camera, widest } = wideSpeedCamera();
    let previous = widest;
    for (const magnification of [2, 4, 8]) {
      for (let tick = 0; tick < 1.5 * hz - 1; tick++) {
        advanceSpeed(camera, 1 / hz);
        expect(camera.zoom).toBe(previous);
      }
      advanceSpeed(camera, 1 / hz);
      expect(camera.zoom / widest).toBeCloseTo(magnification, 10);
      previous = camera.zoom;
    }
    advanceSpeed(camera, 20);
    expect(camera.zoom).toBe(previous);
  }
});

it("selects the next level above an outward between-level scale and never creeps towards demand", () => {
  const { camera, widest } = wideSpeedCamera();
  camera.frameSpeed(460, 540, 0, 0, 40, true);
  const outwardSpeed = speedForMagnification(1.6);
  // Smooth outward response remains continuous, immediate and bounded.
  advanceSpeed(camera, 0.01, outwardSpeed);
  expect(camera.zoom / widest).toBeGreaterThan(1.6);
  expect(camera.zoom / widest).toBeLessThan(8);
  advanceSpeed(camera, 10, outwardSpeed);
  expect(camera.zoom / widest).toBeCloseTo(1.6, 10);
  const held = camera.zoom;
  const inwardSpeed = speedForMagnification(2.5);
  advanceSpeed(camera, 1.49, inwardSpeed);
  expect(camera.zoom).toBe(held);
  advanceSpeed(camera, 0.01, inwardSpeed);
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
  const cut = camera.zoom;
  advanceSpeed(camera, 20, inwardSpeed);
  expect(camera.zoom).toBe(cut);
});

it("acceleration cancels qualification even when the same inward candidate stays eligible", () => {
  const { camera, widest } = wideSpeedCamera();
  advanceSpeed(camera, 1, speedForMagnification(3));
  advanceSpeed(camera, 0.5, speedForMagnification(2.5));
  expect(camera.zoom).toBe(widest);
  advanceSpeed(camera, 1.49, speedForMagnification(2.5));
  expect(camera.zoom).toBe(widest);
  advanceSpeed(camera, 0.01, speedForMagnification(2.5));
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
  // Outward demand is effective on its first step, despite the inward hold.
  advanceSpeed(camera, 0.01, 1e6);
  expect(camera.zoom / widest).toBeLessThan(2);
  expect(camera.zoom / widest).toBeGreaterThan(1);
  const held = camera.zoom;
  advanceSpeed(camera, 1.49);
  expect(camera.zoom).toBe(held);
  advanceSpeed(camera, 0.01);
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
});

it("lost hull eligibility and a changed candidate each require a fresh wait", () => {
  const { camera, widest } = wideSpeedCamera();
  advanceSpeed(camera, 1);
  const largeHull =
    Math.min(camera.activeWidth, camera.activeHeight) / (2 * widest * 1.2);
  advanceSpeed(camera, 0.5, 0, largeHull);
  expect(camera.zoom).toBe(widest);
  advanceSpeed(camera, 1.49);
  expect(camera.zoom).toBe(widest);
  advanceSpeed(camera, 0.01);
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
  // Begin waiting for 4x, then safety changes the next candidate back to 2x.
  advanceSpeed(camera, 1);
  advanceSpeed(camera, 0.01, 0, largeHull);
  const held = camera.zoom;
  expect(held / widest).toBeLessThan(2);
  advanceSpeed(camera, 1.49);
  expect(camera.zoom).toBe(held);
  advanceSpeed(camera, 0.01);
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
});

it("freezes qualification without simulation updates and clears it on resize or policy changes", () => {
  for (const interrupt of [
    (c: Camera) => c.setActiveArea(c.activeWidth - 10, c.activeHeight),
    (c: Camera) => c.resetSpeedEligibility(), // A preference edit while paused.
    (c: Camera) => {
      c.frame(460, 540, STAR.x, STAR.y, PADDING, 4);
      c.frameSpeed(460, 540, 0, 0, 40);
    },
  ]) {
    const { camera, widest } = wideSpeedCamera();
    advanceSpeed(camera, 1);
    // Measuring/reframing a paused scene and zero elapsed time cannot qualify it.
    for (let i = 0; i < 100; i++) {
      camera.setActiveArea(camera.activeWidth, camera.activeHeight);
      advanceSpeed(camera, 0);
    }
    advanceSpeed(camera, 0.49);
    expect(camera.zoom).toBe(widest);
    interrupt(camera);
    advanceSpeed(camera, 1.49);
    expect(camera.zoom).toBe(widest);
    advanceSpeed(camera, 0.01);
    expect(camera.zoom / widest).toBeCloseTo(2, 10);
  }
  const { camera, widest } = wideSpeedCamera();
  advanceSpeed(camera, 1);
  // Unchanged policy on Resume retains the first second.
  camera.update(0);
  advanceSpeed(camera, 0.49);
  expect(camera.zoom).toBe(widest);
  advanceSpeed(camera, 0.01);
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
});

it("reset and wrap snap to the resulting demand and position with fresh inward eligibility", () => {
  const { camera, widest } = wideSpeedCamera();
  advanceSpeed(camera, 1.49);
  camera.frameSpeed(-200, -300, 1e6, 0, 40, true);
  expect(camera.zoom).toBe(widest);
  const p = camera.worldToScreen(-200, -300);
  expect(p.x).toBeCloseTo(camera.viewportWidth / 2, 10);
  expect(p.y).toBeCloseTo(camera.viewportHeight / 2, 10);
  camera.frameSpeed(-200, -300, 0, 0, 40);
  camera.update(1.49);
  expect(camera.zoom).toBe(widest);
  camera.update(0.01);
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
});

it("cuts preserve ship screen position while follow pan continues independently", () => {
  const a = wideSpeedCamera(),
    b = wideSpeedCamera();
  const initialSpeed = speedForMagnification(1.6);
  const demandSpeed = speedForMagnification(2.5);
  for (const c of [a.camera, b.camera]) {
    c.setOffset(12, -8);
    c.frameSpeed(460, 540, initialSpeed, 0, 40, true);
    c.pos.x += (c.activeWidth * 0.4) / c.zoom;
    c.keepShipVisible(460, 540, 40);
    advanceSpeed(c, 1.49, demandSpeed);
  }
  // Both cameras take the same pan step; only a is allowed to cut.
  b.camera.resetSpeedEligibility();
  advanceSpeed(a.camera, 0.01, demandSpeed);
  advanceSpeed(b.camera, 0.01, demandSpeed);
  expect(a.camera.zoom / a.widest).toBeCloseTo(2, 10);
  expect(b.camera.zoom / b.widest).toBeCloseTo(1.6, 10);
  const cut = a.camera.worldToScreen(460, 540),
    held = b.camera.worldToScreen(460, 540);
  expect(cut.x).toBeCloseTo(held.x, 10);
  expect(cut.y).toBeCloseTo(held.y, 10);
  expect(cut.x).toBeLessThan(a.camera.viewportWidth / 2);
  const world = a.camera.screenToWorld(cut.x, cut.y);
  expect(world.x).toBeCloseTo(460, 10);
  expect(world.y).toBeCloseTo(540, 10);
});

it("containment can correct cut anchoring when the larger projected hull needs room", () => {
  const { camera, widest } = wideSpeedCamera();
  const radius = 200;
  advanceSpeed(camera, 1.49, 0, radius);
  camera.pos.x += 1e6;
  camera.keepShipVisible(460, 540, radius);
  camera.update(0.01);
  expect(camera.zoom / widest).toBeCloseTo(2, 10);
  const p = camera.worldToScreen(460, 540),
    box = activeBox(camera),
    hull = radius * camera.zoom;
  expect(p.x - hull).toBeGreaterThan(box.left);
  expect(p.x + hull).toBeLessThan(box.right);
  expect(p.y - hull).toBeGreaterThan(box.top);
  expect(p.y + hull).toBeLessThan(box.bottom);
});

it("entering speed framing from a wider standard view holds the transform before its first cut", () => {
  const camera = stageCamera(STAGES[1]);
  camera.frame(460, 540, STAR.x, STAR.y, PADDING, 4, true, 5, 0);
  const before = { x: camera.pos.x, y: camera.pos.y, zoom: camera.zoom };
  const widest = wideSpeedCamera().widest;
  expect(camera.zoom).toBeLessThan(widest);
  camera.frameSpeed(460, 540, 0, 0, 40);
  expect({ x: camera.pos.x, y: camera.pos.y, zoom: camera.zoom }).toEqual(
    before,
  );
  advanceSpeed(camera, 1.49);
  expect(camera.zoom).toBe(before.zoom);
  advanceSpeed(camera, 0.01);
  expect(camera.zoom).toBe(widest);
});

it("allows visible travel and slowly recentres a stopped ship", () => {
  const { camera, widest } = wideSpeedCamera();
  const centre = { x: camera.pos.x, y: camera.pos.y };
  const x = 460 + (camera.activeWidth * 0.25) / widest;
  const y = 540 + (camera.activeHeight * 0.2) / widest;
  camera.frameSpeed(x, y, 1e6, 0, 40);
  camera.update(1 / 60);
  expect(camera.pos.x).toBeGreaterThan(centre.x);
  expect(camera.pos.x - centre.x).toBeLessThan((x - centre.x) / 10);
  expect(camera.pos.y).toBeGreaterThan(centre.y);
  expect(camera.pos.y - centre.y).toBeLessThan((y - centre.y) / 10);
  const stopped = camera.worldToScreen(x, y);
  expect(stopped.x).toBeGreaterThan(camera.viewportWidth / 2);
  expect(stopped.y).toBeGreaterThan(camera.viewportHeight / 2);
  // Stopping can qualify inward cuts, with slow centring independent of them.
  let previous = stopped;
  for (let i = 0; i < 60; i++) {
    camera.frameSpeed(x, y, 0, 0, 40);
    camera.update(1);
    const p = camera.worldToScreen(x, y);
    expect(p.x).toBeLessThanOrEqual(previous.x + 1e-8);
    expect(p.y).toBeLessThanOrEqual(previous.y + 1e-8);
    expect(p.x).toBeGreaterThanOrEqual(camera.viewportWidth / 2 - 1e-8);
    expect(p.y).toBeGreaterThanOrEqual(camera.viewportHeight / 2 - 1e-8);
    if (i === 0)
      expect(p.x - camera.viewportWidth / 2).toBeGreaterThan(
        (stopped.x - camera.viewportWidth / 2) / 2,
      );
    previous = p;
  }
  expect(camera.zoom / widest).toBeCloseTo(8, 10);
  expect(previous.x - camera.viewportWidth / 2).toBeLessThan(1);
  expect(previous.y - camera.viewportHeight / 2).toBeLessThan(1);
});

it("recentres an offset view with equivalent elapsed time", () => {
  const result = (hz: number) => {
    const { camera, widest } = wideSpeedCamera();
    const initial = camera.pos.x;
    const x = 460;
    camera.pos.x -= (camera.activeWidth * 0.44) / widest;
    camera.keepShipVisible(x, 540, 40);
    const displacedCentre = camera.pos.x;
    camera.frameSpeed(x, 540, 1e6, 0, 40);
    camera.update(1 / hz);
    expect(camera.pos.x).toBeGreaterThan(displacedCentre);
    expect(camera.pos.x).toBeLessThan(
      displacedCentre + (initial - displacedCentre) / 10,
    );
    for (let i = 1; i < hz; i++) {
      camera.frameSpeed(x, 540, 1e6, 0, 40);
      camera.update(1 / hz);
    }
    return { camera, x };
  };
  const a = result(30),
    b = result(144);
  expect(a.camera.pos.x).toBeCloseTo(b.camera.pos.x, 8);
  const initialOffset =
    a.camera.worldToScreen(a.x, 540).x - a.camera.viewportWidth / 2;
  for (let i = 0; i < 10; i++) {
    a.camera.frameSpeed(a.x, 540, 0, 0, 40);
    a.camera.update(1);
  }
  const finalOffset =
    a.camera.worldToScreen(a.x, 540).x - a.camera.viewportWidth / 2;
  expect(finalOffset).toBeGreaterThan(0);
  expect(finalOffset).toBeLessThan(initialOffset);
});

it("outward zoom starts gently, accelerates, then eases out without overshoot", () => {
  const { camera, widest } = wideSpeedCamera();
  camera.frameSpeed(460, 540, 0, 0, 40, true);
  const close = camera.zoom;
  advanceSpeed(camera, 0.01, 1e6);
  const first = close - camera.zoom;
  expect(first).toBeGreaterThan(0);
  const afterFirst = camera.zoom;
  advanceSpeed(camera, 0.01, 1e6);
  const second = afterFirst - camera.zoom;
  expect(second).toBeGreaterThan(first);
  let previous = camera.zoom;
  for (let i = 0; i < 100; i++) {
    advanceSpeed(camera, 0.01, 1e6);
    expect(camera.zoom).toBeLessThanOrEqual(previous);
    expect(camera.zoom).toBeGreaterThanOrEqual(widest);
    previous = camera.zoom;
  }
  advanceSpeed(camera, 0.01, 1e6);
  expect(previous - camera.zoom).toBeLessThan(second);
});

it("outward retargeting cannot creep inward, and reset clears its previous response", () => {
  const { camera, widest } = wideSpeedCamera();
  camera.frameSpeed(460, 540, 0, 0, 40, true);
  advanceSpeed(camera, 0.2, 1e6);
  let previous = camera.zoom;
  const slower = speedForMagnification(2.5);
  for (let i = 0; i < 100; i++) {
    advanceSpeed(camera, 0.01, slower);
    expect(camera.zoom).toBeLessThanOrEqual(previous);
    expect(camera.zoom / widest).toBeGreaterThanOrEqual(2.5 - 1e-10);
    previous = camera.zoom;
  }
  camera.frameSpeed(-200, -300, 0, 0, 40, true);
  const fresh = wideSpeedCamera().camera;
  fresh.frameSpeed(-200, -300, 0, 0, 40, true);
  for (const c of [camera, fresh]) {
    c.frameSpeed(-200, -300, 1e6, 0, 40);
    c.update(0.01);
  }
  expect(camera.zoom).toBe(fresh.zoom);
});

it("lets a coasting ship leave centre, then recentres at propulsion and arrival speeds", () => {
  for (const velocity of [
    { x: 200, y: 0 },
    { x: 400, y: 0 },
    { x: 600, y: 0 },
    { x: -240, y: -320 },
  ]) {
    const runs = [];
    for (const hz of [30, 60, 144]) {
      const { camera } = wideSpeedCamera();
      camera.frameSpeed(460, 540, velocity.x, velocity.y, 40, true);
      let peak = 0;
      for (let i = 1; i <= 20 * hz; i++) {
        const x = 460 + (velocity.x * i) / hz;
        const y = 540 + (velocity.y * i) / hz;
        camera.frameSpeed(x, y, velocity.x, velocity.y, 40);
        camera.update(1 / hz);
        const p = camera.worldToScreen(x, y);
        const distance = Math.hypot(
          p.x - camera.viewportWidth / 2,
          p.y - camera.viewportHeight / 2,
        );
        peak = Math.max(peak, distance);
        if (i === 20 * hz) expect(distance).toBeLessThan(1e-8);
      }
      expect(peak).toBeGreaterThan(camera.activeHeight * 0.05);
      runs.push({ peak, x: camera.pos.x, y: camera.pos.y });
    }
    expect(runs[0].peak).toBeCloseTo(runs[2].peak, 1);
    expect(runs[0].x).toBeCloseTo(runs[2].x, 8);
    expect(runs[0].y).toBeCloseTo(runs[2].y, 8);
  }
});

it("holds the upper zoom label until each outward level is reached", () => {
  const { camera, widest } = wideSpeedCamera();
  for (const [magnification, label] of [
    [8, 8],
    [6, 8],
    [4.01, 8],
    [4, 4],
    [3.9, 4],
    [2.01, 4],
    [2, 2],
    [1.5, 2],
    [1, 1],
  ]) {
    camera.zoom = widest * magnification;
    expect(camera.speedZoomMode).toBe(label);
  }
});

it("returns to an 8x cut and readout while a slow ship keeps moving", () => {
  const { camera, widest } = wideSpeedCamera();
  const speed = 10;
  let x = 460;
  for (const label of [2, 4, 8]) {
    for (let tick = 0; tick < 90; tick++) {
      x += speed / 60;
      camera.frameSpeed(x, 540, speed, 0, 40);
      camera.update(1 / 60);
    }
    expect(camera.zoom / widest).toBeCloseTo(label, 10);
    expect(camera.speedZoomMode).toBe(label);
  }
  // Widen, then earn the closest level again without stopping the ship.
  advanceSpeed(camera, 2, 400);
  expect(camera.speedZoomMode).toBeLessThan(8);
  for (let tick = 0; tick < 270; tick++) {
    x += speed / 60;
    camera.frameSpeed(x, 540, speed, 0, 40);
    camera.update(1 / 60);
  }
  expect(camera.zoom / widest).toBeCloseTo(8, 10);
  expect(camera.speedZoomMode).toBe(8);
});

it("allows closer inward cuts throughout their propulsion-speed bands", () => {
  for (const [speed, expected] of [
    [100, 8],
    [200, 4],
    [300, 2],
    [400, 1],
  ]) {
    const { camera, widest } = wideSpeedCamera();
    let x = 460;
    for (let tick = 0; tick < 480; tick++) {
      x += speed / 60;
      camera.frameSpeed(x, 540, speed, 0, 40);
      camera.update(1 / 60);
    }
    expect(camera.zoom / widest).toBeCloseTo(expected, 10);
    expect(camera.speedZoomMode).toBe(expected);
  }
});

/** A stage of `cssHeight` CSS pixels, its logical height fixed at 1080. */
function cssStage(cssHeight: number) {
  const camera = stageCamera(STAGES[1]);
  camera.setActiveArea(
    STAGES[1].fitWidth,
    STAGES[1].fitHeight,
    cssHeight / HEIGHT,
  );
  return camera;
}

const cssPerUnit = (camera: Camera) => camera.zoom * camera.cssScale;

it("fixes the speed levels in CSS pixels per world unit on every stage", () => {
  const widths = [600, 1080, 1600].map((cssHeight) => {
    const camera = cssStage(cssHeight);
    const levels = camera.speedZoomLevels.map(
      (level) => level * camera.cssScale,
    );
    expect(levels[0]).toBeCloseTo(0.5, 12);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]).toBeCloseTo(levels[i - 1] * 2, 12);
    // The widest demand is the 1x level, on every stage.
    camera.frameSpeed(460, 540, 1e6, 0, 40, true);
    expect(cssPerUnit(camera)).toBeCloseTo(levels[0], 12);
    return {
      levels,
      worldShown:
        (camera.activeHeight * cssHeight) / HEIGHT / cssPerUnit(camera),
    };
  });
  for (const { levels } of widths)
    for (const [i, level] of levels.entries())
      expect(level).toBeCloseTo(widths[0].levels[i], 12);
  // The amount of world shown at 1x follows the screen's size.
  expect(widths[1].worldShown).toBeGreaterThan(widths[0].worldShown);
  expect(widths[2].worldShown).toBeGreaterThan(widths[1].worldShown);
});

/** Arrive at the arena edge, moving fast towards the star as a new run does. */
function enter(cssHeight: number, distance = 1180) {
  const camera = cssStage(cssHeight);
  const star = { x: STAR.x, y: STAR.y, radius: 60 };
  const ship = {
    x: STAR.x + distance * 0.6,
    y: STAR.y - distance * 0.8,
    radius: 40,
  };
  camera.frameSpeed(ship.x, ship.y, 0, 600, ship.radius, true, star);
  return { camera, star, ship };
}

function contains(
  camera: Camera,
  body: { x: number; y: number; radius: number },
) {
  const p = camera.worldToScreen(body.x, body.y);
  const box = activeBox(camera);
  const r = body.radius * camera.zoom;
  return (
    p.x - r >= box.left &&
    p.x + r <= box.right &&
    p.y - r >= box.top &&
    p.y + r <= box.bottom
  );
}

it("shows the star and the ship in the first view of a new run on small and large stages", () => {
  for (const cssHeight of [500, 2400]) {
    for (const distance of [300, 1180, 4000]) {
      const { camera, star, ship } = enter(cssHeight, distance);
      expect(contains(camera, star)).toBe(true);
      expect(contains(camera, ship)).toBe(true);
    }
  }
});

it("cuts the entrance view to 1x after the hold only when it is wider than 1x", () => {
  const hold = (
    camera: Camera,
    ship: { x: number; y: number; radius: number },
    seconds: number,
  ) => {
    for (let t = 0; t < Math.round(seconds * 60); t++) {
      camera.frameSpeed(ship.x, ship.y, 0, 600, ship.radius);
      camera.update(1 / 60);
    }
  };
  // A small stage needs a view wider than 1x to hold both bodies.
  const small = enter(500);
  const oneX = small.camera.speedZoomLevels[0];
  const entrance = small.camera.zoom;
  expect(entrance).toBeLessThan(oneX);
  expect(small.camera.speedZoomMode).toBe(1);
  hold(small.camera, small.ship, 1.4);
  expect(small.camera.zoom).toBe(entrance);
  hold(small.camera, small.ship, 0.2);
  expect(small.camera.zoom).toBeCloseTo(oneX, 12);
  // Speed never delays or redirects the entrance cut: accelerating or braking
  // through the hold, it cuts to 1x when the hold ends.
  for (const speedAt of [(t: number) => 600 + 10 * t, () => 0]) {
    const { camera, ship } = enter(500);
    const start = camera.zoom;
    const step = (t: number) => {
      camera.frameSpeed(ship.x, ship.y, 0, speedAt(t), ship.radius);
      camera.update(1 / 60);
    };
    for (let t = 0; t < 89; t++) step(t);
    expect(camera.zoom).toBe(start);
    step(89);
    expect(camera.zoom).toBeCloseTo(oneX, 12);
  }
  // On a large stage 1x already holds both: no entrance cut, speed demand rules.
  const large = enter(2400);
  const largeOneX = large.camera.speedZoomLevels[0];
  expect(large.camera.zoom).toBeCloseTo(largeOneX, 12);
  hold(large.camera, large.ship, 3);
  expect(large.camera.zoom).toBeCloseTo(largeOneX, 12);
});
