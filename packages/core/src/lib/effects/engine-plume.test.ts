import { expect, it } from "vitest";
import { updateShip, Vec2 } from "../physics/Physics";
import { ENGINE_CUTOFF, EnginePlume } from "./engine-plume";

function ship(speed = 0) {
	return {
		pos: new Vec2(960, 540),
		vel: new Vec2(speed, 0),
		acc: new Vec2(0, 0),
		rotation: 0,
		radius: 16,
	};
}
function push(speed: number, rotation = 0, right = true, dt = 1 / 60) {
	const body = ship(speed);
	body.rotation = rotation;
	const output = updateShip(
		body,
		{ leftThruster: true, rightThruster: right, fire: false },
		dt,
		1920,
		1080,
		undefined,
		[],
		undefined,
		undefined,
		{ thrustMultiplier: 1, turnMultiplier: 0, hullMultiplier: 1 },
		{ drag: 0, speedLimit: null },
		"inverse-square",
		600,
		ENGINE_CUTOFF,
	);
	return { body, output };
}
it("stops forward engine output at the cutoff without clamping existing speed", () => {
	for (const speed of [750, 1200]) {
		const result = push(speed);
		expect(result.output).toBe(0);
		expect(result.body.vel.x).toBe(speed);
	}
	expect(push(749, 0, true, 10).body.vel.x).toBeLessThanOrEqual(750);
});
it("retains braking, sideways thrust, and half contribution per engine", () => {
	expect(push(1200, Math.PI).body.vel.x).toBeLessThan(1200);
	expect(push(1200, Math.PI / 2).body.vel.y).toBeGreaterThan(0);
	expect(push(0, 0, false).body.vel.x).toBeCloseTo(push(0).body.vel.x / 2);
});
it("release preserves live surfaces until expiry and continuous emission stays bounded", () => {
	const plume = new EnginePlume(),
		body = ship();
	plume.step(1 / 60, body, 1, 1);
	plume.step(1 / 60, body, 0, 0);
	expect(plume.count).toBe(2);
	plume.step(0.65, body, 0, 0);
	expect(plume.count).toBe(0);
	for (let i = 0; i < 1000; i++) plume.step(1 / 60, body, 1, 1);
	expect(plume.count).toBeLessThanOrEqual(80);
});

it("mounted emitters retain the shared fading lifecycle with bounded five-engine emission", () => {
	const plume = new EnginePlume(),
		body = ship();
	const emitters = Array.from({ length: 5 }, (_, i) => ({
		x: -10,
		y: i * 5,
		angle: i * 0.1,
		output: 1,
	}));
	for (let i = 0; i < 1000; i++) plume.stepMounted(1 / 60, body, emitters);
	expect(plume.count).toBeGreaterThan(80);
	expect(plume.count).toBeLessThanOrEqual(200);
	for (const emitter of emitters) emitter.output = 0;
	const count = plume.count;
	plume.stepMounted(0, body, emitters);
	expect(plume.count).toBe(count);
	plume.stepMounted(0.65, body, emitters);
	expect(plume.count).toBe(0);
});
