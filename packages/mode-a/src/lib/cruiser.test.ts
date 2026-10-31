import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { applyBuildEngines } from "./build-flight";
import {
	BUILD_FLIGHT_SCALE,
	buildCollisionRadius,
	buildMounts,
	buildPlumeEmitters,
} from "./build-renderer";
import { buildStats, defaultLoadout } from "./schemas/loadout";

describe("approved cruiser", () => {
	it("places bow fitting ahead of cockpit and preserves indexed aft triangle", () => {
		const mounts = buildMounts(defaultLoadout("tank"));
		expect(mounts).toHaveLength(8);
		expect(mounts.find((m) => m.key === "hull-0")?.x).toBe(45.5);
		expect(
			mounts.filter((m) => m.group === "aft").map((m) => [m.x, m.y]),
		).toEqual([
			[-34, -11],
			[-27.5, 0],
			[-34, 11],
		]);
	});
	it("encloses mount corners and places exhaust behind each nozzle", () => {
		const build = defaultLoadout("tank");
		build.aft = ["ion", "ion", "ion"];
		const radius = buildCollisionRadius(build);
		for (const m of buildMounts(build)) {
			for (const x of [-m.width / 2, m.width / 2])
				for (const y of [-m.height / 2, m.height / 2]) {
					expect(
						Math.hypot(
							m.x + x * Math.cos(m.angle) - y * Math.sin(m.angle),
							m.y + x * Math.sin(m.angle) + y * Math.cos(m.angle),
						) * BUILD_FLIGHT_SCALE,
					).toBeLessThanOrEqual(radius);
				}
		}
		const emitters = buildPlumeEmitters(build);
		expect(emitters).toHaveLength(5);
		expect(emitters[0].y).toBeLessThan(-13 * BUILD_FLIGHT_SCALE);
		expect(emitters[1].y).toBeGreaterThan(13 * BUILD_FLIGHT_SCALE);
	});
	it("turns in opposing directions and cancels paired torque", () => {
		const build = defaultLoadout("tank");
		expect(buildStats(build).turnRate).toBeGreaterThan(0);
		const body = () => ({
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		});
		const left = body(),
			right = body(),
			both = body();
		applyBuildEngines(
			left,
			build,
			{ leftThruster: true, rightThruster: false, fire: false },
			1 / 60,
			true,
		);
		applyBuildEngines(
			right,
			build,
			{ leftThruster: false, rightThruster: true, fire: false },
			1 / 60,
			true,
		);
		applyBuildEngines(
			both,
			build,
			{ leftThruster: true, rightThruster: true, fire: false },
			1 / 60,
			true,
		);
		expect(left.rotation).toBeGreaterThan(0);
		expect(right.rotation).toBeCloseTo(-left.rotation);
		expect(both.rotation).toBe(0);
		expect(both.vel.y).toBeCloseTo(0);
	});
});
