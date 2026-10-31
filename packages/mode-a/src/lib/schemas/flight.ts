import { z } from "zod";
import { LoadoutSchema } from "./loadout";
import { ShipProfileSchema } from "./ship-profile";

export const FlightSettingsSchema = z
	.object({
		loadout: LoadoutSchema.optional(),
		testFlight: z.boolean().default(false),
		seed: z.number().int().min(1).max(2147483647),
		profile: ShipProfileSchema.extend({
			thrustMultiplier: z.number().min(0.5).max(2),
			turnMultiplier: z.number().min(0.5).max(2),
			hullMultiplier: z.number().min(0.5).max(2),
			powerDrainMultiplier: z.number().min(0.5).max(2),
		}),
		camera: z.object({
			zoomSteps: z.number().int().min(4).max(11).default(5),
			padding: z.number().min(80).max(400),
			smoothing: z.number().min(1).max(12),
		}),
	})
	.refine(
		(settings) =>
			!settings.loadout || settings.loadout.chassis === settings.profile.id,
		{ message: "Build and profile chassis must match" },
	);
export type FlightSettings = z.infer<typeof FlightSettingsSchema>;
export const ReplayInputSchema = z.object({
	ticks: z.number().int().min(1).max(36000),
	leftThruster: z.boolean(),
	rightThruster: z.boolean(),
	fire: z.literal(false),
});
export const ReplaySchema = z.array(ReplayInputSchema).max(1000);
