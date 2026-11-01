import { describe, expect, it } from "vitest";
import { canvasFont, FONT_FAMILY_UI } from "./typography";

// Equality with the CSS tokens is checked by scripts/check-contracts.mjs.
describe("canvas type roles", () => {
	it("builds ui-role canvas fonts", () => {
		expect(canvasFont(11)).toBe(`400 11px ${FONT_FAMILY_UI}`);
		expect(canvasFont(32, 700)).toBe(`700 32px ${FONT_FAMILY_UI}`);
	});
});
