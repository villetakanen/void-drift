import { describe, expect, it } from "vitest";
import { wellAcceleration } from "./Physics";

describe("bounded inverse-square well", () => {
	it("vanishes continuously at the border and remains zero beyond", () => {
		expect(wellAcceleration(315, 315, 600, "inverse-square")).toBe(0);
		expect(wellAcceleration(400, 315, 600, "inverse-square")).toBe(0);
		expect(
			wellAcceleration(315 - 0.000001, 315, 600, "inverse-square"),
		).toBeLessThan(0.000001);
	});
	it("matches the reference pull and concentrates it toward the center", () => {
		expect(wellAcceleration(157.5, 315, 600, "inverse-square")).toBe(300);
		expect(wellAcceleration(78.75, 315, 600, "inverse-square")).toBeGreaterThan(
			wellAcceleration(78.75, 315, 600, "linear"),
		);
		expect(wellAcceleration(236.25, 315, 600, "inverse-square")).toBeLessThan(
			wellAcceleration(236.25, 315, 600, "linear"),
		);
	});
});
