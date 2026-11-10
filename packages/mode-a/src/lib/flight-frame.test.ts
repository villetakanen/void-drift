import type { Camera, Renderer } from "@void-drift/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
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
  it("names each layer and each pass once", () => {
    expect(new Set(ids).size).toBe(ids.length);
    const layers = FLIGHT_LAYERS.map((layer) => layer.id);
    expect(new Set(layers).size).toBe(layers.length);
  });

  it("groups the passes by layer in stack order", () => {
    const stack = FLIGHT_LAYERS.map((layer) => layer.id);
    const order = FLIGHT_PASSES.map((pass) => stack.indexOf(pass.layer));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual(order.toSorted((a, b) => a - b));
  });

  it("draws every pass in array order", () => {
    const { calls, frame } = record();
    drawFlightFrame(frame);
    expect(drawn(calls)).toEqual(ids);
  });

  it("draws each pass on its own layer, world passes under the camera", () => {
    const { calls, frame } = record();
    drawFlightFrame(frame);
    for (const pass of FLIGHT_PASSES) {
      const at = calls.indexOf(`draw:${pass.id}`);
      const opened = calls.lastIndexOf(`save:${pass.layer}`, at);
      const bracket = calls.slice(opened, at);
      expect(opened).toBeGreaterThanOrEqual(0);
      expect(bracket.some((call) => call.startsWith("restore:"))).toBe(false);
      expect(bracket.includes(`camera:${pass.layer}`)).toBe(
        pass.space === "world",
      );
      expect(calls[at + 1]).toBe(`restore:${pass.layer}`);
    }
  });

  it("empties the layers above the bottom one before drawing", () => {
    const { calls, frame } = record();
    drawFlightFrame(frame);
    const first = calls.findIndex((call) => call.startsWith("draw:"));
    const cleared = calls
      .slice(0, first)
      .filter((call) => call.startsWith("clear:"))
      .map((call) => call.slice(6));
    expect(cleared).toEqual(FLIGHT_LAYERS.slice(1).map((layer) => layer.id));
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
