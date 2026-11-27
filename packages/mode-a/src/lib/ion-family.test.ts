import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines } from "./build-flight";
import {
  defaultLoadout,
  ionStrength,
  PARTS,
  type PartId,
  partIon,
} from "./schemas/loadout";

const both = { leftThruster: true, rightThruster: true, fire: false };
const ionEngines = (Object.keys(PARTS) as PartId[]).filter((id) =>
  partIon(PARTS[id]),
);

describe("the ion engine family", () => {
  it("accelerates from rest in proportion to strength at equal ship mass", () => {
    const sameMass = Object.fromEntries(
      Object.entries(PARTS).map(([id, part]) => [
        id,
        partIon(part) ? { ...part, mass: PARTS.ion.mass } : part,
      ]),
    ) as typeof PARTS;
    const speedAfterOneTick = (id: PartId) => {
      const build = defaultLoadout("wasp");
      build.side = id as typeof build.side;
      build.stabilizers = false;
      const ship = {
        pos: new Vec2(0, 0),
        vel: new Vec2(0, 0),
        acc: new Vec2(0, 0),
        rotation: 0,
        radius: 16,
      };
      applyBuildEngines(
        ship,
        build,
        both,
        1 / 240,
        true,
        {},
        1,
        undefined,
        undefined,
        sameMass,
      );
      return ship.vel.mag();
    };
    for (const id of ionEngines)
      expect(speedAfterOneTick(id) / speedAfterOneTick("ion")).toBeCloseTo(
        ionStrength(id),
        6,
      );
  });
});
