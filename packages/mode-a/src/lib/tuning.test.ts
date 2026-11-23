import { initializePlanets, SURVIVAL_CONFIG } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { type GravityTuning, GravityTuningSchema } from "./schemas/gravity";
import {
  applyGravityTuning,
  planetMass,
  Simulation,
  tunedMassWell,
} from "./simulation";
import { GRAVITY_TUNING } from "./tuning";
import { applyYellowFamilyProfile } from "./yellow-star-family";

// Contract: docs/specs/game/world/gravity-field, "Tuning values".
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
    applyYellowFamilyProfile(tuned.star, sim.star.radius, GRAVITY_TUNING);
    expect(sim.star.massWell).toEqual(tuned.star.massWell);
    expect(sim.star.influenceRadius).toBe(tuned.star.influenceRadius);
    expect(sim.planets.map((p) => p.massWell)).toEqual(
      sim.planets.map((p) =>
        tunedMassWell(planetMass(p.id, GRAVITY_TUNING, p.radius)),
      ),
    );
  });

  it("refuses a planet without a configured mass", () => {
    const { [SURVIVAL_CONFIG.PLANETS[0].id]: _, ...missing } =
      GRAVITY_TUNING.planetMass;
    expect(() => bodies({ ...GRAVITY_TUNING, planetMass: missing })).toThrow();
  });

  const planetId = SURVIVAL_CONFIG.PLANETS[0].id;
  it.each([
    ["falloff", { falloff: "inverse" as const }],
    ["cutoff", { cutoff: GRAVITY_TUNING.cutoff * 2 }],
    ["sunMass", { sunMass: GRAVITY_TUNING.sunMass * 2 }],
    [
      "mercurial.referenceMass",
      {
        mercurial: {
          ...GRAVITY_TUNING.mercurial,
          referenceMass: GRAVITY_TUNING.mercurial.referenceMass * 2,
        },
      },
    ],
    [
      "mercurial.coreFraction",
      { mercurial: { ...GRAVITY_TUNING.mercurial, coreFraction: 0.5 } },
    ],
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
});
