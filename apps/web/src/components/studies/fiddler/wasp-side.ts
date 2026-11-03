import { WASP } from "@void-drift/mode-a";

export type Point3 = readonly [number, number, number];
export interface SideFace {
	points: readonly Point3[];
	color: string;
}
export const WASP_SIDE_INDICES = [0, 6];
export const waspUpright = (point: readonly [number, number]) =>
	[point[1], WASP.length - point[0]] as const;

// The same two production contours used in 02.5 and 02.6. Only the illustrative
// lift is supplied by this study. No inner vertices are filled or simplified.
export const WASP_SIDE: readonly SideFace[] = WASP_SIDE_INDICES.map((index) => {
	const face = WASP.facets[index];
	const outline = face.points.map(waspUpright);
	const a = outline[0];
	const b = outline[outline.length - 1];
	return {
		color: face.color,
		points: outline.map(([x, y]): Point3 => {
			const outerX = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
			return [x, y, (x - outerX) * 0.6];
		}),
	};
});
