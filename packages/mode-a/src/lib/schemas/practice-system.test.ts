import { expect, it } from "vitest";
import { PRACTICE_SYSTEM } from "../tuning";
import { PracticeSystemSchema } from "./practice-system";

it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  "rejects invalid orbital configuration: %s",
  (value) => {
    expect(
      PracticeSystemSchema.safeParse({
        ...PRACTICE_SYSTEM,
        venus: { ...PRACTICE_SYSTEM.venus, orbitRadius: value },
      }).success,
    ).toBe(false);
  },
);

it("rejects missing fields and unknown configuration keys", () => {
  const { phaseSeed: _, ...missing } = PRACTICE_SYSTEM;
  expect(PracticeSystemSchema.safeParse(missing).success).toBe(false);
  expect(
    PracticeSystemSchema.safeParse({
      ...PRACTICE_SYSTEM,
      cradle: { ...PRACTICE_SYSTEM.cradle, mass: 1 },
    }).success,
  ).toBe(false);
});
