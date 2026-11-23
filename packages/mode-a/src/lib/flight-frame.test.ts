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
} from "./flight-frame";

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
  const layers: FlightLayerContexts = {
    world: layer("world"),
    fx: layer("fx"),
    lfx: layer("lfx"),
  };
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

const square = (half: number) => (_frame: FlightFrame, target: Planet) => ({
  left: target.pos.x - half,
  top: target.pos.y - half,
  right: target.pos.x + half,
  bottom: target.pos.y + half,
});

describe("flight frame", () => {
  it("copies the finalized FX image once after the aperture cut and omits the copy during history replay", () => {
    const { calls, frame } = record();
    const source = frame.layers.fx.canvas;
    const drawImage = vi.fn((_image: unknown) => calls.push("present:glow"));
    frame.layers.fxGlow = {
      width: 0,
      height: 0,
      getContext: () => ({ clearRect: vi.fn(), drawImage }),
    } as unknown as HTMLCanvasElement;

    drawFlightFrame(frame, {
      include: (pass) => pass.layer === "fx",
      presentFx: false,
    });
    expect(drawImage).not.toHaveBeenCalled();

    calls.length = 0;
    drawFlightFrame(frame);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(drawImage.mock.calls[0]?.[0]).toBe(source);
    expect(
      calls.filter(
        (call) => call === "draw:aperture-cut" || call === "present:glow",
      ),
    ).toEqual(["draw:aperture-cut", "present:glow"]);
  });
  it("draws the World HUD before any planet body and body light first on LFX", () => {
    expect(ids.indexOf("world-hud")).toBeLessThan(ids.indexOf("planets"));
    expect(FLIGHT_PASSES.filter((pass) => pass.layer === "lfx")[0]?.id).toBe(
      "body-light",
    );
  });
  it("draws no stock body outside the view and draws one inside it", () => {
    const planet = makePlanet("rock", -30);
    const { frame, drawPlanet } = makeBodyFrame(planet, "survival");
    getPass("planets").draw(frame, bodyContext());
    expect(drawPlanet).not.toHaveBeenCalled();
    planet.pos.x = 5;
    getPass("planets").draw(frame, bodyContext());
    expect(drawPlanet).toHaveBeenCalledTimes(1);
  });
  it("culls a composed body by its declared bounds, not its disc", () => {
    // The disc is outside the view; only the wide bounds reach it.
    const planet = makePlanet("venus", -15);
    const drawWorld = vi.fn();
    const { frame } = makeBodyFrame(planet, "practice");
    const appearances = new Map<number, BodyAppearance>([
      [1, { worldBounds: square(planet.radius), drawWorld }],
    ]);
    frame.bodyAppearances = appearances;
    getPass("planets").draw(frame, bodyContext());
    expect(drawWorld).not.toHaveBeenCalled();
    appearances.set(1, {
      worldBounds: square(planet.radius * 2),
      drawWorld,
    });
    getPass("planets").draw(frame, bodyContext());
    expect(drawWorld).toHaveBeenCalledTimes(1);
  });
  it("culls body light by its bounds while leaving the World HUD independent", () => {
    const planet = makePlanet("moon", -10.01);
    const light = vi.fn();
    const { frame } = makeBodyFrame(planet, "practice");
    frame.bodyAppearances = new Map<number, BodyAppearance>([
      [
        1,
        {
          worldBounds: square(planet.radius),
          drawWorld: vi.fn(),
          light: { bounds: square(planet.radius), draw: light },
        },
      ],
    ]);
    getPass("body-light").draw(frame, bodyContext());
    expect(light).not.toHaveBeenCalled();
    planet.pos.x = -10;
    getPass("body-light").draw(frame, bodyContext());
    expect(light).toHaveBeenCalledTimes(1);

    const outside = makePlanet("moon", -30);
    const hidden = makeBodyFrame(outside, "practice");
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
    getPass("planets").draw(hidden.frame, bodyContext());
    expect(hidden.drawPlanet).not.toHaveBeenCalled();
    getPass("world-hud").draw(hidden.frame, hudContext);
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
      [1, { worldBounds: square(10), drawWorld: first }],
      [4, { worldBounds: square(10), drawWorld: second }],
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
});
