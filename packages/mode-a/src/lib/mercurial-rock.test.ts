import { massWellReach, planetPull, Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyMercurialGravity, mercurialMass } from "./mercurial-rock";
import { GravityTuningSchema } from "./schemas/gravity";
import { gameSettings, Simulation, stockSettings } from "./simulation";
import { GRAVITY_TUNING } from "./tuning";

describe("core-led mercurial gravity", () => {
  it.each([
    [16, 728.878600823],
    [27, 870],
    [36, 1039.166666667],
  ])("calibrates radius %s to mass %s", (radius, mass) => {
    expect(mercurialMass(radius)).toBeCloseTo(mass, 7);
  });

  it("rejects invalid radii and conflicting or invalid tuning", () => {
    for (const radius of [15.9, 36.1, NaN, Infinity])
      expect(() => mercurialMass(radius)).toThrow();
    for (const change of [
      { referenceRadius: 0 },
      { referenceMass: -1 },
      { coreFraction: 1.01 },
      { coreFraction: NaN },
    ]) {
      expect(
        GravityTuningSchema.safeParse({
          ...GRAVITY_TUNING,
          mercurial: { ...GRAVITY_TUNING.mercurial, ...change },
        }).success,
      ).toBe(false);
    }
    for (const field of ["planetMass", "practicePlanetMass"] as const) {
      expect(
        GravityTuningSchema.safeParse({
          ...GRAVITY_TUNING,
          [field]: { ...GRAVITY_TUNING[field], moon: 1450 },
        }).success,
      ).toBe(false);
    }
  });

  it("gives every generated mode Practice Mercury's planet pull at 27u", () => {
    const mercury = new Simulation({
      ...stockSettings(),
      mode: "practice",
    }).planets.find((p) => p.id === "moon");
    if (!mercury?.massWell) throw new Error("Mercury missing");
    for (const mode of ["survival", "derelicts", "gauntlet"] as const) {
      const planet = new Simulation({
        ...gameSettings("wasp"),
        mode,
      }).planets.find((p) => p.id === "moon");
      if (!planet) throw new Error("Mercurial missing");
      planet.radius = 27;
      applyMercurialGravity(planet);
      expect(planet.mass).toBe(870);
      expect(planet.massWell).toEqual(mercury.massWell);
      const reach = massWellReach(
        870,
        GRAVITY_TUNING.cutoff,
        GRAVITY_TUNING.falloff,
      );
      for (const shipRadius of [10, 31])
        for (const distance of [27 + shipRadius + 1, 100, reach + 1]) {
          const pull = planetPull(
            new Vec2(planet.pos.x + distance, planet.pos.y),
            shipRadius,
            planet,
          );
          const reference = planetPull(
            new Vec2(mercury.pos.x + distance, mercury.pos.y),
            shipRadius,
            mercury,
          );
          expect(pull.x).toBeCloseTo(reference.x, 9);
          expect(pull.y).toBeCloseTo(reference.y, 9);
        }
    }
  });
});
