import { z } from "zod";

export const ShipProfileIdSchema = z.enum([
	"wasp",
	"scout",
	"fighter",
	"corvette",
	"fiddler",
]);

export const ShipProfileSchema = z.object({
	id: ShipProfileIdSchema,
	thrustMultiplier: z.number().positive(),
	turnMultiplier: z.number().positive(),
	hullMultiplier: z.number().positive(),
	powerDrainMultiplier: z.number().positive(),
	zoomDefault: z.number().positive(),
	tint: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const ShipProfilesSchema = z.array(ShipProfileSchema).length(5);

/** Display identity: the short name is the id; the long name is the full designation. */
export const ShipIdentitySchema = z
	.object({
		shortName: z.string().min(1),
		longName: z.string().min(1),
		trait: z.string().min(1),
	})
	.strict();

export const ShipIdentitiesSchema = z
	.object({
		wasp: ShipIdentitySchema,
		scout: ShipIdentitySchema,
		fighter: ShipIdentitySchema,
		corvette: ShipIdentitySchema,
		fiddler: ShipIdentitySchema,
	})
	.strict()
	.superRefine((ships, ctx) => {
		for (const [id, ship] of Object.entries(ships)) {
			if (ship.shortName.toLowerCase() !== id) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: [id, "shortName"],
					message: "A ship's short name must be its id",
				});
			}
		}
	});

export type ShipProfileId = z.infer<typeof ShipProfileIdSchema>;
export type ShipProfile = z.infer<typeof ShipProfileSchema>;
export type ShipIdentity = z.infer<typeof ShipIdentitySchema>;
