import { describe, expect, it } from "vitest";
import { LandingSystem } from "./landing-system";
import { CHALLENGE_SEED, gameSettings, Simulation } from "./simulation";

describe("landing system", () => {
	it("generates bounded, separated orbits across seeds and all sun classes", () => {
		const classes = new Set<string>();
		for (let seed = 1; seed <= 100; seed++) {
			let state = seed * 98765;
			const scene = new LandingSystem(() => {
				state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
				return state / 4294967296;
			});
			classes.add(scene.star.type);
			expect(scene.planets).toHaveLength(3);
			for (const [index, planet] of scene.planets.entries()) {
				expect(planet.hasRing).toBe(false);
				expect(planet.orbitRadius - planet.radius).toBeGreaterThan(
					scene.star.radius,
				);
				expect((Math.PI * 2) / planet.orbitSpeed).toBeGreaterThanOrEqual(20);
				expect((Math.PI * 2) / planet.orbitSpeed).toBeLessThanOrEqual(45);
				if (index)
					expect(
						planet.orbitRadius - scene.planets[index - 1].orbitRadius,
					).toBeGreaterThan(planet.radius + scene.planets[index - 1].radius);
			}
		}
		expect(classes.size).toBe(7);
	});

	it("opens with a substantial outer planet left of the centred launcher", () => {
		for (const random of [0, 0.5, 0.999]) {
			const scene = new LandingSystem(() => random);
			for (const [width, height] of [
				[1280, 644],
				[844, 337],
			]) {
				const cardRight = width / 2 + 240;
				const frame = scene.layout(width, height, cardRight);
				const outer = frame.planets[2];
				expect(outer.x - outer.radius).toBeGreaterThan(0);
				expect(outer.x + outer.radius).toBeLessThan(width - cardRight);
				expect(outer.y - outer.radius).toBeGreaterThan(0);
				expect(outer.y + outer.radius).toBeLessThan(height);
				expect(frame.planets.every((body) => body.radius >= 19.5)).toBe(true);
				expect(frame.star.x - frame.star.radius).toBeGreaterThan(cardRight);
			}
		}
	});

	it("moves visibly and independently of frame rate or survival state", () => {
		const a = new LandingSystem(() => 0.5);
		const b = new LandingSystem(() => 0.5);
		const initial = a.planets[0].pos.clone();
		for (let frame = 0; frame < 120; frame++) a.step(1 / 60);
		for (let frame = 0; frame < 60; frame++) b.step(1 / 30);
		expect(a.planets[0].pos.x).toBeCloseTo(b.planets[0].pos.x, 8);
		expect(a.planets[0].pos.y).toBeCloseTo(b.planets[0].pos.y, 8);
		expect(
			Math.hypot(
				a.planets[0].pos.x - initial.x,
				a.planets[0].pos.y - initial.y,
			),
		).toBeGreaterThan(50);
		const run = new Simulation(gameSettings());
		expect(run.star.type).toBe("G");
		expect(run.settings.seed).toBe(CHALLENGE_SEED);
		expect(run.ticks).toBe(0);
	});
});
