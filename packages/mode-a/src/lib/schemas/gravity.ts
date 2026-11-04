import { PlanetReachRuleSchema, WellCurveSchema } from "@void-drift/core";
import { z } from "zod";

/** Gravity values in play. Spec: docs/specs/gravity-field.md#tuning-values */
export const GravityTuningSchema = z
	.object({
		sunMultiplier: z.number().min(4).max(10),
		planetStrength: z.number().finite().positive(),
		sunReachFactor: z.number().finite().positive(),
		planetReach: PlanetReachRuleSchema,
		curve: WellCurveSchema,
	})
	.strict();
export type GravityTuning = z.infer<typeof GravityTuningSchema>;

/** The game's arena: a circle of radius 1200 round (960, 540). */
export const ARENA = { x: 960, y: 540, radius: 1200 } as const;
const insideArena = (point: { x: number; y: number }) =>
	Math.hypot(point.x - ARENA.x, point.y - ARENA.y) < ARENA.radius;

/** A Lab-only point well: it pulls but has no surface. */
export const LabWellSchema = z
	.object({
		label: z.string().min(1).max(24),
		x: z.number().finite(),
		y: z.number().finite(),
		reach: z.number().finite().positive(),
		strength: z.number().finite().positive(),
		curve: WellCurveSchema,
	})
	.strict()
	.refine(insideArena, { message: "Lab well must be inside the arena" });
export type LabWell = z.infer<typeof LabWellSchema>;

/** Heading in degrees: 0 = +x, -90 = up. Speed is along the heading. */
export const ShipStartSchema = z
	.object({
		x: z.number().finite(),
		y: z.number().finite(),
		heading: z.number().finite(),
		speed: z.number().finite().nonnegative(),
	})
	.strict()
	.refine(insideArena, { message: "start must be inside the arena" });
export type ShipStart = z.infer<typeof ShipStartSchema>;

/** Flight conditions for Lab experiments. Spec: docs/specs/gravity-field.md */
export const GravityFieldSchema = z
	.object({
		system: z.enum(["game", "empty"]).default("game"),
		orbits: z.enum(["moving", "frozen"]).default("moving"),
		wells: z.array(LabWellSchema).max(4).default([]),
		changes: GravityTuningSchema.partial().default({}),
		start: ShipStartSchema.optional(),
	})
	.strict();
export type GravityField = z.infer<typeof GravityFieldSchema>;
