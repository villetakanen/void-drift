import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** Writes a measurement report as JSON, creating its folder. */
export function writeReport(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
