import { massWellReach } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { DEFAULT_DOCUMENT, GravityTuningConfig } from ".";

// Contract: docs/specs/gravity-tuning.md.
describe("document", () => {
  it("accepts the default document and refuses impossible settings", () => {
    expect(GravityTuningConfig.parse(DEFAULT_DOCUMENT)).toEqual(
      DEFAULT_DOCUMENT,
    );
    const refused = [
      { ...DEFAULT_DOCUMENT, ships: [] },
      { ...DEFAULT_DOCUMENT, startSpeed: -1 },
      { ...DEFAULT_DOCUMENT, well: { ...DEFAULT_DOCUMENT.well, strength: 0 } },
      {
        ...DEFAULT_DOCUMENT,
        well: { ...DEFAULT_DOCUMENT.well, cutoff: 0 },
      },
      { ...DEFAULT_DOCUMENT, burn: "coast" },
      {
        ...DEFAULT_DOCUMENT,
        well: { ...DEFAULT_DOCUMENT.well, falloff: "linear" },
      },
      {
        ...DEFAULT_DOCUMENT,
        well: {
          ...DEFAULT_DOCUMENT.well,
          radius: massWellReach(
            DEFAULT_DOCUMENT.well.strength,
            DEFAULT_DOCUMENT.well.cutoff,
          ),
        },
      },
    ];
    for (const doc of refused)
      expect(GravityTuningConfig.safeParse(doc).success).toBe(false);
  });
});
