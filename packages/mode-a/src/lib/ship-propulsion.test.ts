import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines } from "./build-flight";
import { buildStats, defaultLoadout } from "./schemas/loadout";

const both = { leftThruster: true, rightThruster: true, fire: false };
const ship = () => ({
  pos: new Vec2(0, 0),
  vel: new Vec2(0, 0),
  acc: new Vec2(0, 0),
  rotation: 0,
  radius: 16,
});

describe("ship propulsion contract", () => {
  it("counts a side engine pair once per physical mount", () => {
    const ceiling = (side: "ion" | "fusion", aft: "ion" | "fusion") => {
      const build = defaultLoadout("fighter");
      build.side = side;
      build.aft = [aft, null];
      return buildStats(build).poweredCruiseCeiling;
    };
    const aftStep = ceiling("ion", "fusion") - ceiling("ion", "ion");
    expect(aftStep).not.toBe(0);
    expect(ceiling("fusion", "ion") - ceiling("ion", "ion")).toBeCloseTo(
      2 * aftStep,
    );
  });

  it("equipment and stabilizers add nothing to the ceiling; a fitted engine does", () => {
    const build = defaultLoadout("fighter");
    const initial = buildStats(build).poweredCruiseCeiling;
    build.hull[0] = "heavy-well";
    build.stabilizers = !build.stabilizers;
    expect(buildStats(build).poweredCruiseCeiling).toBe(initial);
    build.aft[0] = "plasma";
    expect(buildStats(build).poweredCruiseCeiling).toBeGreaterThan(initial);
  });

  it("an inactive engine raises the ceiling used by firing engines", () => {
    const build = defaultLoadout("fighter");
    build.stabilizers = false;
    const oldCeiling = buildStats(build).poweredCruiseCeiling;
    build.aft[0] = "plasma";
    const craft = ship();
    craft.vel.set(oldCeiling, 0);
    // Plasma is still charging, so only the side engines fire.
    const output = applyBuildEngines(craft, build, both, 1 / 240, true, {});
    expect(output.aft[0]).toBe(0);
    expect(output.left).toBeGreaterThan(0);
    expect(craft.vel.x).toBeGreaterThan(oldCeiling);
    expect(craft.vel.mag()).toBeLessThan(
      buildStats(build).poweredCruiseCeiling,
    );
  });
});
