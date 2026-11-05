import { z } from "zod";
import { AssembledIonSettingsSchema } from "./ion";
import { defaultLoadout, LoadoutSchema } from "./loadout";
import { ShipProfileSchema } from "./ship-profile";

export const FlightSettingsSchema = z
	.object({
		loadout: LoadoutSchema.optional(),
		ion: AssembledIonSettingsSchema.default(() =>
			AssembledIonSettingsSchema.parse({}),
		),
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
	)
	.transform((settings) =>
		settings.profile.id === "fiddler" && !settings.loadout
			? { ...settings, loadout: defaultLoadout("fiddler") }
			: settings,
	);
export type FlightSettings = z.infer<typeof FlightSettingsSchema>;
export const ReplayInputSchema = z.object({
	ticks: z.number().int().min(1).max(36000),
	leftThruster: z.boolean(),
	rightThruster: z.boolean(),
	fire: z.literal(false),
	// Scenario command, consumed once at the beginning of a replay chunk.
	sendDerelict: z.boolean().optional(),
});
export const ReplaySchema = z.array(ReplayInputSchema).max(1000);
