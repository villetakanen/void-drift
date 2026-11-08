import { describe, expect, it } from "vitest";
import { SHIP_IDENTITY } from "./config";
import { starterLoadout } from "./schemas/loadout";
import {
  ShipIdentitiesSchema,
  ShipProfileIdSchema,
} from "./schemas/ship-profile";

const COUNT: Record<string, number> = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
};

describe("ship identity", () => {
  it("names every ship id, with the id as its short name", () => {
    expect(Object.keys(SHIP_IDENTITY)).toEqual(ShipProfileIdSchema.options);
    for (const id of ShipProfileIdSchema.options) {
      expect(SHIP_IDENTITY[id].shortName.toLowerCase()).toBe(id);
    }
  });

  it("rejects a short name that differs from the id", () => {
    const ships = structuredClone(SHIP_IDENTITY);
    ships.corvette.shortName = "Heavy Corvette";
    expect(ShipIdentitiesSchema.safeParse(ships).success).toBe(false);
  });

  it("describes each starter ship's engines and energy packs", () => {
    for (const id of ShipProfileIdSchema.options) {
      const build = starterLoadout(id);
      const engines =
        id === "wasp" ? 1 : 2 + build.aft.filter((part) => part).length;
      const packs = build.hull.filter((part) => part === "battery").length;
      const trait = SHIP_IDENTITY[id].trait;
      expect(COUNT[trait.split(" ")[0]]).toBe(engines);
      expect(
        packs === 0
          ? trait.includes("Standard energy capacity")
          : trait.includes(
              `${Object.keys(COUNT)[packs - 1]} extra energy pack`,
            ),
      ).toBe(true);
    }
  });
});
