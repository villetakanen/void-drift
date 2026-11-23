import { describe, expect, it } from "vitest";
import { projectFlightContact } from "./flight-contact-projection";

const active = { x: 180, y: 48, width: 920, height: 984 };
const centre = { x: 640, y: 540 };
const radius = 438;

describe("flight contact projection", () => {
  it("includes equality and excludes points strictly inside the circle", () => {
    expect(
      projectFlightContact({
        projectedX: centre.x + radius - 0.01,
        projectedY: centre.y,
        worldDistance: 2000,
        active,
      }),
    ).toBeNull();
    expect(
      projectFlightContact({
        projectedX: centre.x + radius,
        projectedY: centre.y,
        worldDistance: 2000,
        active,
      }),
    ).not.toBeNull();
  });

  it("places corner bearings on the active-box circle with zoom-independent arc size", () => {
    const cue = projectFlightContact({
      projectedX: 1090,
      projectedY: 900,
      worldDistance: 2000,
      active,
    });
    if (!cue) throw new Error("Expected a visible contact");
    expect(Math.hypot(cue.x - centre.x, cue.y - centre.y)).toBeCloseTo(radius);
    expect(
      projectFlightContact({
        projectedX: 1300,
        projectedY: 700,
        worldDistance: 2000,
        active,
      })?.arcLength,
    ).toBe(cue.arcLength);
  });

  it("suppresses an active area too small to contain the complete cue", () => {
    expect(
      projectFlightContact({
        projectedX: 1000,
        projectedY: 1000,
        worldDistance: 1000,
        active: { x: 0, y: 0, width: 60, height: 60 },
      }),
    ).toBeNull();
  });
});
