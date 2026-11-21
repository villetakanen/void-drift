import { describe, expect, it } from "vitest";
import { parseEngineMaster } from "../../../../scripts/engine-art-from-svg.mjs";
import { ENGINE_ART, ENGINE_MARKINGS } from "./engine-art";
import {
  defaultLoadout,
  LoadoutSchema,
  PARTS,
  type PartId,
} from "./schemas/loadout";

// Vite's glob, declared here: the packages' type check has no Vite client types.
declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { query: string; import: string; eager: true },
    ): Record<string, unknown>;
  }
}
const files = import.meta.glob("./art/engines/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const masters = Object.entries(files).map(([file, svg]) => ({
  file,
  id: svg.match(/data-part="([^"]+)"/)?.[1] ?? "",
  master: parseEngineMaster(svg),
}));

describe("engine SVG masters", () => {
  it("name catalog engines", () => {
    expect(masters.length).toBeGreaterThan(0);
    for (const { id } of masters)
      expect(PARTS[id as PartId]?.category).toBe("E");
  });

  it("equal the art the game draws, pose by pose", () => {
    for (const { id, master } of masters) {
      const art = ENGINE_ART[id];
      expect(Object.keys(master.poses).map(Number).sort()).toEqual(
        Object.keys(art).map(Number).sort(),
      );
      for (const [pose, faces] of Object.entries(master.poses))
        expect(art[Number(pose)]).toEqual(faces);
      expect(ENGINE_MARKINGS[id]).toEqual(master.marking);
    }
  });

  it("give every testing-only engine its marking", () => {
    for (const id of Object.keys(PARTS) as PartId[])
      if (PARTS[id].testingOnly && PARTS[id].category === "E")
        expect(masters.find((m) => m.id === id)?.master.marking).toBeDefined();
  });
});

describe("the Service ion", () => {
  const service = PARTS["service-ion"];

  it("fits as a ship's main engine", () => {
    const build = defaultLoadout("wasp");
    build.side = "service-ion";
    expect(LoadoutSchema.safeParse(build).success).toBe(true);
    expect(service.releaseClass).toBe("preview");
  });

  it("is a weaker, lighter ion engine with a smaller beam in the light ion's ink", () => {
    const light = PARTS.ion;
    expect(service.ion && light.ion).toBeTruthy();
    if (!service.ion || !light.ion) return;
    expect(service.ion.strength).toBeLessThan(light.ion.strength);
    expect(service.mass).toBeLessThan(light.mass);
    expect(service.draw).toBeLessThan(light.draw);
    expect(service.speedContribution).toBeLessThan(light.speedContribution);
    expect(service.ion.beam.length).toBeLessThan(light.ion.beam.length);
    expect(service.ion.beam.width).toBeLessThan(light.ion.beam.width);
    expect(service.ion.beam.ink).toBe(light.ion.beam.ink);
  });

  it("sits aft in its slot and is marked as testing-only", () => {
    expect(service.mount).toBeLessThan(0);
    expect(service.testingOnly).toBe(true);
  });
});
