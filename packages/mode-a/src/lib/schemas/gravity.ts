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
