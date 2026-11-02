import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// Scope and size limits on context documents warn; they never fail the gate.
const warnings = [];
const warn = (message) => {
	warnings.push(message);
	console.warn(`WARNING: ${message}`);
};

const instructions = readFileSync("AGENTS.md", "utf8");
const lineCount = instructions.trimEnd().split("\n").length;
if (lineCount >= 80) {
	warn(`AGENTS.md has ${lineCount} lines; keep it below 80.`);
}
for (const match of instructions.matchAll(/`((?:docs|\.agents)\/[^`]+)`/g)) {
	assert(existsSync(match[1]), `Missing agent context: ${match[1]}`);
}
console.log(
	`Agent entry point: ${lineCount} lines; all context links resolve.`,
);

// docs/design.md holds experience principles, art direction and brand only.
const design = readFileSync("docs/design.md", "utf8");
const designLines = design.trimEnd().split("\n");
if (designLines.length > 200) {
	warn(
		`docs/design.md has ${designLines.length} lines; above 200, consider splitting brand out.`,
	);
}
const designChecks = [
	[
		/^#{1,6} .*(\b\d+\.\d+(\.\d+)?\b|\b\d{4}-\d{2}-\d{2}\b)/,
		"version or date in a heading (records belong in feature specs)",
	],
	[/\/lab\/studies\//, "link to a study (studies are history)"],
	[
		/\b(?:packages|apps|scripts|tests)\/|\.(?:ts|js|mjs|svelte|astro|css)\b/,
		"source path (values and rules belong in specs or code)",
	],
];
designLines.forEach((line, index) => {
	for (const [pattern, reason] of designChecks) {
		if (pattern.test(line)) {
			warn(`docs/design.md:${index + 1}: ${reason}.`);
		}
	}
});
console.log(
	`docs/design.md: ${designLines.length} lines; ${warnings.length} context warning(s).`,
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

// Canvas colours mirror the CSS colour roles; aliases resolve through var().
const canvasColors = readFileSync("packages/core/src/lib/ui/colors.ts", "utf8");
const resolveToken = (name, seen = []) => {
	assert(!seen.includes(name), `Circular colour token ${name}`);
	const value = tokens
		.match(new RegExp(`${name}:([^;]+);`))?.[1]
		?.replace(/\s+/g, " ")
		.trim();
	assert(value, `Missing CSS token ${name}`);
	const alias = value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1];
	return alias ? resolveToken(alias, [...seen, name]) : value;
};
const pairs = [
	...canvasColors.matchAll(/^\t(\w+): "(--color-[a-z0-9-]+)",$/gm),
];
assert(pairs.length > 0, "colors.ts must name the token behind each colour");
for (const [, key, token] of pairs) {
	const ts = canvasColors.match(
		new RegExp(`^\\t${key}: "([^"]+)",$`, "m"),
	)?.[1];
	assert.equal(ts, resolveToken(token), `COLOR.${key} must equal ${token}`);
}
console.log(`Canvas colours match ${pairs.length} CSS colour roles.`);

// The browser chrome colour is a literal; it must stay the void page colour.
const layout = readFileSync("apps/web/src/layouts/Layout.astro", "utf8");
assert.equal(
	layout.match(/name="theme-color" content="([^"]+)"/)?.[1],
	"#050510",
	"theme-color must be #050510, the sRGB form of --color-void",
);
assert.equal(
	resolveToken("--color-void"),
	"lch(1.57% 4.76 285.25)",
	"--color-void changed: update theme-color in Layout.astro to match",
);
console.log("theme-color matches --color-void.");
