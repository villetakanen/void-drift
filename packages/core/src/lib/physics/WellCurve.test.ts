import { describe, expect, it } from "vitest";
import { wellAcceleration } from "./Physics";

describe("bounded inverse-square well", () => {
  it("vanishes continuously at the border and remains zero beyond", () => {
    expect(wellAcceleration(315, 315, 600, "inverse-square")).toBe(0);
    expect(wellAcceleration(400, 315, 600, "inverse-square")).toBe(0);
    expect(
      wellAcceleration(315 - 0.000001, 315, 600, "inverse-square"),
    ).toBeLessThan(0.000001);
  });
  it("pulls half its strength at half reach", () => {
    expect(wellAcceleration(315 / 2, 315, 600, "inverse-square")).toBe(600 / 2);
  });
});
