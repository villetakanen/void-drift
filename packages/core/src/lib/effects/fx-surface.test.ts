import { expect, it } from "vitest";
import { fxRetention } from "./fx-surface";

it("shared image decay depends on elapsed game time, not display frequency", () => {
  expect(fxRetention(0)).toBe(1);
  expect(fxRetention(1 / 60) ** 30).toBeCloseTo(fxRetention(1 / 30) ** 15, 12);
  expect(fxRetention(0.5)).toBeCloseTo(fxRetention(1 / 60) ** 30, 12);
});
