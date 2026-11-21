import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines } from "./build-flight";
import { buildPlumeEmitters } from "./build-renderer";
import {
  defaultLoadout,
  ionStrength,
  PARTS,
  type PartId,
  PartSchema,
} from "./schemas/loadout";

const both = { leftThruster: true, rightThruster: true, fire: false };
const ionEngines = (Object.keys(PARTS) as PartId[]).filter(
  (id) => PARTS[id].ion,
);

describe("the ion engine family", () => {
  it("is defined by the catalog, with the light ion as its reference", () => {
    expect(ionEngines).toContain("ion");
    expect(ionStrength("ion")).toBe(1);
    for (const id of Object.keys(PARTS) as PartId[])
      expect(ionStrength(id) > 0).toBe(Boolean(PARTS[id].ion));
  });

  it("gives each member catalog thrust in proportion to its strength", () => {
    for (const id of ionEngines)
      expect(PARTS[id].thrust).toBeCloseTo(
        PARTS.ion.thrust * ionStrength(id),
        6,
      );
  });

  it("accelerates from rest in proportion to strength at equal ship mass", () => {
    const sameMass = Object.fromEntries(
      Object.entries(PARTS).map(([id, part]) => [
        id,
        part.ion ? { ...part, mass: PARTS.ion.mass } : part,
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

  it("draws each member's plume with its own catalog beam", () => {
    for (const id of ionEngines) {
      const build = defaultLoadout("wasp");
      build.side = id as typeof build.side;
      const [main] = buildPlumeEmitters(build);
      expect(main.beam).toBe(PARTS[id].ion?.beam);
    }
    const fission = defaultLoadout("wasp");
    fission.side = "fusion";
    expect(buildPlumeEmitters(fission)[0].beam).toBeUndefined();
  });

  it("admits only steady engines", () => {
    const pulsed = { ...PARTS.fusion, ion: PARTS.ion.ion };
    expect(PartSchema.safeParse(pulsed).success).toBe(false);
  });
});
