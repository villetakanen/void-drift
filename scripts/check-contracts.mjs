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

// Canvas cannot read CSS custom properties; its type families mirror the tokens.
const tokens = readFileSync("packages/core/src/lib/styles/tokens.css", "utf8");
const canvasTypes = readFileSync(
	"packages/core/src/lib/ui/typography.ts",
	"utf8",
);
for (const [role, constant] of [
	["ui", "FONT_FAMILY_UI"],
	["prose", "FONT_FAMILY_PROSE"],
]) {
	const css = tokens
		.match(new RegExp(`--font-family-${role}:([^;]+);`))?.[1]
		?.replace(/\s+/g, " ")
		.trim();
	const ts = canvasTypes.match(
		new RegExp(`${constant}\\s*=\\s*'([^']+)'`),
	)?.[1];
	assert(css, `Missing CSS token --font-family-${role}`);
	assert.equal(ts, css, `${constant} must equal --font-family-${role}`);
}
console.log("Canvas type families match the CSS role tokens.");
