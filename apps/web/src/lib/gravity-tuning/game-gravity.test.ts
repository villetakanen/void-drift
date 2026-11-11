import { massWellPull, SUN_CONFIG, SURVIVAL_CONFIG } from "@void-drift/core";
import {
  buildCollisionRadius,
  GRAVITY_TUNING,
  starterLoadout,
} from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { calculate, traces } from "../instrument/calculate";

// Guard (docs/specs/gravity-field.md, "Tuning values"; docs/gravity-model.md):
// the game's masses are absolute, chosen for a pull at contact relative to the
// reference ship's thrust. When ship thrust or a body's size changes, this
// fails and names the bodies to retune on the Gravity tuning bench.
const reference = starterLoadout("fighter");
const thrust = Math.max(
  ...traces(calculate({ label: "Reference", loadout: reference }, "course"))
    .acceleration,
);
const shipRadius = buildCollisionRadius(reference);
const contactPull = (radius: number, mass: number) =>
  massWellPull(radius + shipRadius, mass, GRAVITY_TUNING.falloff) / thrust;

describe("game gravity against the reference ship's thrust", () => {
  it("each planet pulls 0.75–1.5× thrust at contact", () => {
    for (const planet of SURVIVAL_CONFIG.PLANETS) {
      const ratio = contactPull(
        planet.radius,
        GRAVITY_TUNING.planetMass[planet.id],
      );
      expect(ratio, planet.id).toBeGreaterThanOrEqual(0.75);
      expect(ratio, planet.id).toBeLessThanOrEqual(1.5);
    }
  });

  it("the play sun pulls 1.5–3× thrust at contact", () => {
    const ratio = contactPull(SUN_CONFIG.G.radius, GRAVITY_TUNING.sunMass);
    expect(ratio).toBeGreaterThanOrEqual(1.5);
    expect(ratio).toBeLessThanOrEqual(3);
  });

  it("cuts each well off at a pull ships notice: 5–20 % of thrust", () => {
    expect(GRAVITY_TUNING.cutoff / thrust).toBeGreaterThanOrEqual(0.05);
    expect(GRAVITY_TUNING.cutoff / thrust).toBeLessThanOrEqual(0.2);
  });
});
