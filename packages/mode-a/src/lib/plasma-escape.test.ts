import { Vec2 } from "@void-drift/core";
import { expect, it } from "vitest";
import {
	sequence,
	TOTAL_TICKS,
} from "../../../../apps/web/src/components/studies/movement-bench";
import {
	ESCAPE_HZ,
	START_SPEED,
	simulateEscape,
	simulateEscapeSequence,
} from "../../../../apps/web/src/components/studies/plasma-escape";
import { applyBuildEngines } from "./build-flight";
import { ionCeiling } from "./schemas/ion";
import { defaultLoadout } from "./schemas/loadout";

it("shared-rule Light reference matches production assembled propulsion", () => {
	const run = simulateEscape()[0];
	const build = defaultLoadout("fighter");
	build.aft[0] = "ion";
	build.stabilizers = true;
	const ship = {
		pos: new Vec2(0, 0),
		vel: new Vec2(START_SPEED, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
	const timers = {};
	for (let tick = 1; tick < run.samples.length; tick++) {
		applyBuildEngines(
			ship,
			build,
			{ leftThruster: true, rightThruster: true, fire: false },
			1 / ESCAPE_HZ,
			true,
			timers,
		);
		ship.pos.x += ship.vel.x / ESCAPE_HZ;
		expect(run.samples[tick].speed).toBeCloseTo(ship.vel.x, 9);
		expect(run.samples[tick].distance).toBeCloseTo(ship.pos.x, 9);
	}
});
it("isolates adjustable force, preserves delay and bounds diminishing speed returns", () => {
	const low = simulateEscape({ strength: 1 }),
		high = simulateEscape({ strength: 10 });
	for (const i of [0, 1, 2]) expect(high[i]).toEqual(low[i]);
	expect(high[3].mass).toBe(low[3].mass);
	expect(high[3].samples[24].speed).toBe(START_SPEED);
	expect(high[3].samples[25].speed).toBeGreaterThan(START_SPEED);
	expect(high[3].samples[6 * ESCAPE_HZ].distance).toBeGreaterThan(
		low[3].samples[6 * ESCAPE_HZ].distance,
	);
	expect(
		high[3].samples.every(
			(p) => p.speed < ionCeiling(Infinity) && p.ceiling < ionCeiling(Infinity),
		),
	).toBe(true);
	expect(() => simulateEscape({ strength: 10.1 })).toThrow();
	expect(() => simulateEscape({ strength: 0 })).toThrow();
});

it("sequence paths match production Light flight including turns and stabilizers", () => {
	const run = simulateEscapeSequence()[0];
	const build = defaultLoadout("fighter");
	build.aft[0] = "ion";
	build.stabilizers = true;
	const ship = {
		pos: new Vec2(0, 0),
		vel: new Vec2(0, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
	const motion = { velocity: 0 },
		timers = {};
	for (let tick = 0; tick < TOTAL_TICKS * 4; tick++) {
		const input = sequence(Math.floor(tick / 4));
		applyBuildEngines(
			ship,
			build,
			{ leftThruster: input.left, rightThruster: input.right, fire: false },
			1 / ESCAPE_HZ,
			true,
			timers,
			1,
			motion,
		);
		ship.pos.x += ship.vel.x / ESCAPE_HZ;
		ship.pos.y += ship.vel.y / ESCAPE_HZ;
		expect(run.samples[tick + 1].x).toBeCloseTo(ship.pos.x, 8);
		expect(run.samples[tick + 1].y).toBeCloseTo(ship.pos.y, 8);
		expect(run.samples[tick + 1].spin).toBeCloseTo(
			(motion.velocity * 180) / Math.PI,
			8,
		);
	}
	expect(Math.abs(run.samples[14 * ESCAPE_HZ].y)).toBeGreaterThan(1);
	const low = simulateEscapeSequence({ strength: 1 })[3],
		high = simulateEscapeSequence({ strength: 10 })[3];
	expect(high.samples[24]).toEqual(low.samples[24]);
	expect(high.samples[25].speed).toBeGreaterThan(low.samples[25].speed);
	expect(
		high.samples.every(
			(p) => Number.isFinite(p.x) && p.speed <= ionCeiling(Infinity),
		),
	).toBe(true);
});
