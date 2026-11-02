import { z } from "zod";
import { CRUISER } from "../cruiser";
import { FIGHTER } from "../fighter";
import { SCOUT } from "../scout";
import { stabilizerMount } from "../stabilizers";
import { WASP } from "../wasp";
import {
	ION_DEFAULTS,
	ION_REFERENCE_MASS,
	STABILIZER_ENERGY,
	STABILIZER_STRENGTH,
} from "./ion";
import { ShipProfileIdSchema } from "./ship-profile";

export const EngineIdSchema = z.enum(["ion", "heavy-ion", "fusion", "plasma"]);
export const PartIdSchema = z.enum([
	"rail",
	"laser",
	"battery",
	"heavy-well",
	"coil",
	"ion",
	"heavy-ion",
	"fusion",
	"plasma",
]);
export type PartId = z.infer<typeof PartIdSchema>;
export const PartSchema = z.object({
	id: PartIdSchema,
	description: z.string().max(220).default(""),
	capacity: z.number().nonnegative().default(0),
	name: z.string(),
	category: z.enum(["G", "U", "E"]),
	mass: z.number().positive(),
	thrust: z.number().nonnegative(),
	limit: z.number().nonnegative(),
	draw: z.number().nonnegative(),
	response: z.enum(["steady", "pulse", "delayed"]).default("steady"),
	chargeSeconds: z.number().nonnegative().default(0),
	pulsePeriod: z.number().positive().default(0.45),
	pulseOn: z.number().positive().default(0.18),
});
export const SlotTypeSchema = z.enum([
	"engine",
	"weapon",
	"equipment",
	"universal",
]);
export type SlotType = z.infer<typeof SlotTypeSchema>;
export const SLOT_TYPES = {
	engine: { symbol: "E", label: "Engines" },
	weapon: { symbol: "W", label: "Weapons" },
	equipment: { symbol: "Q", label: "Equipment" },
	universal: { symbol: "+", label: "Universal" },
} as const;
export function slotAccepts(type: SlotType, category: "E" | "G" | "U") {
	return (
		type === "universal" ||
		(type === "equipment" && category !== "E") ||
		(type === "weapon" && category === "G") ||
		(type === "engine" && category === "E")
	);
}
export const ChassisSchema = z.object({
	mass: z.number().positive(),
	hull: z.number().int().positive(),
	aft: z.number().int().nonnegative(),
	angle: z.number().nonnegative(),
	arm: z.number().nonnegative(),
	sideX: z.number().default(0),
	turnResponse: z.number().positive().default(1),
	length: z.number().positive(),
	width: z.number().positive(),
});
export const CHASSIS = {
	wasp: ChassisSchema.parse({
		mass: WASP.mass,
		hull: 2,
		aft: 0,
		angle: WASP.angle,
		arm: WASP.arm,
		sideX: WASP.sideX,
		turnResponse: WASP.turnResponse,
		length: WASP.length,
		width: WASP.width,
	}),
	scout: ChassisSchema.parse({
		mass: SCOUT.mass,
		hull: 1,
		aft: 1,
		angle: SCOUT.angle,
		arm: SCOUT.arm,
		sideX: SCOUT.sideX,
		turnResponse: SCOUT.turnResponse,
		length: SCOUT.length,
		width: SCOUT.width,
	}),
	fighter: ChassisSchema.parse({
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
	corvette: ChassisSchema.parse({
		mass: 140,
		hull: 3,
		aft: 3,
		angle: CRUISER.angle,
		arm: CRUISER.arm,
		sideX: CRUISER.sideX,
		length: CRUISER.length,
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
		name: "Potential Well",
		description:
			"A bank of well containment units stores potential in subspace, ready to supply the ship with matter and energy as needed.",
		capacity: 85,
		category: "U",
		mass: 18,
		thrust: 0,
		limit: 0,
		draw: 0,
	}),
	"heavy-well": PartSchema.parse({
		id: "heavy-well",
		name: "Heavy Potential Well",
		description:
			"A bank of well containment units stores potential in subspace, ready to supply the ship with matter and energy as needed.",
		category: "U",
		capacity: 140,
		mass: 36,
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
		name: "Light ion",
		category: "E",
		mass: 10,
		thrust: ION_DEFAULTS.acceleration * ION_REFERENCE_MASS,
		limit: ION_DEFAULTS.maxSpeed,
		draw: 2,
	}),

	"heavy-ion": PartSchema.parse({
		id: "heavy-ion",
		name: "Heavy ion",
		category: "E",
		mass: 20,
		thrust: ION_DEFAULTS.acceleration * ION_REFERENCE_MASS * 1.75,
		limit:
			ION_DEFAULTS.maxSpeed *
			(1 + ION_DEFAULTS.bonus * (1 - Math.exp(-ION_DEFAULTS.falloff * 0.75))),
		draw: 2 * 1.75,
		response: "steady",
		chargeSeconds: 0,
	}),
	fusion: PartSchema.parse({
		id: "fusion",
		name: "Fusion",
		category: "E",
		mass: 16,
		thrust: 48000,
		limit: 550,
		draw: 3,
		response: "pulse",
		chargeSeconds: 0,
	}),
	plasma: PartSchema.parse({
		id: "plasma",
		name: "Plasma",
		category: "E",
		mass: 24,
		thrust: 38000,
		limit: 700,
		draw: 5,
		response: "delayed",
		chargeSeconds: 0.6,
	}),
};
export const LoadoutSchema = z
	.object({
		version: z.literal(2),
		chassis: ShipProfileIdSchema,
		side: EngineIdSchema,
		stabilizers: z.boolean().default(false),
		hull: z.array(PartIdSchema.nullable()).max(3),
		aft: z.array(PartIdSchema.nullable()).max(3),
	})
	.strict()
	.superRefine((build, ctx) => {
		const chassis = CHASSIS[build.chassis];
		if (
			build.hull.length !== chassis.hull ||
			build.aft.length !== chassis.aft ||
			build.hull.some(
				(id) => id && !slotAccepts("equipment", PARTS[id].category),
			)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Parts must fit this chassis's fixed slots",
			});
		}
	})
	.transform((build) =>
		build.chassis === "wasp" ? { ...build, stabilizers: true } : build,
	);
