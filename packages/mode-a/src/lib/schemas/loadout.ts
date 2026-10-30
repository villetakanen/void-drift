import { z } from "zod";
import { FIGHTER } from "../fighter";
import { ShipProfileIdSchema } from "./ship-profile";

export const EngineIdSchema = z.enum(["ion", "fission"]);
export const PartIdSchema = z.enum([
	"rail",
	"laser",
	"battery",
	"coil",
	"ion",
	"fission",
]);
export type PartId = z.infer<typeof PartIdSchema>;
export const PartSchema = z.object({
	id: PartIdSchema,
	name: z.string(),
	category: z.enum(["G", "U", "E"]),
	mass: z.number().positive(),
	thrust: z.number().nonnegative(),
	limit: z.number().nonnegative(),
	draw: z.number().nonnegative(),
});
export const ChassisSchema = z.object({
	name: z.string(),
	mass: z.number().positive(),
	hull: z.number().int().positive(),
	aft: z.number().int().positive(),
	angle: z.number().positive(),
	arm: z.number().positive(),
	sideX: z.number().default(0),
	turnResponse: z.number().positive().default(1),
	length: z.number().positive(),
	width: z.number().positive(),
});
export const CHASSIS = {
	scout: ChassisSchema.parse({
		name: "Scout",
		mass: 60,
		hull: 1,
		aft: 1,
		angle: 32,
		arm: 13,
		length: 26,
		width: 14,
	}),
	balanced: ChassisSchema.parse({
		name: "Fighter",
		mass: 95,
		hull: 2,
		aft: 2,
		angle: (FIGHTER.angle * 180) / Math.PI,
		arm: FIGHTER.arm,
		sideX: FIGHTER.sideX,
		turnResponse: FIGHTER.turnResponse,
		length: FIGHTER.length,
		width: FIGHTER.width,
	}),
	tank: ChassisSchema.parse({
		name: "Heavy Corvette",
		mass: 140,
		hull: 3,
		aft: 3,
		angle: 20,
		arm: 20,
		length: 38,
		width: 25,
	}),
};
export const PARTS = {
	rail: PartSchema.parse({
		id: "rail",
		name: "Rail gun",
		category: "G",
		mass: 15,
		thrust: 0,
		limit: 0,
		draw: 0,
	}),
	laser: PartSchema.parse({
		id: "laser",
		name: "Laser",
		category: "G",
		mass: 9,
		thrust: 0,
		limit: 0,
		draw: 0,
	}),
	battery: PartSchema.parse({
		id: "battery",
		name: "Energy storage",
		category: "U",
		mass: 18,
		thrust: 0,
		limit: 0,
		draw: 0,
	}),
	coil: PartSchema.parse({
		id: "coil",
		name: "Loading coil",
		category: "U",
		mass: 10,
		thrust: 0,
		limit: 0,
		draw: 0,
	}),
	ion: PartSchema.parse({
		id: "ion",
		name: "Ion engine",
		category: "E",
		mass: 10,
		thrust: 12000,
		limit: 500,
		draw: 2,
	}),
	fission: PartSchema.parse({
		id: "fission",
		name: "Fission engine",
		category: "E",
		mass: 16,
		thrust: 24000,
		limit: 350,
		draw: 3,
	}),
};
export const LoadoutSchema = z
	.object({
		version: z.literal(1),
		chassis: ShipProfileIdSchema,
		side: EngineIdSchema,
		hull: z.array(PartIdSchema.nullable()).max(3),
		aft: z.array(PartIdSchema.nullable()).max(3),
	})
	.strict()
	.superRefine((build, ctx) => {
		const chassis = CHASSIS[build.chassis];
		if (
			build.hull.length !== chassis.hull ||
			build.aft.length !== chassis.aft ||
			build.hull.some((id) => id && PARTS[id].category === "E")
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Parts must fit this chassis's fixed slots",
			});
		}
	});
export type Loadout = z.infer<typeof LoadoutSchema>;
export function defaultLoadout(chassis: Loadout["chassis"]): Loadout {
	return LoadoutSchema.parse({
		version: 1,
		chassis,
		side: "fission",
		hull: Array(CHASSIS[chassis].hull).fill(null),
		aft: Array(CHASSIS[chassis].aft).fill(null),
	});
}
export const BuildStoreSchema = z
	.object({
		scout: LoadoutSchema,
		balanced: LoadoutSchema,
		tank: LoadoutSchema,
	})
	.refine(
		(builds) =>
			builds.scout.chassis === "scout" &&
			builds.balanced.chassis === "balanced" &&
			builds.tank.chassis === "tank",
	);
export function defaultBuilds() {
	return {
		scout: defaultLoadout("scout"),
		balanced: defaultLoadout("balanced"),
		tank: defaultLoadout("tank"),
	};
}
export function buildStats(build: Loadout) {
	const chassis = CHASSIS[build.chassis];
	const ids = [build.side, build.side, ...build.hull, ...build.aft];
	let mass = chassis.mass,
		capacity = 100,
		coils = 1,
		engineDraw = 0;
	for (const id of ids) {
		if (!id) continue;
		mass += PARTS[id].mass;
		if (id === "battery") capacity += 100;
		if (id === "coil") coils++;
		engineDraw += PARTS[id].draw;
	}
	const side = PARTS[build.side];
	const angle = (chassis.angle * Math.PI) / 180;
	const aftThrust = build.aft.reduce(
		(sum, id) => sum + (id ? PARTS[id].thrust : 0),
		0,
	);
	return {
		mass,
		capacity,
		coils,
		engineDraw,
		drain: 3 + engineDraw,
		acceleration: (2 * side.thrust * Math.cos(angle) + aftThrust) / mass,
		turnRate:
			(side.thrust *
				chassis.turnResponse *
				(Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX)) /
			(mass * chassis.length ** 2),
		endurance: capacity / 3,
		fullEndurance: capacity / (3 + engineDraw),
	};
}
