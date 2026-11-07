import { z } from "zod";

export const DestructionCauseSchema = z.enum([
	"player-weapon",
	"player-ram",
	"environment",
	"expiry",
	"exit",
]);
export type DestructionCause = z.infer<typeof DestructionCauseSchema>;

export const DerelictsResultSchema = z
	.object({
		seconds: z.number().nonnegative(),
		playerKills: z.number().int().nonnegative(),
		score: z.number().nonnegative(),
	})
	.refine(
		(result) => result.score === result.seconds + 10 * result.playerKills,
		{
			message:
				"Derelicts score must equal gameplay seconds plus ten per player kill",
		},
	);
export type DerelictsResult = z.infer<typeof DerelictsResultSchema>;

const ShotSchema = z.object({
	damage: z.number().positive(),
	energy: z.number().positive(),
	cooldown: z.number().positive(),
	range: z.number().positive(),
});
export const WeaponConfigSchema = z.object({
	reserve: z.number().nonnegative(),
	rail: ShotSchema.extend({
		speed: z.number().positive(),
		recoilStrength: z.number().nonnegative(),
		recoilDuration: z.number().positive(),
		arc: z
			.number()
			.positive()
			.max(Math.PI / 2),
	}),
	laser: ShotSchema.extend({
		turnSpeed: z.number().positive(),
		tolerance: z.number().positive(),
		threatHorizon: z.number().positive(),
	}),
});
/** Trial tuning, separate from engine draw and saved fittings. Angles are radians. */
export const WEAPONS = WeaponConfigSchema.parse({
	reserve: 10,
	rail: {
		damage: 100,
		energy: 3,
		cooldown: 0.6,
		speed: 600,
		range: 600, // Acquisition only; rounds travel until collision or system exit.
		arc: (8 * Math.PI) / 180, // Half-angle around the fixed barrel.
		recoilStrength: 0.34, // Fraction of one Light ion engine's force.
		recoilDuration: 0.22,
	},
	laser: {
		damage: 5,
		energy: 0.5,
		cooldown: 0.25,
		range: 160,
		turnSpeed: Math.PI * 2,
		tolerance: Math.PI / 90,
		threatHorizon: 3,
	},
});
export const EncounterConfigSchema = z
	.object({
		firstPass: z.number().nonnegative(),
		intervalMin: z.number().positive(),
		intervalMax: z.number().positive(),
		groups: z.number().int().positive(),
		centerX: z.number(),
		centerY: z.number(),
		radius: z.number().positive(),
		speedMin: z.number().positive(),
		speedMax: z.number().positive(),
		headingSpread: z
			.number()
			.positive()
			.lt(Math.PI / 2),
	})
	.refine((c) => c.intervalMax >= c.intervalMin && c.speedMax >= c.speedMin);
export const ENCOUNTER = EncounterConfigSchema.parse({
	firstPass: 3,
	intervalMin: 6,
	intervalMax: 12,
	groups: 8,
	centerX: 960,
	centerY: 540,
	radius: 1200,
	speedMin: 100,
	speedMax: 500,
	headingSpread: Math.PI / 3,
});
export const SalvageConfigSchema = z.object({
	wreck: z.object({
		hull: z.number().positive(),
		radius: z.number().positive(),
		life: z.number().positive(),
		contact: z.number().positive(),
	}),
	fragment: z.object({
		count: z.number().int().positive(),
		hull: z.number().positive(),
		radius: z.number().positive(),
		contact: z.number().positive(),
		life: z.number().positive(),
		speed: z.number().positive(),
	}),
	cell: z.object({
		energy: z.number().positive(),
		radius: z.number().positive(),
		life: z.number().positive(),
	}),
});
export const SALVAGE = SalvageConfigSchema.parse({
	wreck: { hull: 85, radius: 18, life: 30, contact: 30 },
	fragment: { count: 4, hull: 12, radius: 5, contact: 5, life: 12, speed: 60 },
	cell: { energy: 30, radius: 6, life: 20 },
});
