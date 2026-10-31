import { describe, expect, it } from "vitest";
import { CONFIG } from "../config";
import { type GameObject, updateShip, Vec2 } from "./Physics";

function ship(): GameObject {
	return {
		pos: new Vec2(600, 600),
		vel: new Vec2(1200, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
}
const input = { leftThruster: false, rightThruster: false, fire: false };
describe("study resistance override", () => {
	it("preserves coasting momentum above the production speed cap", () => {
		const body = ship();
		updateShip(
			body,
			input,
			1 / 60,
			1200,
			1200,
			undefined,
			[],
			undefined,
			undefined,
			undefined,
			{ drag: 0, speedLimit: null },
		);
		expect(body.vel.x).toBe(1200);
		expect(body.pos.x).toBe(620);
	});
	it("keeps the production cap and drag when the override is omitted", () => {
		const body = ship();
		updateShip(body, input, 1 / 60, 1200, 1200);
		expect(body.vel.x).toBeCloseTo(CONFIG.MAX_SPEED, 10);
		body.vel.set(500, 0);
		updateShip(body, input, 1 / 60, 1200, 1200);
		expect(body.vel.x).toBeCloseTo(500 * (1 - CONFIG.SHIP_DRAG / 60));
	});
});
