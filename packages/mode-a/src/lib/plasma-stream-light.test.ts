import { type Camera, type Renderer, Vec2 } from "@void-drift/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { weaponPose } from "./build-renderer";
import { drawFlightFrame, type FlightFrame } from "./flight-frame";
import { FlightFx } from "./gravity-fold-fx";
import { PLASMA_ERUPTION_SECONDS } from "./plasma-stream-fx";
import { liveShipBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { gameSettings, Simulation, STEP } from "./simulation";

const substep = STEP / 4;
const twinContactTime = 0.7 + 75 / 7800;
const canvasWidth = 1024;
const canvasHeight = 768;
const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function canvasRecorder() {
  const canvas = { width: canvasWidth, height: canvasHeight };
  const blend = {
    canvas,
    globalAlpha: 1,
    getTransform: () => identity,
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
  };
  return { canvas, blend, ctx: blend as unknown as CanvasRenderingContext2D };
}

function fixture(owner: "player" | "opponent" = "player") {
  const pose = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 20,
  };
  const loadout = defaultLoadout("wasp");
  loadout.hull = ["plasma-rifle", "plasma-rifle"];
  const sim = new Simulation({
    ...gameSettings("wasp"),
    mode: "gauntlet",
    arrival: false,
    loadout,
  });
  sim.planets.length = 0;
  sim.star.pos.set(1800, 1000);
  const actor = sim.opponents[0];
  if (owner === "opponent") actor.combat = new SalvageSystem(loadout, 2026);
  const combat = owner === "player" ? sim.salvage : actor.combat;
  if (!combat) throw new Error("Expected a combat system");
  const mounts = combat.weapons.map((weapon) => weaponPose(pose, weapon.mount));
  const targets = mounts.map(({ muzzleX, muzzleY }, index) =>
    liveShipBody(
      20 + index,
      { ...pose, pos: new Vec2(muzzleX + 77, muzzleY), radius: 2 },
      300,
      () => {},
    ),
  );
  const power = { hull: 100, power: 100 };
  const step = (dt: number, roster = targets) => {
    combat.stepWeapons(dt, pose, sim.star, power, 100, [], roster);
  };
  return { actor, combat, mounts, sim, step };
}

function recorder(sim: Simulation) {
  const fx = new FlightFx();
  const canvases: ReturnType<typeof canvasRecorder>[] = [];
  vi.stubGlobal("document", {
    createElement: () => {
      const record = canvasRecorder();
      canvases.push(record);
      return { ...record.canvas, getContext: () => record.ctx };
    },
  });
  const world = canvasRecorder();
  const history = canvasRecorder();
  const live = canvasRecorder();
  const frame: FlightFrame = {
    fx,
    sim,
    camera: {
      applyTransform: () => {},
      getViewRect: () => ({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
      }),
    } as unknown as Camera,
    renderer: {} as Renderer,
    layers: { world: world.ctx, fx: history.ctx, lfx: live.ctx },
  };
  function draw(withHistory = true) {
    drawFlightFrame(frame, {
      include: (pass) =>
        pass.id === "ion-beams" ||
        (withHistory && pass.id === "accumulated-light"),
    });
  }
  const trailStamps = () =>
    canvases.reduce(
      (sum, { blend }) => sum + blend.stroke.mock.calls.length,
      0,
    );
  return { draw, frame, live: live.blend, trailStamps };
}

function hitAcrossRenderedInterval(f: ReturnType<typeof fixture>) {
  f.step(0.7);
  f.step(0.009);
  expect(f.combat.plasmaContacts).toBe(0);
  for (let n = 0; n < 4; n++) f.step(substep);
  expect(f.combat.plasmaContacts).toBe(2);
  expect(f.combat.plasmaContactEvents).toEqual([]);
  return f.combat.plasmaVisualEvents.filter((event) => event.kind === "impact");
}

afterEach(() => vi.unstubAllGlobals());

describe("mounted plasma stream presentation", () => {
  it("preserves two early-substep impacts and stamps each travelled segment only once", () => {
    const f = fixture();
    const hits = hitAcrossRenderedInterval(f);
    expect(hits).toHaveLength(2);
    for (const [index, hit] of hits.entries()) {
      expect(hit.x).toBeCloseTo(f.mounts[index].muzzleX + 75, 8);
      expect(hit.y).toBeCloseTo(f.mounts[index].muzzleY, 8);
      expect(hit.time).toBeCloseTo(twinContactTime, 8);
    }
    f.sim.ticks = 44;
    const graphics = recorder(f.sim);
    graphics.draw();
    const stamps = graphics.trailStamps();
    expect(stamps).toBeGreaterThan(0);
    expect(graphics.live.drawImage).toHaveBeenCalledTimes(2);
    for (const [
      index,
      [, x, y, width, height],
    ] of graphics.live.drawImage.mock.calls.entries()) {
      expect(x + width / 2).toBeCloseTo(hits[index].x, 8);
      expect(y + height / 2).toBeCloseTo(hits[index].y, 8);
    }
    graphics.draw();
    expect(graphics.trailStamps()).toBe(stamps);
    f.sim.ticks++;
    graphics.draw();
    expect(graphics.trailStamps()).toBe(stamps);
  });

  it("redraws a destroyed opponent's visible impact while paused and expires it on game time", () => {
    const f = fixture("opponent");
    f.combat.presentationTimeOffset = 2;
    const hits = hitAcrossRenderedInterval(f);
    expect(hits[0]?.time).toBeCloseTo(2 + twinContactTime, 8);
    f.actor.lifecycle = "destroyed";
    f.sim.ticks = 164;
    const graphics = recorder(f.sim);
    for (let frame = 0; frame < 140; frame++) graphics.draw(false);
    expect(graphics.live.drawImage).toHaveBeenCalledTimes(280);
    const first = graphics.live.drawImage.mock.calls[0].slice(1);
    const last = graphics.live.drawImage.mock.calls[278].slice(1);
    expect(last).toEqual(first);
    f.sim.ticks =
      Math.ceil((2 + twinContactTime + PLASMA_ERUPTION_SECONDS) / STEP) + 1;
    graphics.live.drawImage.mockClear();
    graphics.draw(false);
    expect(graphics.live.drawImage).not.toHaveBeenCalled();

    graphics.frame.sim = fixture().sim;
    graphics.frame.sim.ticks = 1;
    graphics.draw();
    expect(graphics.live.drawImage).not.toHaveBeenCalled();
    expect(graphics.trailStamps()).toBe(0);
  });

  it("shows the full open-space paths and endpoint eruptions after the heads retire", () => {
    const f = fixture();
    f.step(0.7);
    f.step(0.008, []);
    f.sim.ticks = 42;
    const graphics = recorder(f.sim);
    graphics.draw();
    expect(graphics.live.lineTo).toHaveBeenCalled();
    expect(graphics.live.drawImage).not.toHaveBeenCalled();
    f.step(STEP, []);
    f.sim.ticks = 44;
    expect(f.combat.plasmaStreams).toEqual([]);
    expect(f.combat.plasmaAirbursts).toBe(2);
    graphics.live.lineTo.mockClear();
    graphics.draw();
    expect(graphics.live.drawImage).toHaveBeenCalledTimes(2);
    for (const { muzzleX, muzzleY } of f.mounts)
      expect(
        graphics.live.lineTo.mock.calls.some(
          ([x, y]) =>
            Math.abs(x - muzzleX - 130) < 1e-8 && Math.abs(y - muzzleY) < 1e-8,
        ),
      ).toBe(true);
  });
});
