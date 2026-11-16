import type { Camera, Renderer } from "@void-drift/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  drawFlightFrame,
  FLIGHT_LAYERS,
  FLIGHT_PASSES,
  type FlightFrame,
  type FlightLayerContexts,
  type FlightLayerId,
  type FlightPass,
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

describe("flight frame", () => {
  it("draws the shared planet HUD once before every planet body", () => {
    expect(ids.filter((id) => id === "world-hud")).toHaveLength(1);
    expect(ids).not.toContain("mercury-hud");
    expect(ids).not.toContain("venus-hud");
    expect(ids.indexOf("world-hud")).toBeLessThan(ids.indexOf("planets"));
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
