import { expect, it } from "vitest";
import { engineEffectiveness, updateShip, Vec2 } from "./Physics";

it("tapers only the component along the engine push", () => {
	const v = new Vec2(1200, 0);
	expect(engineEffectiveness(v, new Vec2(1, 0), 600)).toBeCloseTo(0.2);
	expect(engineEffectiveness(v, new Vec2(-1, 0), 600)).toBe(1);
	expect(engineEffectiveness(v, new Vec2(0, 1), 600)).toBe(1);
	expect(engineEffectiveness(new Vec2(600, 0), new Vec2(1, 0), 600)).toBe(0.5);
});
it("each engine supplies half the combined thrust and turns the ship", () => {
	const run = (rightThruster: boolean) => {
		const ship = {
			pos: new Vec2(960, 540),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		};
		updateShip(
			ship,
			{ leftThruster: true, rightThruster, fire: false },
			1 / 240,
			1920,
			1080,
			undefined,
			[],
			undefined,
			undefined,
			undefined,
			{ drag: 0, speedLimit: null },
			"inverse-square",
			600,
		);
		return ship;
	};
	const single = run(false),
		dual = run(true);
	expect(single.vel.mag()).toBeCloseTo(dual.vel.mag() / 2);
	expect(single.rotation).toBeGreaterThan(0);
	expect(dual.rotation).toBe(0);
});
