import { describe, expect, it } from "vitest";
import { buildMounts } from "./build-renderer";
import {
	geometry,
	MountPlanSchema,
	moveMount,
	newMountPlan,
	previewMounts,
	staleMounts,
} from "./mount-planner";

describe("mount planner", () => {
	for (const chassis of ["wasp", "scout", "fighter", "corvette"] as const)
		it(`round-trips production ${chassis}`, () => {
			const plan = newMountPlan(chassis);
			expect(plan.mounts).toEqual(
				buildMounts(plan.previewLoadout).map(geometry),
			);
			expect(MountPlanSchema.parse(JSON.parse(JSON.stringify(plan)))).toEqual(
				plan,
			);
			expect(staleMounts(plan)).toEqual([]);
		});
	it("mirrors edits from either end and preserves originals", () => {
		const plan = newMountPlan("fighter");
		const next = moveMount(plan, "right", {
			x: -12.125,
			y: 15.75,
			angle: -0.5,
		});
		expect(next.mounts.find((m) => m.key === "left")).toMatchObject({
			x: -12.125,
			y: -15.75,
			angle: 0.5,
		});
		expect(next.baseline).toEqual(plan.baseline);
		expect(previewMounts(next).find((m) => m.key === "right")).toMatchObject({
			x: -12.125,
			y: 15.75,
			angle: -0.5,
		});
	});
	it("rejects duplicate keys, lost production links and inconsistent pairs", () => {
		const plan = newMountPlan("fighter");
		expect(
			MountPlanSchema.safeParse({
				...plan,
				mounts: [plan.mounts[0], ...plan.mounts.slice(0, -1)],
			}).success,
		).toBe(false);
		expect(
			MountPlanSchema.safeParse({ ...plan, mirrorPairs: [] }).success,
		).toBe(false);
		plan.mounts[0].x += 1;
		expect(MountPlanSchema.safeParse(plan).success).toBe(false);
	});
	it("detects stale baseline and validates planner links", () => {
		const plan = newMountPlan("wasp");
		plan.mirrorPairs.push({ a: "hull-0", b: "hull-1", origin: "planner" });
		const next = moveMount(plan, "hull-0", { x: 3, y: -12, angle: 0.2 });
		expect(next.mounts[1]).toMatchObject({ x: 3, y: 12, angle: -0.2 });
		next.baseline[0].x += 1;
		expect(staleMounts(next)).toEqual(["hull-0"]);
	});
});
