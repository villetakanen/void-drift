import { describe, expect, it } from "vitest";
import {
  BURN_IDS,
  BURNS,
  calculate,
  InstrumentConfig,
  TOTAL_TICKS,
  traces,
} from "../../../../apps/web/src/lib/instrument";

const fighter = (aft: [string | null, string | null]) => ({
  version: 2,
  chassis: "fighter",
  side: "ion",
  stabilizers: true,
  hull: [null, null],
  aft,
});
// The document accepted in the lab-instrument study (02.7).
const document = {
  version: 1,
  properties: { plasma: { thrust: 46000 } },
  vehicles: [
    { label: "Ion aft", loadout: fighter(["ion", "ion"]) },
    { label: "Plasma aft", loadout: fighter(["plasma", "plasma"]) },
  ],
};

it("every burn lasts the whole run", () => {
  for (const id of BURN_IDS)
    expect(BURNS[id].segments.reduce((a, s) => a + s.ticks, 0)).toBe(
      TOTAL_TICKS,
    );
});

describe("configuration document", () => {
  it("rejects a loadout that does not fit its chassis", () => {
    const broken = structuredClone(document);
    broken.vehicles[0].loadout.aft = ["ion"] as never;
    expect(InstrumentConfig.safeParse(broken).success).toBe(false);
  });
  it("rejects per-vehicle overrides, unknown fields and unknown burns", () => {
    expect(
      InstrumentConfig.safeParse({
        ...document,
        vehicles: [
          { ...document.vehicles[0], changes: { plasma: { thrust: 1 } } },
        ],
      }).success,
    ).toBe(false);
    expect(
      InstrumentConfig.safeParse({
        ...document,
        properties: { ion: { maxSpeed: 200 } },
      }).success,
    ).toBe(false);
    expect(
      InstrumentConfig.safeParse({ ...document, burn: "loop" }).success,
    ).toBe(false);
  });
});

describe("calculation", () => {
  const config = InstrumentConfig.parse(document);
  it("is deterministic", () => {
    expect(calculate(config.vehicles[1], "course")).toEqual(
      calculate(config.vehicles[1], "course"),
    );
  });
  it("applies one experiment-wide property set", () => {
    const stock = traces(calculate(config.vehicles[1], "course")).speed;
    const changed = traces(
      calculate(config.vehicles[1], "course", {}, config.properties),
    ).speed;
    expect(Math.max(...changed)).toBeGreaterThan(Math.max(...stock));
  });
});
