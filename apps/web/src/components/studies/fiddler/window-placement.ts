import {
	FIDDLER_WINDOW_OUTLINE,
	fiddlerUprightFaces,
	fiddlerWindowOutline,
} from "@void-drift/mode-a";
import { z } from "astro/zod";

export const WINDOW_LIMITS = {
	x: [-12, 12],
	y: [-20, 30],
	scale: [0.5, 1.6],
} as const;
export const WindowDraftSchema = z
	.object({
		version: z.literal(1),
		x: z.number().finite().min(WINDOW_LIMITS.x[0]).max(WINDOW_LIMITS.x[1]),
		y: z.number().finite().min(WINDOW_LIMITS.y[0]).max(WINDOW_LIMITS.y[1]),
		scale: z
			.number()
			.finite()
			.min(WINDOW_LIMITS.scale[0])
			.max(WINDOW_LIMITS.scale[1]),
	})
	.strict();
export type WindowDraft = z.infer<typeof WindowDraftSchema>;
export const WINDOW_DEFAULT: WindowDraft = {
	version: 1,
	x: 0,
	y: 0.5,
	scale: 1,
};
export function adjustWindow(
	draft: WindowDraft,
	change: Partial<WindowDraft>,
): WindowDraft {
	const next = { ...draft, ...change };
	for (const key of ["x", "y", "scale"] as const) {
		next[key] = Math.max(
			WINDOW_LIMITS[key][0],
			Math.min(WINDOW_LIMITS[key][1], next[key]),
		);
	}
	return WindowDraftSchema.parse(next);
}

// Shared production geometry: the study and flying ship use the same window.
export const WASP_WINDOW = FIDDLER_WINDOW_OUTLINE;
export const WINDOW_LENGTH =
	Math.max(...WASP_WINDOW.map((p) => p[1])) -
	Math.min(...WASP_WINDOW.map((p) => p[1]));
export const WINDOW_WIDTH =
	Math.max(...WASP_WINDOW.map((p) => p[0])) -
	Math.min(...WASP_WINDOW.map((p) => p[0]));
export const windowOutline = fiddlerWindowOutline;
export const windowPlacementFaces = fiddlerUprightFaces;
