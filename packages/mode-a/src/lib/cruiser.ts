import { FIGHTER } from "./fighter";

type Point = readonly [number, number];
const convert = ([across, aft]: Point): Point => [-aft, across];
const outline: Point[] = [
	[-3, -50],
	[3, -50],
	[12, -27],
	[14, 7],
	[21, 19],
	[19, 42],
	[-19, 42],
	[-21, 19],
	[-14, 7],
	[-12, -27],
];
/** Approved Long bevel 08, converted from the study's bow-up coordinates. */
export const CRUISER = {
	length: 51,
	arm: 12,
	sideX: 22.5,
	angle: 39,
	hullMounts: [45.5, 0.5, -12.5],
	aftMounts: [
		[-37, -11],
		[-30.5, 0],
		[-37, 11],
	] as const,
	facets: [
		...outline.map((p, i) => {
			const n = outline[(i + 1) % outline.length];
			return {
				points: ([[0, -5], p, n] as Point[]).map(convert),
				color:
					FIGHTER.facets[
						(p[0] + n[0]) / 2 < 0 ? [0, 1, 2][i % 3] : [3, 4, 5][i % 3]
					],
			};
		}),
		...[
			{
				points: [
					[-3, -50],
					[-5, -26],
					[-6, 14],
					[-14, 36],
					[-19, 42],
					[-14, 7],
					[-12, -27],
				],
				color: FIGHTER.facets[1],
			},
			{
				points: [
					[3, -50],
					[12, -27],
					[14, 7],
					[19, 42],
					[14, 36],
					[6, 14],
					[5, -26],
				],
				color: FIGHTER.facets[3],
			},
			{
				points: [
					[0, -40],
					[6, -26],
					[7, 17],
					[0, 30],
					[-7, 17],
					[-6, -26],
				],
				color: FIGHTER.facets[0],
			},
			{
				points: [
					[0, -40],
					[6, -26],
					[7, 17],
					[0, 30],
					[0, -25],
				],
				color: FIGHTER.facets[5],
			},
			{
				points: [
					[-7, -36],
					[-1, -39],
					[-1, -31],
					[-5, -30],
				],
				color: "#000000",
			},
			{
				points: [
					[1, -39],
					[7, -36],
					[5, -30],
					[1, -31],
				],
				color: "#000000",
			},
		].map((f) => ({
			...f,
			points: f.points.map((p) => convert(p as [number, number])),
		})),
	],
	notch: (
		[
			[-5, 31],
			[5, 31],
			[6, 44],
			[-6, 44],
		] as Point[]
	).map(convert),
};
