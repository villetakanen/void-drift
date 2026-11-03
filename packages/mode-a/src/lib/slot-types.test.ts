import { describe, expect, it } from "vitest";
import { buildMounts, drawBuild } from "./build-renderer";
import {
	defaultLoadout,
	LoadoutSchema,
	SLOT_TYPES,
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
		for (const chassis of ["scout", "fighter", "corvette"] as const) {
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

it("draws fittings in flight but labels and selection only in the builder", () => {
	const build = defaultLoadout("fighter");
	build.stabilizers = false;
	const palette = { dark: "#050510", lime: "#eeff41", ivory: "#fffff0" };
	function render(builder = false, selected = "") {
		const paint: { method: string; args: unknown[] }[] = [];
		const labels: string[] = [];
		const ctx = new Proxy({} as CanvasRenderingContext2D, {
			get:
				(_target, key) =>
				(...args: unknown[]) => {
					if (key === "fillText") labels.push(String(args[0]));
					if (
						["fill", "stroke", "fillRect", "strokeRect", "fillText"].includes(
							String(key),
						)
					)
						paint.push({ method: String(key), args });
				},
			set: () => true,
		});
		drawBuild(ctx, build, 0, 0, 0, 1, selected, builder ? palette : undefined);
		return { paint, labels };
	}
	const emptyFlight = render();
	build.hull[0] = "rail";
	const equippedFlight = render();
	expect(equippedFlight.paint).not.toEqual(emptyFlight.paint);
	expect(equippedFlight.labels).toEqual([]);
	expect(render(false, "left")).toEqual(equippedFlight);
	const builder = render(true);
	expect(builder.labels).toEqual(
		expect.arrayContaining(
			buildMounts(build).flatMap((mount, index) => [
				SLOT_TYPES[mount.type].label,
				String(index + 1).padStart(2, "0"),
			]),
		),
	);
	expect(render(true, "left").paint).not.toEqual(builder.paint);
});
