import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines, buildDrain } from "./build-flight";
import {
	BUILD_FLIGHT_SCALE,
	barrelLength,
	buildCollisionRadius,
	buildMounts,
	buildPlumeEmitters,
	engineOffset,
	nozzleOffset,
} from "./build-renderer";
import { buildStats, defaultLoadout, LoadoutSchema } from "./schemas/loadout";
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
	it("preserves all six accepted planes, cockpit and compact screenshot layout", () => {
		expect(SCOUT.facets.map((facet) => facet.points)).toEqual([
			[
				[23, 0],
				[-24, 21],
				[-14, 11],
				[-4, 8],
				[-9, 5],
				[-20, 5],
				[-29, 0],
				[-20, -5],
				[-9, -5],
				[-4, -8],
				[-14, -11],
				[-24, -21],
			],
			[
				[23, 0],
				[-24, -21],
				[-14, -11],
				[-4, -8],
				[4, 0],
			],
			[
				[23, 0],
				[-24, 21],
				[-14, 11],
				[-4, 8],
				[4, 0],
			],
			[
				[23, 0],
				[5, -4],
				[-20, -5],
				[-29, 0],
			],
			[
				[23, 0],
				[5, 4],
				[-20, 5],
				[-29, 0],
			],
			[
				[-24, -21],
				[9, -6],
				[-14, -11],
			],
		]);
		expect(SCOUT.facets.map((facet) => facet.color)).toEqual([
			"#264d6b",
			"#83c7d0",
			"#365d79",
			"#c8f4f0",
			"#6193a9",
			"#437e99",
		]);
		expect(SCOUT.cockpit).toEqual({
			x: 21,
			y: 0,
			radius: 6,
			collarRadius: 6.8,
		});
		const mounts = buildMounts(defaultLoadout("scout"));
		expect(mounts.map((m) => [m.key, m.x, m.y, m.width, m.height])).toEqual([
			["left", 10.5, -6, 10, 8],
			["right", 10.5, 6, 10, 8],
			["hull-0", 1, 0, 10, 8],
			["aft-0", -14.5, 0, 10, 8],
		]);
		expect(mounts[0].angle).toBeCloseTo((49 * Math.PI) / 180);
		expect(mounts[1].angle).toBeCloseTo(-mounts[0].angle);
		expect(buildStats(defaultLoadout("scout")).mass).toBe(92);
	});

	it("keeps compact weapon fittings clear of the cockpit and each other", () => {
		const build = defaultLoadout("scout");
		build.hull[0] = "rail";
		build.aft[0] = "rail";
		const [hull, aft] = buildMounts(build).filter((m) => m.group !== "side");
		expect(barrelLength(hull)).toBe(6);
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

	it("aligns three emitters with actual side/aft nozzles", () => {
		const build = defaultLoadout("scout");
		build.aft[0] = "ion";
		const engines = buildMounts(build).filter((m) => m.group !== "hull");
		const emitters = buildPlumeEmitters(build);
		expect(emitters).toHaveLength(3);
		for (const [i, e] of emitters.entries()) {
			const m = engines[i];
			expect(e.x).toBeCloseTo(
				(m.x + (engineOffset(build, m) - nozzleOffset(m)) * Math.cos(m.angle)) *
					BUILD_FLIGHT_SCALE,
			);
			expect(e.y).toBeCloseTo(
				(m.y + (engineOffset(build, m) - nozzleOffset(m)) * Math.sin(m.angle)) *
					BUILD_FLIGHT_SCALE,
			);
			expect(e.angle).toBe(m.angle);
		}
		expect(emitters[0].y).toBeLessThan(-6 * BUILD_FLIGHT_SCALE);
		expect(emitters[1].y).toBeGreaterThan(6 * BUILD_FLIGHT_SCALE);
	});

	it("uses signed forward engine leverage, cancels paired torque and activates aft only with both", () => {
		const build = defaultLoadout("scout");
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
		expect(left.rotation * 60).toBeCloseTo(buildStats(build).turnRate);
		expect(left.vel.y).toBeCloseTo(-right.vel.y);
		expect(paired.rotation).toBe(0);
		expect(paired.vel.y).toBe(0);
		const stats = buildStats(build);
		const sideAcceleration =
			(2 * 48000 * Math.cos((49 * Math.PI) / 180)) / stats.mass;
		// The aft impulse follows the side impulse, so its real powered-speed
		// taper sees the velocity already gained within this fixed step.
		const aftAcceleration =
			(12000 / stats.mass) * (1 - sideAcceleration / 60 / 500);
		expect(stats.acceleration).toBeCloseTo(
			sideAcceleration + 12000 / stats.mass,
		);
		expect(paired.vel.x * 60).toBeCloseTo(sideAcceleration + aftAcceleration);
		expect(leftOutput.aft).toEqual([0]);
		expect(output.aft[0]).toBeGreaterThan(0);
		expect(buildDrain(build, both)).toBe(11);
	});

	it("keeps mixed-engine overspeed bounded and replays real energy/plumes deterministically", () => {
		const build = defaultLoadout("scout");
		build.aft[0] = "ion";
		const ship = body();
		for (let i = 0; i < 10000; i++) {
			ship.rotation = Math.atan2(ship.vel.y, ship.vel.x) + Math.PI / 3;
			applyBuildEngines(ship, build, both, 1 / 60, true);
		}
		expect(ship.vel.mag()).toBeLessThanOrEqual(550.000001);
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
		expect(sims[0].plume.count).toBeGreaterThan(0);
		for (const sim of sims) {
			sim.state.resources.power = 0;
			sim.step(both);
			expect(sim.engineOutput.left).toBe(0);
			expect(sim.engineOutput.aft[0]).toBe(0);
			expect(sim.state.status).toBe("PLAYING");
		}
	});
});
