import { FIGHTER } from "./fighter";

type Point = readonly [number, number];
const convert = ([across, aft]: Point): Point => [-aft, across];
const planes: { points: Point[]; color: number }[] = [
	{
		points: [
			[0, -23],
			[21, 24],
			[11, 14],
			[8, 4],
			[5, 9],
			[5, 20],
			[0, 29],
			[-5, 20],
			[-5, 9],
			[-8, 4],
			[-11, 14],
			[-21, 24],
		],
		color: 3,
	},
	{
		points: [
			[0, -23],
			[-21, 24],
			[-11, 14],
			[-8, 4],
			[0, -4],
		],
		color: 1,
	},
	{
		points: [
			[0, -23],
			[21, 24],
			[11, 14],
			[8, 4],
			[0, -4],
		],
		color: 4,
	},
	{
		points: [
			[0, -23],
			[-4, -5],
			[-5, 20],
			[0, 29],
		],
		color: 0,
	},
	{
		points: [
			[0, -23],
			[4, -5],
			[5, 20],
			[0, 29],
		],
		color: 5,
	},
	{
		points: [
			[-21, 24],
			[-6, -9],
			[-11, 14],
		],
		color: 2,
	},
];

/** Accepted 02.5 / 06 Trident and 02.6 screenshot layout, local +x forward. */
export const SCOUT = {
	facets: planes.map((plane) => ({
		points: plane.points.map(convert),
		color: FIGHTER.facets[plane.color],
	})),
	cockpit: { x: 21, y: 0, radius: 6, collarRadius: 6.8 },
	// Forward extent including the cockpit collar, used as the existing turning proxy.
	length: 27.8,
	width: 21,
	mass: 60,
	turnResponse: 1,
	sideX: 10.5,
	arm: 6,
	angle: 49,
	// Reconstructed from the approved screenshot; preserve the accepted axial packing.
	hullX: 1,
	aftX: -11.5,
} as const;
