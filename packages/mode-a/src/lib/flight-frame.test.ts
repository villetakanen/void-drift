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
