import { describe, expect, it } from "vitest";
import {
	BUILD_FLIGHT_SCALE,
	buildCollisionRadius,
	buildMounts,
} from "./build-renderer";
import { defaultLoadout } from "./schemas/loadout";

describe("approved cruiser", () => {
	it("places the bow fitting forward and preserves the indexed aft triangle", () => {
		const mounts = buildMounts(defaultLoadout("corvette"));
		const bow = mounts.find((m) => m.key === "hull-0");
		expect(bow?.x).toBeGreaterThan(
			Math.max(...mounts.filter((m) => m.key !== "hull-0").map((m) => m.x)),
		);
		const [left, center, right] = mounts.filter((m) => m.group === "aft");
		expect(left.y).toBeLessThan(0);
		expect(right).toMatchObject({ x: left.x, y: -left.y });
		expect(center.y).toBe(0);
		expect(center.x).toBeGreaterThan(left.x);
	});
	it("encloses every mounted fitting corner", () => {
		const build = defaultLoadout("corvette");
		// Isolate main engines from optional stabilizer assist.
		build.stabilizers = false;
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
	});
});
