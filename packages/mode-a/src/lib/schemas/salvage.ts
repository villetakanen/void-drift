import { z } from "zod";

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
export const SalvageConfigSchema = z.object({
	firstPass: z.number().nonnegative(),
	interval: z.number().positive(),
	summonCooldown: z.number().positive(),
	groups: z.number().int().positive(),
	forward: z.number().positive(),
	side: z.number().positive(),
	wreck: z.object({
		hull: z.number().positive(),
		radius: z.number().positive(),
		speed: z.number().positive(),
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
	firstPass: 3,
	interval: 18,
	summonCooldown: 1,
	groups: 2,
	forward: 150,
	side: 220,
	wreck: { hull: 85, radius: 18, speed: 40, life: 18, contact: 30 },
	fragment: { count: 4, hull: 12, radius: 5, contact: 5, life: 12, speed: 60 },
	cell: { energy: 30, radius: 6, life: 20 },
});
