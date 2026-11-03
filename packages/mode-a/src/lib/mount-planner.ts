import { z } from "zod";
import { type BuildMount, buildMounts } from "./build-renderer";
import {
	defaultLoadout,
	type Loadout,
	LoadoutSchema,
	SlotTypeSchema,
} from "./schemas/loadout";
import { ShipProfileIdSchema } from "./schemas/ship-profile";

const Mount = z
	.object({
		key: z.string().min(1),
		group: z.enum(["side", "hull", "aft"]),
		index: z.number().int().nonnegative(),
		type: SlotTypeSchema,
		width: z.number().finite().positive(),
		height: z.number().finite().positive(),
		x: z.number().finite(),
		y: z.number().finite(),
		angle: z.number().finite(),
		linkedTo: z.string().optional(),
	})
	.strict();
const Pair = z
	.object({
		a: z.string(),
		b: z.string(),
		origin: z.enum(["production", "planner"]),
	})
	.strict();
const COORDINATES =
	"ship-local: +x forward, +y right; production units; radians, Canvas rotation";
const metadata = (m: z.infer<typeof Mount>) =>
	JSON.stringify([
		m.key,
		m.group,
		m.index,
		m.type,
		m.width,
		m.height,
		m.linkedTo,
	]);
export const MountPlanSchema = z
	.object({
		version: z.literal(1),
		kind: z.literal("ship-mount-plan"),
		coordinates: z.literal(COORDINATES),
		chassis: ShipProfileIdSchema,
		baseline: z.array(Mount).min(1),
		mounts: z.array(Mount).min(1),
		mirrorPairs: z.array(Pair),
		previewLoadout: LoadoutSchema,
	})
	.strict()
	.superRefine((plan, ctx) => {
		const issue = (path: (string | number)[], message: string) =>
			ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
		if (plan.previewLoadout.chassis !== plan.chassis)
			issue(["previewLoadout"], "Preview must use this chassis");
		for (const field of ["baseline", "mounts"] as const) {
			if (new Set(plan[field].map((m) => m.key)).size !== plan[field].length)
				issue([field], "Mount keys must be unique");
		}
		if (plan.mounts.length !== plan.baseline.length)
			issue(["mounts"], "Every baseline mount is required");
		for (const m of plan.mounts) {
			const original = plan.baseline.find((b) => b.key === m.key);
			if (!original || metadata(original) !== metadata(m))
				issue(
					["mounts", m.key],
					"Mount identity and dimensions must match baseline",
				);
		}
		const used = new Set<string>();
		for (const [i, p] of plan.mirrorPairs.entries()) {
			const a = plan.mounts.find((m) => m.key === p.a),
				b = plan.mounts.find((m) => m.key === p.b);
			if (!a || !b || p.a === p.b || used.has(p.a) || used.has(p.b)) {
				issue(
					["mirrorPairs", i],
					"Pair requires two distinct, available mounts",
				);
				continue;
			}
			used.add(p.a);
			used.add(p.b);
			if (a.type !== b.type || a.width !== b.width || a.height !== b.height)
				issue(["mirrorPairs", i], "Pair types and dimensions must match");
			if (
				Math.abs(a.x - b.x) > 1e-10 ||
				Math.abs(a.y + b.y) > 1e-10 ||
				Math.abs(a.angle + b.angle) > 1e-10
			)
				issue(["mirrorPairs", i], "Pair geometry must be mirrored");
			if (
				p.origin === "production" &&
				b.linkedTo !== a.key &&
				a.linkedTo !== b.key
			)
				issue(["mirrorPairs", i], "Not a production link");
		}
		for (const m of plan.mounts)
			if (
				m.linkedTo &&
				!plan.mirrorPairs.some(
					(p) =>
						p.origin === "production" &&
						((p.a === m.key && p.b === m.linkedTo) ||
							(p.b === m.key && p.a === m.linkedTo)),
				)
			)
				issue(["mirrorPairs"], `Required production link missing: ${m.key}`);
	});
export type MountPlan = z.infer<typeof MountPlanSchema>;
export function geometry(m: BuildMount): MountPlan["mounts"][number] {
	return {
		key: m.key,
		group: m.group,
		index: m.index,
		type: m.type,
		width: m.width,
		height: m.height,
		x: m.x,
		y: m.y,
		angle: m.angle,
		...(m.linkedTo ? { linkedTo: m.linkedTo } : {}),
	};
}
export function newMountPlan(chassis: Loadout["chassis"]): MountPlan {
	const previewLoadout = defaultLoadout(chassis);
	const mounts = buildMounts(previewLoadout).map(geometry);
	return MountPlanSchema.parse({
		version: 1,
		kind: "ship-mount-plan",
		coordinates: COORDINATES,
		chassis,
		baseline: mounts,
		mounts,
		mirrorPairs: mounts
			.filter((m) => m.linkedTo)
			.map((m) => ({ a: m.linkedTo, b: m.key, origin: "production" })),
		previewLoadout,
	});
}
export function staleMounts(plan: MountPlan): string[] {
	const current = newMountPlan(plan.chassis).baseline;
	return [...new Set([...current, ...plan.baseline].map((m) => m.key))].filter(
		(key) =>
			JSON.stringify(current.find((m) => m.key === key)) !==
			JSON.stringify(plan.baseline.find((m) => m.key === key)),
	);
}
export function moveMount(
	plan: MountPlan,
	key: string,
	change: Partial<Pick<BuildMount, "x" | "y" | "angle">>,
): MountPlan {
	const next = structuredClone(plan),
		mount = next.mounts.find((m) => m.key === key);
	if (!mount) return next;
	Object.assign(mount, change);
	const pair = next.mirrorPairs.find((p) => p.a === key || p.b === key);
	const other =
		pair &&
		next.mounts.find((m) => m.key === (pair.a === key ? pair.b : pair.a));
	if (other)
		Object.assign(other, { x: mount.x, y: -mount.y, angle: -mount.angle });
	return MountPlanSchema.parse(next);
}
export function previewMounts(plan: MountPlan, original = false): BuildMount[] {
	const production = buildMounts(plan.previewLoadout);
	return (original ? plan.baseline : plan.mounts).map((m) => ({
		...production.find((p) => p.key === m.key),
		...m,
		label: production.find((p) => p.key === m.key)?.label ?? m.key,
		part: production.find((p) => p.key === m.key)?.part ?? null,
	}));
}
