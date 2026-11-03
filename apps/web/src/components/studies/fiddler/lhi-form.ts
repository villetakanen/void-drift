import { FIGHTER, WASP } from "@void-drift/mode-a";

type Point = readonly [number, number];
export interface LhiFace {
	points: readonly Point[];
	color: string;
}

const [light, top, left, dark, right, mid] = FIGHTER.facets;
const glass = WASP.facets[WASP.facets.length - 1].color;

// A construction reading of the supplied drawing, not an accepted chassis.
// Source-image coordinates make the relationship to the preserved draft inspectable.
const source: LhiFace[] = [
	// Swept shoulder roots: blade loads flow diagonally back into the centre body.
	{
		points: [
			[104, 376],
			[151, 392],
			[142, 419],
			[100, 432],
		],
		color: left,
	},
	{
		points: [
			[274, 376],
			[229, 392],
			[238, 498],
			[284, 472],
		],
		color: dark,
	},
	{
		points: [
			[104, 376],
			[100, 432],
			[94, 522],
			[50, 539],
		],
		color: mid,
	},
	{
		points: [
			[104, 376],
			[50, 539],
			[17, 496],
		],
		color: left,
	},
	{
		points: [
			[274, 376],
			[361, 496],
			[328, 539],
		],
		color: dark,
	},
	{
		points: [
			[274, 376],
			[328, 539],
			[284, 522],
		],
		color: right,
	},
	{
		points: [
			[100, 432],
			[142, 419],
			[129, 562],
			[94, 517],
		],
		color: dark,
	},
	// Left pincer: long inner wall; the outer edge bends and flares into the root.
	{
		points: [
			[82, 106],
			[104, 106],
			[104, 172],
			[82, 215],
			[60, 215],
		],
		color: light,
	},
	{
		points: [
			[104, 172],
			[104, 376],
			[82, 282],
			[82, 215],
		],
		color: mid,
	},
	{
		points: [
			[60, 215],
			[82, 215],
			[82, 282],
			[65, 364],
			[50, 359],
		],
		color: light,
	},
	{
		points: [
			[82, 282],
			[104, 376],
			[45, 451],
		],
		color: top,
	},
	{
		points: [
			[104, 376],
			[100, 432],
			[45, 451],
		],
		color: left,
	},
	// Right pincer: corresponding solids, with light still arriving from the left.
	{
		points: [
			[274, 106],
			[295, 106],
			[318, 215],
			[296, 215],
			[274, 172],
		],
		color: mid,
	},
	{
		points: [
			[274, 172],
			[296, 215],
			[296, 282],
			[274, 376],
		],
		color: light,
	},
	{
		points: [
			[296, 215],
			[318, 215],
			[328, 359],
			[313, 364],
			[296, 282],
		],
		color: mid,
	},
	{
		points: [
			[296, 282],
			[333, 451],
			[274, 376],
		],
		color: top,
	},
	{
		points: [
			[274, 376],
			[333, 451],
			[283, 432],
		],
		color: right,
	},
	// Central hull: the glass is a long recessed volume between continuous cheeks.
	{
		points: [
			[158, 319],
			[217, 319],
			[239, 429],
			[249, 562],
			[213, 662],
			[165, 662],
			[129, 562],
			[138, 429],
		],
		color: top,
	},
	{
		points: [
			[158, 319],
			[181, 319],
			[181, 387],
			[160, 429],
			[153, 550],
			[129, 562],
			[138, 429],
		],
		color: light,
	},
	{
		points: [
			[181, 319],
			[189, 319],
			[189, 369],
			[167, 412],
			[160, 429],
		],
		color: top,
	},
	{
		points: [
			[189, 319],
			[217, 319],
			[239, 429],
			[249, 562],
			[225, 550],
			[218, 429],
			[211, 412],
			[189, 369],
		],
		color: mid,
	},
	{
		points: [
			[167, 412],
			[167, 476],
			[178, 662],
			[165, 662],
			[153, 550],
		],
		color: light,
	},
	{
		points: [
			[167, 476],
			[189, 509],
			[189, 662],
			[178, 662],
		],
		color: top,
	},
	{
		points: [
			[189, 509],
			[211, 476],
			[200, 662],
			[189, 662],
		],
		color: right,
	},
	{
		points: [
			[211, 412],
			[218, 429],
			[225, 550],
			[213, 662],
			[200, 662],
			[211, 476],
		],
		color: left,
	},
	// Short aft vanes remain thin and distinct from the high body.
	{
		points: [
			[120, 563],
			[153, 550],
			[161, 609],
			[136, 620],
		],
		color: mid,
	},
	{
		points: [
			[225, 550],
			[258, 563],
			[242, 620],
			[217, 609],
		],
		color: right,
	},
	{
		points: [
			[189, 369],
			[211, 412],
			[211, 476],
			[189, 509],
			[167, 476],
			[167, 412],
		],
		color: glass,
	},
];

// The heavy reading broadens each pincer locally rather than filling the central gap.
// Body breadth grows modestly; the long embedded canopy retains its length and framing.
function project([x, y]: Point, heavy: boolean): Point {
	let across = (x - 189) / 5;
	const aft = (y - 384) / 5;
	if (heavy) {
		if (y < 319 && Math.abs(across) > 15) {
			const side = Math.sign(across);
			across = side * 21 + (across - side * 21) * 1.55;
		} else if (Math.abs(across) > 15) {
			across *= 1.15;
		} else {
			across *= 1.12;
		}
	}
	return [across, aft * (heavy ? 1.06 : 1)];
}

export const LHI_FORM = {
	draft: source.map((face) => ({
		...face,
		points: face.points.map((p) => project(p, false)),
	})),
	heavy: source.map((face) => ({
		...face,
		points: face.points.map((p) => project(p, true)),
	})),
};

// Only the four requested forward equipment positions are investigated here.
// Other mounts and engine architecture remain open, rather than inheriting 02.1's ten.
export const FORWARD_MOUNTS: readonly Point[] = [
	[-21.5, -33],
	[-22, -17],
	[21.5, -33],
	[22, -17],
];
