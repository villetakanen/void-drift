import type { Camera, Renderer } from "@void-drift/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  drawFlightFrame,
  FLIGHT_PASSES,
  type FlightFrame,
} from "./flight-frame";

// Each pass's drawing is replaced by a recorder, so the frame's own ordering
// and camera bracketing are what is under test.
function record() {
  const calls: string[] = [];
  for (const pass of FLIGHT_PASSES)
    vi.spyOn(pass, "draw").mockImplementation(() => {
      calls.push(pass.id);
    });
  const frame = {
    renderer: {
      beginCamera: () => calls.push("camera:begin"),
      endCamera: () => calls.push("camera:end"),
    } as unknown as Renderer,
    camera: {} as Camera,
  } as FlightFrame;
  return { calls, frame };
}
const ids = FLIGHT_PASSES.map((pass) => pass.id);
afterEach(() => vi.restoreAllMocks());

describe("flight frame", () => {
  it("names each pass once", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("draws every pass in array order", () => {
    const { calls, frame } = record();
    drawFlightFrame(frame);
    expect(calls.filter((call) => !call.startsWith("camera:"))).toEqual(ids);
  });

  it("draws world passes inside the camera and screen passes outside it", () => {
    const { calls, frame } = record();
    drawFlightFrame(frame);
    let inside = false;
    for (const call of calls) {
      if (call === "camera:begin") inside = true;
      else if (call === "camera:end") inside = false;
      else {
        const pass = FLIGHT_PASSES.find(({ id }) => id === call);
        expect(inside).toBe(pass?.space === "world");
      }
    }
    expect(inside).toBe(false);
  });

  it("draws and reports exactly the included passes, in order", () => {
    const { calls, frame } = record();
    const some = ids.filter((_, index) => index % 2 === 1);
    const observed: string[] = [];
    drawFlightFrame(frame, {
      include: (pass) => some.includes(pass.id),
      observe: (pass) => observed.push(pass.id),
    });
    expect(calls.filter((call) => !call.startsWith("camera:"))).toEqual(some);
    expect(observed).toEqual(some);
  });
});
