import { z } from "astro/zod";
import { BURN_IDS } from "../instrument/burns";

// The Gravity tuning bench's document (docs/specs/gravity-tuning.md): the burn
// drawn and the bench's four settings. Ships and burns are not settings.
export const GravityWell = z
	.object({
		x: z.number().finite().min(-10000).max(10000).default(1200),
		y: z.number().finite().min(-10000).max(10000).default(300),
		strength: z.number().finite().positive().max(10000).default(600),
		sizeMultiplier: z.number().finite().positive().max(5).default(0.5),
	})
	.strict();
export type GravityWell = z.infer<typeof GravityWell>;

export const GravityTuningConfig = z
	.object({
		version: z.literal(1),
		burn: z.enum(BURN_IDS).default("course"),
		startSpeed: z.number().finite().min(0).max(1000).default(0),
		well: GravityWell.default({}),
	})
	.strict();
export type GravityTuningConfig = z.infer<typeof GravityTuningConfig>;

/** The bench's opening document. */
export const DEFAULT_DOCUMENT = GravityTuningConfig.parse({ version: 1 });
