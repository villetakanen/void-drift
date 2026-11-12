import { solarCollectionRate, solarDamageRate } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { GRAVITY_TUNING } from "./tuning";
import {
  applyYellowFamilyProfile,
  yellowFamilyNumber,
} from "./yellow-star-family";

describe("yellow-family fields", () => {
  it("keeps the reference and extreme sizes at G7 and G14", () => {
    expect(yellowFamilyNumber(36)).toBe(4);
    expect(yellowFamilyNumber(70)).toBe(7);
    expect(yellowFamilyNumber(140)).toBe(14);
  });

  it("uses independent collection and danger reaches outside the legacy Sun", () => {
    const star = createStar("G", 0, 0);
    applyYellowFamilyProfile(star, 140, GRAVITY_TUNING);

    expect(solarCollectionRate(500, star)).toBeGreaterThan(0);
    expect(star.influenceRadius).toBeGreaterThan(
      star.collectionField?.reach ?? 0,
    );
    expect(solarDamageRate(150, star)).toBeGreaterThan(0);
  });
});
