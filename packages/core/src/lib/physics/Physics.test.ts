import { beforeEach, describe, expect, it } from "vitest";
import { SURVIVAL_CONFIG } from "../config";
import type { InputState } from "../entities/Input";
import type { GameObject, Planet, Star } from "./Physics";
import {
	getPlanetInfluenceRadius,
	updatePower,
	updateShip,
	Vec2,
} from "./Physics";

describe("Vec2", () => {
	it("should initialize correctly", () => {
		const v = new Vec2(10, 20);
		expect(v.x).toBe(10);
		expect(v.y).toBe(20);
	});

	it("should add vectors correctly", () => {
		const v1 = new Vec2(10, 20);
		const v2 = new Vec2(5, -5);
		v1.add(v2);
		expect(v1.x).toBe(15);
		expect(v1.y).toBe(15);
	});

	it("should calculate magnitude correctly", () => {
		const v = new Vec2(3, 4);
		expect(v.mag()).toBe(5);
	});
});

describe("updatePower", () => {
	let resources: { hull: number; power: number };
	const mockSun: Star = {
		pos: new Vec2(0, 0),
		influenceRadius: 360,
		mass: 600,
		color: "#ffffff",
		glowColor: "#ffffff",
		type: "G",
		pulseSpeed: 1,
		radius: 40,
		powerMultiplier: 1,
		burnMultiplier: 1,
	};

	beforeEach(() => {
		resources = { hull: 100, power: 100 };
	});

	it("should consume power over time", () => {
		const dt = 1; // 1 second
		// Far from sun, no thrust
		updatePower(resources, 1000, mockSun, dt);
		expect(resources.power).toBe(100 - SURVIVAL_CONFIG.POWER_CONSUMPTION_RATE);
	});

	it("should regenerate power near sun", () => {
		resources.power = 50;
		const dt = 1;
		// Inside Zone 1
		updatePower(
			resources,
			SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS - 10,
			mockSun,
			dt,
		);
		const expected =
			50 -
			SURVIVAL_CONFIG.POWER_CONSUMPTION_RATE +
			SURVIVAL_CONFIG.POWER_REGEN_ZONE_1;
		expect(resources.power).toBe(expected);
	});

	it("should clamp power between 0 and 100", () => {
		resources.power = 99;
		updatePower(
			resources,
			SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS - 10,
			mockSun,
			10,
		);
		expect(resources.power).toBe(100);

		resources.power = 0.5;
		updatePower(resources, 1000, mockSun, 10);
		expect(resources.power).toBe(0);
	});
});

describe("Planet gravity (mass-based influence)", () => {
	const noInput: InputState = {
		leftThruster: false,
		rightThruster: false,
		fire: false,
	};
	const arenaSize = 2400;

	function makeShip(x: number, y: number): GameObject {
		return {
			pos: new Vec2(x, y),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		};
	}

	function makePlanet(overrides: Partial<Planet> = {}): Planet {
		return {
			pos: new Vec2(600, 600),
			orbitCenter: new Vec2(1200, 1200),
			orbitRadius: 700,
			orbitSpeed: 0,
			orbitAngle: 0,
			initialAngle: 0,
			radius: 30,
			mass: 400,
			color: "#8B7355",
			type: "rock",
			hasRing: false,
			...overrides,
		};
	}

	it.each([
		{ mass: 400, radius: 30, expected: 200 },
		{ mass: 10000, radius: 50, expected: 400 },
		{ mass: 1, radius: 80, expected: 160 },
	])("derives reach $expected from mass $mass and radius $radius", (planet) => {
		expect(getPlanetInfluenceRadius(planet)).toBe(planet.expected);
	});

	it("uses explicit well reach independently of physical size and mass", () => {
		for (const radius of [1, 100])
			for (const mass of [1, 10000])
				expect(
					getPlanetInfluenceRadius({
						radius,
						mass,
						well: { reach: 315, strength: 600 },
					}),
				).toBe(315);
	});

	it("should pull ship toward planet within influence radius", () => {
		// Place planet at a fixed position, ship nearby
		const planet = makePlanet({
			pos: new Vec2(600, 600),
			orbitCenter: new Vec2(600, 600),
			orbitRadius: 0,
			orbitSpeed: 0,
			mass: 400,
			radius: 30,
		});

		// Ship 100px to the left of planet (within influence radius of 200)
		const ship = makeShip(500, 600);

		updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [
			planet,
		]);

		// Ship should have gained positive x velocity (pulled toward planet at x=600)
		expect(ship.vel.x).toBeGreaterThan(0);
		// Y velocity should be ~0 (ship and planet on same y-axis)
		expect(Math.abs(ship.vel.y)).toBeLessThan(0.01);
	});

	it("does not pull outside an explicit well's reach", () => {
		const planet = makePlanet({
			orbitCenter: new Vec2(600, 600),
			orbitRadius: 0,
			well: { reach: 150, strength: 600 },
		});
		const outside = makeShip(600 - 151, 600);
		const inside = makeShip(600 - 149, 600);
		for (const ship of [outside, inside])
			updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [
				planet,
			]);
		expect(outside.vel).toEqual(new Vec2(0, 0));
		expect(inside.vel.x).toBeGreaterThan(0);
	});

	it("pulls with the well's own curve", () => {
		const [inverse, linear] = (["inverse-square", "linear"] as const).map(
			(curve) => {
				const ship = makeShip(600 - 50, 600);
				updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [
					makePlanet({
						orbitCenter: new Vec2(600, 600),
						orbitRadius: 0,
						well: { reach: 200, strength: 600, curve },
					}),
				]);
				return ship.vel.x;
			},
		);
		expect(inverse).toBeGreaterThan(linear);
	});

	it("should NOT pull ship outside influence radius", () => {
		const planet = makePlanet({
			pos: new Vec2(600, 600),
			orbitCenter: new Vec2(600, 600),
			orbitRadius: 0,
			orbitSpeed: 0,
			mass: 400,
			radius: 30,
		});

		// Influence = 200px, place ship 300px away (outside)
		const ship = makeShip(300, 600);

		updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [
			planet,
		]);

		// No gravitational pull — velocity stays ~0 (only drag applied to 0 = 0)
		expect(Math.abs(ship.vel.x)).toBeLessThan(0.001);
		expect(Math.abs(ship.vel.y)).toBeLessThan(0.001);
	});
});
