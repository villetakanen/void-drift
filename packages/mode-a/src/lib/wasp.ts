import { FIGHTER } from "./fighter";

type Point = readonly [number, number];
const convert = ([across, aft]: Point): Point => [-aft, across];

const planes: { points: Point[]; shade: number }[] = [
	{
		points: [
			[0, -25],
			[-7.5, -18],
			[0, -16],
		],
		shade: 0,
	},
	{
		points: [
			[0, -25],
			[7.5, -18],
			[0, -16],
		],
		shade: 2,
	},
	{
		points: [
			[-7.5, -18],
			[-12.5, -7.5],
			[-3, -10],
			[0, -16],
		],
		shade: 1,
	},
	{
		points: [
			[7.5, -18],
			[12.5, -7.5],
			[3, -10],
			[0, -16],
		],
		shade: 3,
	},
	{
		points: [
			[-12.5, -7.5],
			[-18, 2.5],
			[-3, -1],
			[-3, -10],
		],
		shade: 0,
	},
	{
		points: [
			[12.5, -7.5],
			[18, 2.5],
			[3, -1],
			[3, -10],
		],
		shade: 3,
	},
	{
		points: [
			[-18, 2.5],
			[-13, 8.5],
			[-9, 3],
			[-3, -1],
		],
		shade: 1,
	},
	{
		points: [
			[18, 2.5],
			[13, 8.5],
			[9, 3],
			[3, -1],
		],
		shade: 4,
	},
	{
		points: [
			[-9, 3],
			[-6.5, 13.5],
			[0, 3.5],
			[-3, -1],
		],
		shade: 2,
	},
	{
		points: [
			[9, 3],
			[6.5, 13.5],
			[0, 3.5],
			[3, -1],
		],
		shade: 4,
	},
	{
		points: [
			[-6.5, 13.5],
			[-3, 19.5],
			[0, 12.5],
			[0, 3.5],
		],
		shade: 0,
	},
	{
		points: [
			[6.5, 13.5],
			[3, 19.5],
			[0, 12.5],
			[0, 3.5],
		],
		shade: 3,
	},
	{
		points: [
			[-3, 19.5],
			[0, 24.5],
			[0, 12.5],
		],
		shade: 1,
	},
	{
		points: [
			[3, 19.5],
			[0, 24.5],
			[0, 12.5],
		],
		shade: 5,
	},
];

const shadeToPalette = [
	FIGHTER.facets[0],
	FIGHTER.facets[1],
	FIGHTER.facets[5],
	FIGHTER.facets[2],
	FIGHTER.facets[4],
	FIGHTER.facets[3],
] as const;

const cockpitPlanes: Point[][] = [
	[
		[0, -16],
		[-3, -10],
		[-3, -1],
		[0, 3.5],
	],
	[
		[0, -16],
		[3, -10],
		[3, -1],
		[0, 3.5],
	],
];

const FRONT_RAD = (8.5 * Math.PI) / 180;
const REAR_RAD = (10.0 * Math.PI) / 180;
const frontFx = -Math.sin(FRONT_RAD);
const frontFy = Math.cos(FRONT_RAD);
const rearFx = Math.sin(REAR_RAD);
const rearFy = Math.cos(REAR_RAD);
const frontLever = 18.5 * frontFy - 4.4 * frontFx;
const rearLever = 13.5 * rearFy + 4.9 * rearFx;

/** Accepted 06.9 LHI Wasp hull, mounts, and 4-slit stabilizer geometry (+x forward). */
export const WASP = {
	facets: [
		...planes.map((plane) => ({
			points: plane.points.map(convert),
			color: shadeToPalette[plane.shade],
		})),
		...cockpitPlanes.map((points) => ({
			points: points.map(convert),
			color: "#000000",
		})),
	],
	// Nose at +25, stern at -24.5 (total axial span 49.5); wingspan 36 (-18 to +18).
	length: 25,
	fullLength: 49.5,
	width: 36,
	mass: 60,
	turnResponse: 1,
	sideX: -17.5,
	arm: 0,
	angle: 0,
	hullMounts: [
		[1.5, -12],
		[1.5, 12],
	] as const,
	engineMount: [-17.5, 0] as const,
	stabilizers: {
		front: {
			x: 18.5,
			y: 4.4,
			angle: 8.5,
			fx: frontFx,
			fy: frontFy,
			lever: frontLever,
		},
		rear: {
			x: -13.5,
			y: 4.9,
			angle: -10.0,
			fx: rearFx,
			fy: rearFy,
			lever: rearLever,
		},
		coupledLever: frontLever + rearLever,
		inertiaPerMass: (49.5 ** 2 + 36 ** 2) / 12 + ((25 - 24.5) / 2) ** 2,
	},
} as const;
