import {
  initializePlanets,
  massWellReach,
  SURVIVAL_CONFIG,
} from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type GravityTuning, GravityTuningSchema } from "./schemas/gravity";
import { applyGravityTuning, Simulation } from "./simulation";
import { GRAVITY_TUNING } from "./tuning";

// Contract: docs/specs/gravity-field.md, "Tuning values".
function bodies(tuning: GravityTuning) {
  const star = createStar("G", 960, 540);
  const planets = initializePlanets(960, 540);
  applyGravityTuning(star, planets, tuning);
  return { star, planets };
}

describe("gravity tuning", () => {
  it("is what the simulation flies", () => {
    const sim = new Simulation();
    const tuned = bodies(GRAVITY_TUNING);
    expect(sim.star.massWell).toEqual(tuned.star.massWell);
    expect(sim.star.influenceRadius).toBe(tuned.star.influenceRadius);
    expect(sim.planets.map((p) => p.massWell)).toEqual(
      tuned.planets.map((p) => p.massWell),
    );
  });

  it("gives every configured planet a mass", () => {
    const { planets } = bodies(GRAVITY_TUNING);
    expect(planets.map((p) => p.id)).toEqual(
      SURVIVAL_CONFIG.PLANETS.map((p) => p.id),
    );
    for (const planet of planets)
      expect(planet.massWell?.mass, planet.id).toBeGreaterThan(0);
    const { [SURVIVAL_CONFIG.PLANETS[0].id]: _, ...missing } =
      GRAVITY_TUNING.planetMass;
    expect(() => bodies({ ...GRAVITY_TUNING, planetMass: missing })).toThrow();
  });

  it("puts the sun's reach where its pull falls to the cut-off", () => {
    const { star } = bodies(GRAVITY_TUNING);
    expect(star.influenceRadius).toBe(
      massWellReach(
        GRAVITY_TUNING.sunMass,
        GRAVITY_TUNING.cutoff,
        GRAVITY_TUNING.falloff,
      ),
    );
  });

  const planetId = SURVIVAL_CONFIG.PLANETS[0].id;
  it.each([
    ["falloff", { falloff: "inverse" as const }],
    ["cutoff", { cutoff: GRAVITY_TUNING.cutoff * 2 }],
    ["sunMass", { sunMass: GRAVITY_TUNING.sunMass * 2 }],
    [
      "planetMass",
      {
        planetMass: {
          ...GRAVITY_TUNING.planetMass,
          [planetId]: GRAVITY_TUNING.planetMass[planetId] * 2,
        },
      },
    ],
  ])("changing %s changes the bodies", (_, change) => {
    const stock = bodies(GRAVITY_TUNING);
    const changed = bodies(
      GravityTuningSchema.parse({ ...GRAVITY_TUNING, ...change }),
    );
    expect(changed).not.toEqual(stock);
  });

  it("rejects unknown and impossible values", () => {
    expect(
      GravityTuningSchema.safeParse({ ...GRAVITY_TUNING, drag: 1 }).success,
    ).toBe(false);
    expect(
      GravityTuningSchema.safeParse({ ...GRAVITY_TUNING, sunMass: -1 }).success,
    ).toBe(false);
  });
});
