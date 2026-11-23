import { expect, it } from "vitest";
import { parseEngineMaster } from "../../../../scripts/engine-art-from-svg.mjs";
import { ENGINE_ART, ENGINE_MARKINGS } from "./engine-art";

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

it("every engine SVG master equals the art the game draws, pose by pose", () => {
  expect(masters.length).toBeGreaterThan(0);
  for (const { id, master } of masters) {
    const art = ENGINE_ART[id];
    expect(art, id).toBeDefined();
    expect(Object.keys(master.poses).map(Number).sort()).toEqual(
      Object.keys(art).map(Number).sort(),
    );
    for (const [pose, faces] of Object.entries(master.poses))
      expect(art[Number(pose)]).toEqual(faces);
    expect(ENGINE_MARKINGS[id]).toEqual(master.marking);
  }
});
