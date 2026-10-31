import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const instructions = readFileSync("AGENTS.md", "utf8");
const lineCount = instructions.trimEnd().split("\n").length;
assert(
	lineCount < 80,
	`AGENTS.md has ${lineCount} lines; it must stay below 80.`,
);
for (const match of instructions.matchAll(/`((?:docs|\.agents)\/[^`]+)`/g)) {
	assert(existsSync(match[1]), `Missing agent context: ${match[1]}`);
}
console.log(
	`Agent entry point: ${lineCount} lines; all context links resolve.`,
);
