import type { Camera, Planet, Renderer } from "@void-drift/core";
import { Vec2 } from "@void-drift/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type BodyAppearance,
  drawFlightFrame,
  FLIGHT_LAYERS,
  FLIGHT_PASSES,
  type FlightFrame,
  type FlightLayerContexts,
  type FlightLayerId,
  type FlightPass,
} from "./flight-frame";
import { PRACTICE_MERCURY_SPIN_SECONDS } from "./mercurial-rock";
import { STEP } from "./simulation";

// Each pass's drawing is replaced by a recorder and each layer by a recording
// context, so the frame's own ordering, layers and camera use are under test.
function record() {
  const calls: string[] = [];
  for (const pass of FLIGHT_PASSES)
    vi.spyOn(pass, "draw").mockImplementation(() => {
      calls.push(`draw:${pass.id}`);
    });
  const layer = (id: FlightLayerId) =>
    ({
      canvas: { width: 1, height: 1 },
      save: () => calls.push(`save:${id}`),
      restore: () => calls.push(`restore:${id}`),
      scale: () => {},
      resetTransform: () => {},
      clearRect: () => calls.push(`clear:${id}`),
    }) as unknown as CanvasRenderingContext2D;
  const layers = Object.fromEntries(
    FLIGHT_LAYERS.map(({ id }) => [id, layer(id)]),
  ) as FlightLayerContexts;
  const frame = {
    layers,
    renderer: {} as Renderer,
    camera: {
      applyTransform: (ctx: CanvasRenderingContext2D) =>
        calls.push(
          `camera:${FLIGHT_LAYERS.find(({ id }) => layers[id] === ctx)?.id}`,
        ),
    } as unknown as Camera,
  } as FlightFrame;
  return { calls, frame };
}
const ids = FLIGHT_PASSES.map((pass) => pass.id);
const drawn = (calls: string[]) =>
  calls.filter((call) => call.startsWith("draw:")).map((call) => call.slice(5));
afterEach(() => vi.restoreAllMocks());

function makePlanet(id: string | undefined, x: number, radius = 10): Planet {
  return {
    id,
    systemPosition: 1,
    pos: new Vec2(x, 50),
    orbitCenter: new Vec2(40, 50),
    orbitRadius: Math.hypot(x - 40, 0),
    orbitSpeed: 0,
    orbitAngle: 0,
    initialAngle: 0,
    radius,
    mass: 100,
    color: "#777",
    type: "rock",
  };
}

function makeBodyFrame(
  planet: Planet,
  mode: "practice" | "survival",
  zoom = 1,
) {
  const drawPlanet = vi.fn();
  const camera = {
    zoom,
    getViewRect: () => ({ x: 0, y: 0, width: 100, height: 100 }),
    worldToScreen: (x: number, y: number) => ({ x, y }),
  } as unknown as Camera;
  const frame = {
    camera,
    renderer: { drawPlanet } as unknown as Renderer,
    sim: {
      settings: { mode },
      planets: [planet],
      star: { pos: new Vec2(40, 50) },
      ticks: 5,
    },
  } as unknown as FlightFrame;
  return { frame, drawPlanet };
}

function bodyContext() {
  return {} as CanvasRenderingContext2D;
}

function getPass(id: string) {
  const pass = FLIGHT_PASSES.find((item) => item.id === id);
  if (!pass) throw new Error(`Missing pass ${id}`);
  return pass;
}

