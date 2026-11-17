// Converts an engine's SVG master into its technical artefact: the faces the
// game draws in each pose, and its testing-only marking when it has one.
//
//   node scripts/engine-art-from-svg.mjs <master.svg> <EXPORT_NAME> > <art.ts>
//
// The master's conventions: one <g data-pose="N"> per pose, faces as
// <polygon data-face points="…" fill="…"> in drawing order, and an optional
// <g data-marking data-width data-gap data-outer> for the testing-only marking.
// `parseEngineMaster` is also what the parity test reads.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

const points = (list) =>
  list
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number));

// Tolerant of formatting: attributes may sit on their own lines.
export function parseEngineMaster(svg) {
  const poses = {};
  // Each pose runs from its group's opening tag to the next pose or the end.
  const starts = [...svg.matchAll(/<g\b[^>]*\sdata-pose="(\d+)"[^>]*>/g)];
  starts.forEach((start, i) => {
    const body = svg.slice(start.index, starts[i + 1]?.index ?? svg.length);
    poses[start[1]] = [
      ...body.matchAll(/<polygon\b[^>]*\sdata-face\b[^>]*>/g),
    ].map(([tag]) => ({
      points: points(attr(tag, "points")),
      color: attr(tag, "fill"),
    }));
  });
  const marking = svg.match(/<g\b[^>]*\sdata-marking\b[^>]*>/)?.[0];
  const body = svg.match(
    /<clipPath\b[^>]*\sid="[^"]*-body"[^>]*>([\s\S]*?)<\/clipPath>/,
  )?.[1];
  const band = svg.match(
    /<clipPath\b[^>]*\sid="[^"]*-marking-band"[^>]*>\s*(<rect\b[^>]*>)/,
  )?.[1];
  return {
    poses,
    marking:
      marking && body && band
        ? {
            width: Number(attr(marking, "data-width")),
            gap: Number(attr(marking, "data-gap")),
            outer: Number(attr(marking, "data-outer")),
            band: { x: Number(attr(band, "x")), y: Number(attr(band, "y")) },
            body: [...body.matchAll(/<polygon[^>]*>/g)].map(([tag]) =>
              points(attr(tag, "points")),
            ),
          }
        : undefined,
  };
}

function toModule(master, name, source) {
  const faces = (list) =>
    list
      .map(
        (face) =>
          `    { points: [${face.points.map(([x, y]) => `[${x}, ${y}]`).join(", ")}], color: "${face.color}" },`,
      )
      .join("\n");
  return `// Generated from ${source} by scripts/engine-art-from-svg.mjs; edit the master, not this file.
import type { EngineFace } from "./engine-art";
${master.marking ? 'import type { TestingMarking } from "./testing-marking";\n' : ""}
export const ${name}: Record<number, readonly EngineFace[]> = {
${Object.entries(master.poses)
  .map(([pose, list]) => `  ${pose}: [\n${faces(list)}\n  ],`)
  .join("\n")}
};
${
  master.marking
    ? `export const ${name}_MARKING: TestingMarking = ${JSON.stringify(master.marking).replace(/"(\w+)":/g, "$1: ")};\n`
    : ""
}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [file, name] = process.argv.slice(2);
  if (!file || !name)
    throw new Error(
      "Usage: engine-art-from-svg.mjs <master.svg> <EXPORT_NAME>",
    );
  process.stdout.write(
    toModule(parseEngineMaster(readFileSync(file, "utf8")), name, file),
  );
}
