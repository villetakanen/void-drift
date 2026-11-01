import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canvasFont, FONT_FAMILY_PROSE, FONT_FAMILY_UI } from "./typography";

const tokens = readFileSync(
	new URL("../styles/tokens.css", import.meta.url),
	"utf8",
);

function token(name: string): string {
	const match = tokens.match(new RegExp(`--${name}:([^;]+);`));
	if (!match?.[1]) throw new Error(`Missing token --${name}`);
	return match[1].replace(/\s+/g, " ").trim();
}

describe("canvas type roles", () => {
	it("match the CSS role tokens", () => {
		expect(FONT_FAMILY_UI).toBe(token("font-family-ui"));
		expect(FONT_FAMILY_PROSE).toBe(token("font-family-prose"));
	});

	it("builds ui-role canvas fonts", () => {
		expect(canvasFont(11)).toBe(`400 11px ${FONT_FAMILY_UI}`);
		expect(canvasFont(32, 700)).toBe(`700 32px ${FONT_FAMILY_UI}`);
	});
});
