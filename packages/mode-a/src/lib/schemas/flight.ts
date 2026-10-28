import { z } from "zod";
import { ShipProfileSchema } from "./ship-profile";

export const FlightSettingsSchema = z.object({
	seed: z.number().int().min(1).max(2147483647),
	profile: ShipProfileSchema.extend({
		thrustMultiplier: z.number().min(0.5).max(2),
		turnMultiplier: z.number().min(0.5).max(2),
		hullMultiplier: z.number().min(0.5).max(2),
		powerDrainMultiplier: z.number().min(0.5).max(2),
	}),
	camera: z.object({
		padding: z.number().min(80).max(400),
		smoothing: z.number().min(1).max(12),
	}),
});
export type FlightSettings = z.infer<typeof FlightSettingsSchema>;
export const ReplayInputSchema = z.object({
	ticks: z.number().int().min(1).max(36000),
	leftThruster: z.boolean(),
	rightThruster: z.boolean(),
	fire: z.literal(false),
});
export const ReplaySchema = z.array(ReplayInputSchema).max(1000);
