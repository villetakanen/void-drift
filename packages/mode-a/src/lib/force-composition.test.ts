import { expect, it } from "vitest";
import {
  forceComposition,
  forwardAcceleration,
} from "../../../../apps/web/src/components/studies/force-composition";
import { CHASSIS, PARTS } from "./schemas/loadout";

it("separates combined force from mass and diminishing ceilings", () => {
  const one = forceComposition(0, false, true),
    two = forceComposition(1, false, true);
  expect(two.force).toBe(2 * one.force);
  expect(two.acceleration).toBe(2 * one.acceleration);
  expect(two.ceiling).toBeGreaterThan(one.ceiling);
  expect(two.ceiling).toBeLessThan(2 * one.ceiling);
  const fitted = forceComposition(3, true, true),
    fixed = forceComposition(3, false, true),
    charging = forceComposition(3, true, false);
  expect(fitted.mass).toBe(
    CHASSIS.fighter.mass + PARTS.ion.mass + PARTS.plasma.mass,
  );
  expect(fitted.ceiling).toBe(fixed.ceiling);
  expect(fitted.acceleration * fitted.mass).toBeCloseTo(
    fixed.acceleration * fixed.mass,
  );
  expect(charging.mass).toBe(fitted.mass);
  expect(charging.force).toBe(one.force);
});
it("samples production taper at rest, cruising speed, and overspeed", () => {
  const row = forceComposition(1, false, true);
  expect(forwardAcceleration(row.force, row.mass, row.ceiling, 0)).toBeCloseTo(
    row.acceleration,
    9,
  );
  expect(
    forwardAcceleration(row.force, row.mass, row.ceiling, row.ceiling / 2),
  ).toBeCloseTo(row.acceleration / 2, 9);
  expect(
    forwardAcceleration(row.force, row.mass, row.ceiling, row.ceiling * 2),
  ).toBeCloseTo(0, 9);
});