export type Loadout = z.infer<typeof LoadoutSchema>;
export function defaultLoadout(chassis: Loadout["chassis"]): Loadout {
	return LoadoutSchema.parse({
		version: 2,
		chassis,
		side: "ion",
		stabilizers: chassis === "wasp",
		hull: Array(CHASSIS[chassis].hull).fill(null),
		aft: Array(CHASSIS[chassis].aft).fill(null),
	});
}
/** Fixed main-game fleet; builder saves and isolated Lab fixtures stay independent. */
export function starterLoadout(chassis: Loadout["chassis"]): Loadout {
	const build = defaultLoadout(chassis);
	build.stabilizers = true;
	build.aft.fill("ion");
	const packs = chassis === "fighter" ? 1 : chassis === "corvette" ? 2 : 0;
	for (let i = 0; i < packs; i++) build.hull[i] = "battery";
	return LoadoutSchema.parse(build);
}
export const BuildStoreSchema = z
	.object({
		wasp: LoadoutSchema.default(() => defaultLoadout("wasp")),
		scout: LoadoutSchema,
		fighter: LoadoutSchema,
		corvette: LoadoutSchema,
	})
	.refine(
		(builds) =>
			builds.wasp.chassis === "wasp" &&
			builds.scout.chassis === "scout" &&
			builds.fighter.chassis === "fighter" &&
			builds.corvette.chassis === "corvette",
	);
export function defaultBuilds() {
	return {
		wasp: defaultLoadout("wasp"),
		scout: defaultLoadout("scout"),
		fighter: defaultLoadout("fighter"),
		corvette: defaultLoadout("corvette"),
	};
}
/** Every fitted part, one entry per mount: the Wasp has one side mount, other chassis two. */
export function fittedParts(build: Loadout): PartId[] {
	const ids =
		build.chassis === "wasp"
			? [build.side, ...build.hull]
			: [build.side, build.side, ...build.hull, ...build.aft];
	return ids.filter((id): id is PartId => id !== null);
}
export function buildStats(build: Loadout) {
	const chassis = CHASSIS[build.chassis];
	const isWasp = build.chassis === "wasp";
	const ids = fittedParts(build);
	let mass = chassis.mass,
		capacity = 100,
		coils = 1,
		engineDraw = 0;
	for (const id of ids) {
		if (!id) continue;
		mass += PARTS[id].mass;
		capacity += PARTS[id].capacity;
		if (id === "coil") coils++;
		engineDraw += PARTS[id].draw;
	}
	if (isWasp || build.stabilizers)
		engineDraw += PARTS.ion.draw * STABILIZER_ENERGY;
	const side = PARTS[build.side];
	const angle = (chassis.angle * Math.PI) / 180;
	const aftThrust = build.aft.reduce(
		(sum, id) => sum + (id ? PARTS[id].thrust : 0),
		0,
	);
	const acceleration = isWasp
		? side.thrust / mass
		: (2 * side.thrust * Math.cos(angle) + aftThrust) / mass;
	const turnRate = isWasp
		? (PARTS.ion.thrust * STABILIZER_STRENGTH * WASP.stabilizers.coupledLever) /
			(mass * WASP.stabilizers.inertiaPerMass)
		: (side.thrust *
				(Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX)) /
			(mass * stabilizerMount(build.chassis).inertiaPerMass);
	return {
		mass,
		capacity,
		coils,
		engineDraw,
		drain: 3 + engineDraw,
		acceleration,
		turnRate,
		endurance: capacity / 3,
		fullEndurance: capacity / (3 + engineDraw),
	};
}
