import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain } from "./build-flight";
import {
	BUILD_FLIGHT_SCALE,
	barrelLength,
	buildCollisionRadius,
	buildMounts,
	nozzleOffset,
} from "./build-renderer";
import { ionCeiling } from "./schemas/ion";
import {
	buildStats,
	defaultLoadout,
	LoadoutSchema,
	PARTS,
} from "./schemas/loadout";
import { SCOUT } from "./scout";
import { Simulation, stockSettings } from "./simulation";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const both = { ...idle, leftThruster: true, rightThruster: true };
const body = () => ({
	pos: new Vec2(0, 0),
	vel: new Vec2(0, 0),
	acc: new Vec2(0, 0),
	rotation: 0,
	radius: 16,
});

describe("accepted Scout Trident", () => {
	it("mirrors the forward side mounts around the hull and aft fittings", () => {
		const [left, right, hull, aft] = buildMounts(defaultLoadout("scout"));
		expect(left.x).toBeGreaterThan(hull.x);
		expect(hull.x).toBeGreaterThan(aft.x);
		expect(left.y).toBeLessThan(0);
		expect(right).toMatchObject({
			x: left.x,
			y: -left.y,
			angle: -left.angle,
			width: left.width,
			height: left.height,
		});
	});

	it("keeps compact weapon fittings clear of the cockpit and each other", () => {
		const build = defaultLoadout("scout");
		build.hull[0] = "rail";
		build.aft[0] = "rail";
		const [hull, aft] = buildMounts(build).filter((m) => m.group !== "side");
		expect(hull.x + barrelLength(hull)).toBeLessThan(
			SCOUT.cockpit.x - SCOUT.cockpit.radius,
		);
		expect(aft.x + barrelLength(aft)).toBeLessThan(hull.x - hull.width / 2);
	});

	it.each(["ion", "rail", "laser", "battery", "coil", "fusion"] as const)(
		"encloses hull, cockpit and all %s fitting/nozzle extents",
		(part) => {
			const build = defaultLoadout("scout");
			build.hull[0] = part === "ion" || part === "fusion" ? null : part;
			build.aft[0] = part;
			expect(LoadoutSchema.safeParse(build).success).toBe(true);
			const radius = buildCollisionRadius(build);
			const enclosed = (x: number, y: number) =>
				expect(Math.hypot(x, y) * BUILD_FLIGHT_SCALE).toBeLessThanOrEqual(
					radius + 1e-8,
				);
			for (const facet of SCOUT.facets)
				for (const [x, y] of facet.points) enclosed(x, y);
			enclosed(SCOUT.cockpit.x + SCOUT.cockpit.collarRadius, 0);
			for (const m of buildMounts(build)) {
				const extent =
					m.part === "rail" || m.part === "laser"
						? barrelLength(m)
						: m.width / 2;
				for (const x of [-nozzleOffset(m), extent])
					for (const y of [-4, 4])
						enclosed(
							m.x + x * Math.cos(m.angle) - y * Math.sin(m.angle),
							m.y + x * Math.sin(m.angle) + y * Math.cos(m.angle),
						);
			}
		},
	);

	it("uses signed forward engine leverage, cancels paired torque and activates aft only with both", () => {
		const build = defaultLoadout("scout");
		// Isolate main engines from optional stabilizer assist.
		build.stabilizers = false;
		build.aft[0] = "ion";
		const left = body(),
			right = body(),
			paired = body();
		const leftOutput = applyBuildEngines(
			left,
			build,
			{ ...idle, leftThruster: true },
			1 / 60,
			true,
		);
		applyBuildEngines(
			right,
			build,
			{ ...idle, rightThruster: true },
			1 / 60,
			true,
		);
		const output = applyBuildEngines(paired, build, both, 1 / 60, true);
		expect(left.rotation).toBeGreaterThan(0);
		expect(left.rotation).toBeCloseTo(-right.rotation);
		expect(left.rotation * 60 * 60).toBeCloseTo(buildStats(build).turnRate);
		expect(left.vel.y).toBeCloseTo(-right.vel.y);
		expect(paired.rotation).toBe(0);
		expect(paired.vel.y).toBe(0);
		const stats = buildStats(build);
		const expectedAcceleration =
			(2 * PARTS.ion.thrust * Math.cos(buildMounts(build)[0].angle) +
				PARTS.ion.thrust) /
			stats.mass;
		// All active ions combine before their one at-rest impulse.
		expect(stats.acceleration).toBeCloseTo(expectedAcceleration);
		expect(paired.vel.x * 60).toBeCloseTo(expectedAcceleration);
		expect(leftOutput.aft).toEqual([0]);
		expect(output.aft[0]).toBeGreaterThan(0);
		expect(buildDrain(build, both) - buildDrain(build, idle)).toBe(
			3 * PARTS.ion.draw,
		);
	});

	it("keeps mixed-engine overspeed bounded and replays real energy/plumes deterministically", () => {
		const build = defaultLoadout("scout");
		build.aft[0] = "ion";
		const ship = body();
		for (let i = 0; i < 10000; i++) {
			ship.rotation = Math.atan2(ship.vel.y, ship.vel.x) + Math.PI / 3;
			applyBuildEngines(ship, build, both, 1 / 60, true);
		}
		expect(ship.vel.mag()).toBeLessThanOrEqual(ionCeiling(Infinity) + 1e-6);
		const sims = [0, 1].map(
			() =>
				new Simulation({
					...stockSettings("scout"),
					loadout: build,
					testFlight: true,
				}),
		);
		for (const sim of sims) {
			sim.ship.pos.set(1800, 540);
			sim.start();
		}
		for (let i = 0; i < 90; i++) for (const sim of sims) sim.step(both);
		expect(sims[0].ship).toEqual(sims[1].ship);
		expect(sims[0].state).toEqual(sims[1].state);
		expect(sims[0].state.resources.power).toBeLessThan(100);
		expect(sims[0].plume.activeCount).toBeGreaterThan(0);
		for (const sim of sims) {
			sim.state.resources.power = 0;
			sim.step(both);
			expect(sim.engineOutput.left).toBe(0);
			expect(sim.engineOutput.aft[0]).toBe(0);
			expect(sim.state.status).toBe("PLAYING");
		}
	});
});