describe("flight frame", () => {
  it("draws the shared planet HUD once before every planet body", () => {
    expect(ids.filter((id) => id === "world-hud")).toHaveLength(1);
    expect(ids).not.toContain("mercury-hud");
    expect(ids).not.toContain("venus-hud");
    expect(ids.indexOf("world-hud")).toBeLessThan(ids.indexOf("planets"));
    expect(ids).not.toContain("mercury-light");
    expect(ids).not.toContain("venus-light");
    expect(FLIGHT_PASSES.filter((pass) => pass.layer === "lfx")[0]?.id).toBe(
      "body-light",
    );
  });
  it("culls stock and fallback bodies by the full outline radius, including tangency", () => {
    const planet = makePlanet("rock", -10.501);
    const { frame, drawPlanet } = makeBodyFrame(planet, "survival");
    getPass("planets").draw(frame, bodyContext());
    expect(drawPlanet).not.toHaveBeenCalled();

    // The disc is wholly outside, but half its outline stroke reaches the view.
    planet.pos.x = -10.25;
    getPass("planets").draw(frame, bodyContext());
    expect(drawPlanet).toHaveBeenCalledTimes(1);
    drawPlanet.mockClear();
    planet.pos.x = -10.5;
    getPass("planets").draw(frame, bodyContext());
    expect(drawPlanet).toHaveBeenCalledTimes(1);

    for (const id of ["venus", "moon"]) {
      const fallback = makePlanet(id, -10.501);
      const fallbackFrame = makeBodyFrame(fallback, "practice");
      getPass("planets").draw(fallbackFrame.frame, bodyContext());
      expect(fallbackFrame.drawPlanet).not.toHaveBeenCalled();
      fallback.pos.x = -10.25;
      getPass("planets").draw(fallbackFrame.frame, bodyContext());
      expect(fallbackFrame.drawPlanet).toHaveBeenCalledTimes(1);
    }
  });
  it("draws any ordinal-keyed appearance on reentry at the current tick", () => {
    const planet = makePlanet("moon", -10.01);
    const surfaceDraw = vi.fn();
    const body = vi.fn();
    const { frame } = makeBodyFrame(planet, "practice");
    frame.bodyAppearances = new Map<number, BodyAppearance>([
      [
        1,
        {
          worldBounds: (_frame, target) => ({
            left: target.pos.x - target.radius,
            top: target.pos.y - target.radius,
            right: target.pos.x + target.radius,
            bottom: target.pos.y + target.radius,
          }),
          drawWorld: (frame) => {
            surfaceDraw(
              (frame.sim.ticks * STEP * 2 * Math.PI) /
                PRACTICE_MERCURY_SPIN_SECONDS,
              20,
            );
            body();
          },
        },
      ],
    ]);

    getPass("planets").draw(frame, bodyContext());
    expect(surfaceDraw).not.toHaveBeenCalled();
    expect(body).not.toHaveBeenCalled();

    frame.sim.ticks = 9;
    planet.pos.x = -10;
    getPass("planets").draw(frame, bodyContext());
    expect(surfaceDraw).toHaveBeenCalledTimes(1);
    expect(surfaceDraw).toHaveBeenLastCalledWith(
      (9 * STEP * 2 * Math.PI) / PRACTICE_MERCURY_SPIN_SECONDS,
      20,
    );
    expect(body).toHaveBeenCalledTimes(1);
  });
  it("retains a composed body when its declared atmosphere bounds reach the view", () => {
    const planet = makePlanet("venus", -10.6);
    const surfaceDraw = vi.fn();
    const body = vi.fn();
    const atmosphere = vi.fn();
    const { frame } = makeBodyFrame(planet, "practice", 0.5);
    frame.bodyAppearances = new Map<number, BodyAppearance>([
      [
        1,
        {
          worldBounds: (frame, target) => {
            const halfWidth =
              Math.max(0.65 / frame.camera.zoom, target.radius * 0.065) / 2;
            const extent = target.radius + halfWidth;
            return {
              left: target.pos.x - extent,
              top: target.pos.y - extent,
              right: target.pos.x + extent,
              bottom: target.pos.y + extent,
            };
          },
          drawWorld: () => {
            surfaceDraw();
            body();
            atmosphere();
          },
        },
      ],
    ]);

    getPass("planets").draw(frame, bodyContext());
    expect(surfaceDraw).toHaveBeenCalledTimes(1);
    expect(body).toHaveBeenCalledTimes(1);
    expect(atmosphere).toHaveBeenCalledTimes(1);

    planet.pos.x = -10.651;
    getPass("planets").draw(frame, bodyContext());
    expect(surfaceDraw).toHaveBeenCalledTimes(1);
    expect(body).toHaveBeenCalledTimes(1);
    expect(atmosphere).toHaveBeenCalledTimes(1);
  });
  it("culls shared light bounds while leaving World HUD independent", () => {
    for (const planetId of ["venus", "moon"] as const) {
      const planet = makePlanet(planetId, -10.01);
      const light = vi.fn();
      const { frame } = makeBodyFrame(planet, "practice");
      frame.bodyAppearances = new Map<number, BodyAppearance>([
        [
          1,
          {
            worldBounds: (_frame, target) => ({
              left: target.pos.x - target.radius,
              top: target.pos.y - target.radius,
              right: target.pos.x + target.radius,
              bottom: target.pos.y + target.radius,
            }),
            drawWorld: vi.fn(),
            light: {
              bounds: (_frame, target) => ({
                left: target.pos.x - target.radius,
                top: target.pos.y - target.radius,
                right: target.pos.x + target.radius,
                bottom: target.pos.y + target.radius,
              }),
              draw: light,
            },
          },
        ],
      ]);

      getPass("body-light").draw(frame, bodyContext());
      expect(light).not.toHaveBeenCalled();

      planet.pos.x = -10;
      getPass("body-light").draw(frame, bodyContext());
      expect(light).toHaveBeenCalledTimes(1);
    }

    const outside = makePlanet("moon", -30);
    const { frame, drawPlanet } = makeBodyFrame(outside, "practice");
    let arcs = 0;
    const hudContext = {
      canvas: {
        width: 100,
        height: 100,
        getBoundingClientRect: () => ({ width: 100, height: 100 }),
      },
      getTransform: () => ({ a: 1, b: 0, c: 0, d: 1 }),
      save() {},
      restore() {},
      setLineDash() {},
      beginPath() {},
      arc() {
        arcs++;
      },
      stroke() {},
      moveTo() {},
      lineTo() {},
      strokeText() {},
      fillText() {},
    } as unknown as CanvasRenderingContext2D;
    getPass("planets").draw(frame, bodyContext());
    expect(drawPlanet).not.toHaveBeenCalled();
    getPass("world-hud").draw(frame, hudContext);
    expect(arcs).toBeGreaterThan(0);
  });
  it("selects different body compositions from appearance data without frame branches", () => {
    const inner = makePlanet("synthetic-inner", 25);
    inner.systemPosition = 1;
    const outer = makePlanet("synthetic-outer", 75);
    outer.systemPosition = 4;
    const first = vi.fn();
    const second = vi.fn();
    const { frame } = makeBodyFrame(inner, "survival");
    frame.sim.planets.push(outer);
    frame.bodyAppearances = new Map<number, BodyAppearance>([
      [
        1,
        {
          worldBounds: (_frame, planet) => ({
            left: planet.pos.x - 10,
            top: planet.pos.y - 10,
            right: planet.pos.x + 10,
            bottom: planet.pos.y + 10,
          }),
          drawWorld: first,
        },
      ],
      [
        4,
        {
          worldBounds: (_frame, planet) => ({
            left: planet.pos.x - 10,
            top: planet.pos.y - 10,
            right: planet.pos.x + 10,
            bottom: planet.pos.y + 10,
          }),
          drawWorld: second,
        },
      ],
    ]);

    getPass("planets").draw(frame, bodyContext());
    expect(first).toHaveBeenCalledWith(frame, expect.anything(), inner);
    expect(second).toHaveBeenCalledWith(frame, expect.anything(), outer);
    expect(frame.renderer.drawPlanet).not.toHaveBeenCalled();
  });
  it("draws and reports exactly the included passes, in order", () => {
    const { calls, frame } = record();
    const some = ids.filter((_, index) => index % 2 === 1);
    const observed: string[] = [];
    drawFlightFrame(frame, {
      include: (pass) => some.includes(pass.id),
      observe: (pass) => observed.push(pass.id),
    });
    expect(drawn(calls)).toEqual(some);
    expect(observed).toEqual(some);
  });
  it("renders scene-supplied solid and light passes on their own camera-transformed layers", () => {
    const { calls, frame } = record();
    const passes: FlightPass[] = [
      {
        id: "rock",
        name: "Rock",
        layer: "world",
        space: "world",
        draws: "body",
        source: "study",
        draw: (_frame, ctx) => {
          expect(ctx).toBe(frame.layers.world);
          calls.push("draw:rock");
        },
      },
      {
        id: "rock-light",
        name: "Rock light",
        layer: "lfx",
        space: "world",
        draws: "shade",
        source: "study",
        draw: (_frame, ctx) => {
          expect(ctx).toBe(frame.layers.lfx);
          calls.push("draw:rock-light");
        },
      },
    ];
    drawFlightFrame(frame, { passes });
    expect(drawn(calls)).toEqual(["rock", "rock-light"]);
    expect(calls.filter((call) => call.startsWith("camera:"))).toEqual([
      "camera:world",
      "camera:lfx",
    ]);
    expect(FLIGHT_PASSES.map((pass) => pass.id)).toEqual(ids);
  });
});
