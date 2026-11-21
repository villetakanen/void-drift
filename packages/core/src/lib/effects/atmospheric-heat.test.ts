import { describe, expect, it } from "vitest";
import type { AirSample } from "../physics/atmosphere";
import { heatStrength } from "./atmospheric-heat";

const sample = (density: number, speed: number): AirSample => ({
  density,
  towardPlanet: { x: 1, y: 0 },
  relativeVelocity: { x: 0, y: speed },
});

describe("atmospheric heat strength", () => {
  it("is zero outside the air", () => {
    expect(heatStrength(null)).toBe(0);
  });

  it("shows on contact even at low speed", () => {
    expect(heatStrength(sample(0.2, 0))).toBeGreaterThan(0);
  });

  it("grows with density at the same speed", () => {
    expect(heatStrength(sample(0.4, 120))).toBeGreaterThan(
      heatStrength(sample(0.1, 120)),
    );
  });

  it("grows with relative speed at the same density", () => {
    expect(heatStrength(sample(0.3, 200))).toBeGreaterThan(
      heatStrength(sample(0.3, 60)),
    );
  });

  it("never exceeds full strength", () => {
    expect(heatStrength(sample(1, 5000))).toBeLessThanOrEqual(1);
  });
});
