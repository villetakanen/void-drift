// pnpm tuning:apply <area> <file>: applies a designer-supplied proposal to one
// section of the versioned tuning file (packages/mode-a/src/lib/tuning.json).
// Spec: docs/specs/game/world/gravity-field/spec.md. Each area's
// checks live in TypeScript beside its schemas, loaded here through Vite.
// Exit codes: 0 applied, 1 refused (nothing written), 2 usage.
import { readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createViteServer } from "vitest/node";

const root = resolve(fileURLToPath(import.meta.url), "../..");
// Tests point this at a copy; the game's file otherwise.
const tuningFile = resolve(
  root,
  process.env.VOID_DRIFT_TUNING_FILE ?? "packages/mode-a/src/lib/tuning.json",
);
// Each area: the TypeScript module and export that reads a proposal against the
// tuning file. None yet: the instrument's gravity proposal was removed with its
// field mode; `ship` comes with the Lab usability plan, and gravity again when
// planets adopt reach from mass (gravity-field.md).
const AREAS = {};

const [area, file] = process.argv.slice(2);
if (!AREAS[area] || !file) {
  console.error(
    `Usage: pnpm tuning:apply <area> <proposal file>; areas: ${Object.keys(AREAS).join(", ") || "none yet"}`,
  );
  process.exit(2);
}

const text = readFileSync(resolve(process.cwd(), file), "utf8");
const server = await createViteServer({
  root,
  configFile: false,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});
let result;
try {
  const mod = await server.ssrLoadModule(AREAS[area].module);
  result = mod[AREAS[area].apply](
    text,
    JSON.parse(readFileSync(tuningFile, "utf8")),
  );
} finally {
  await server.close();
}
if (!result.ok) {
  console.error(`Refused, nothing written: ${result.reason}`);
  process.exit(1);
}
writeFileSync(tuningFile, `${JSON.stringify(result.file, null, "\t")}\n`);
console.log(`Applied to ${area} in ${relative(process.cwd(), tuningFile)}:`);
for (const line of result.lines) console.log(`  ${line}`);
