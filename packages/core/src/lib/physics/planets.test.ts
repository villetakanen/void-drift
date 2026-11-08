import { describe, expect, it } from "vitest";
import { SURVIVAL_CONFIG } from "../config";
import { initializePlanets } from "./planets";

describe("initializePlanets", () => {
  it("returns the configured deterministic roster", () => {
    const planets = initializePlanets(960, 540);

    expect(planets).toHaveLength(SURVIVAL_CONFIG.PLANETS.length);
    expect(planets.map((planet) => planet.orbitRadius)).toEqual(
      SURVIVAL_CONFIG.PLANETS.map((planet) => planet.orbitRadius),
    );
    expect(planets.map((planet) => planet.orbitSpeed)).toEqual(
      SURVIVAL_CONFIG.PLANETS.map((planet) => planet.orbitSpeed),
    );
  });

  it("initializes the moon with retrograde orbit speed", () => {
    const moonIndex = SURVIVAL_CONFIG.PLANETS.findIndex(
      (planet) => planet.id === "moon",
    );
    expect(moonIndex).toBeGreaterThanOrEqual(0);
    expect(initializePlanets(960, 540)[moonIndex].orbitSpeed).toBeLessThan(0);
  });
});
