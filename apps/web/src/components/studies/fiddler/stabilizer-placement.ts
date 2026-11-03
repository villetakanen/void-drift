import { WASP } from "@void-drift/mode-a";
import { z } from "astro/zod";

const PairSchema = z
	.object({
		halfSpan: z.number().finite().min(1).max(30),
		y: z.number().finite().min(-62).max(62),
		angle: z.number().finite().min(-90).max(90),
	})
	.strict();
export const StabilizerPlacementSchema = z
	.object({
		version: z.literal(1),
		front: PairSchema,
		rear: PairSchema,
	})
	.strict();
export type StabilizerPlacement = z.infer<typeof StabilizerPlacementSchema>;
export type StabilizerPair = "front" | "rear";
export type PairPlacement = StabilizerPlacement[StabilizerPair];
export const STABILIZER_START: StabilizerPlacement = {
	version: 1,
	front: { halfSpan: 20.5, y: -48, angle: WASP.stabilizers.front.angle },
	rear: { halfSpan: 3.8, y: 54, angle: WASP.stabilizers.rear.angle },
};
/** Designer's settled 02.13 placement; upright coordinates, +y aft. */
export const STABILIZER_DECIDED: StabilizerPlacement = {
	version: 1,
	front: { halfSpan: 24, y: -43, angle: 8.5 },
	rear: { halfSpan: 14.5, y: 33, angle: -16.5 },
};
export function adjustStabilizer(
	pair: PairPlacement,
	change: Partial<PairPlacement>,
): PairPlacement {
	const next = { ...pair, ...change };
	next.halfSpan = Math.max(1, Math.min(30, next.halfSpan));
	next.y = Math.max(-62, Math.min(62, next.y));
	next.angle = Math.max(-90, Math.min(90, next.angle));
	return PairSchema.parse(next);
}
/** Same mirrored slit geometry as Wasp, converted to +x-forward ship coordinates. */
export function stabilizerGeometry(pair: PairPlacement) {
	const rad = (pair.angle * Math.PI) / 180;
	return {
		x: -pair.y,
		y: pair.halfSpan,
		fx: -Math.sin(rad),
		fy: Math.cos(rad),
	};
}
