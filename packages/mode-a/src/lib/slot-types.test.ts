import { describe, expect, it } from "vitest";
import { buildMounts } from "./build-renderer";
import {
	defaultLoadout,
	LoadoutSchema,
	SlotTypeSchema,
	slotAccepts,
} from "./schemas/loadout";

describe("slot compatibility", () => {
	it("distinguishes all four types without changing legacy part IDs", () => {
		const categories = ["E", "G", "U"] as const;
		for (const [type, expected] of [
			["engine", [true, false, false]],
			["weapon", [false, true, false]],
			["equipment", [false, true, true]],
			["universal", [true, true, true]],
		] as const) {
			expect(
				categories.map((c) => slotAccepts(SlotTypeSchema.parse(type), c)),
			).toEqual(expected);
		}
	});
	it("preserves saves, hull restrictions and universal engines on every chassis", () => {
		for (const chassis of ["scout", "balanced", "tank"] as const) {
			const build = defaultLoadout(chassis);
			build.hull[0] = "coil";
			build.aft[0] = "ion";
			expect(LoadoutSchema.safeParse(build).success).toBe(true);
			build.hull[0] = "ion";
			expect(LoadoutSchema.safeParse(build).success).toBe(false);
			const mounts = buildMounts(defaultLoadout(chassis));
			expect(mounts.find((m) => m.key === "right")?.linkedTo).toBe("left");
			expect(
				mounts
					.filter((m) => m.group === "hull")
					.every((m) => m.type === "equipment"),
			).toBe(true);
			expect(
				mounts
					.filter((m) => m.group === "aft")
					.every((m) => m.type === "universal"),
			).toBe(true);
		}
	});
});

it("keeps builder overlays out of flight while retaining equipped casings", async () => {
	const { drawBuild } = await import("./build-renderer");
	const operations: string[] = [];
	const ctx = new Proxy({} as CanvasRenderingContext2D, {
		get:
			(_target, key) =>
			(..._args: unknown[]) => {
				operations.push(String(key));
			},
		set: () => true,
	});
	const build = defaultLoadout("balanced");
	drawBuild(ctx, build, 0, 0, 0);
	expect(operations.filter((op) => op === "fillRect")).toHaveLength(0);
	expect(operations.filter((op) => op === "fill").length).toBeGreaterThan(12);
	expect(operations).not.toContain("fillText");
	operations.length = 0;
	drawBuild(ctx, build, 0, 0, 0, 1, "left", {
		dark: "#050510",
		lime: "#eeff41",
		ivory: "#fffff0",
	});
	expect(operations.filter((op) => op === "fillRect")).toHaveLength(12);
	expect(operations.filter((op) => op === "fillText")).toHaveLength(16);
});
