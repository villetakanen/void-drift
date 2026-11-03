import { FIGHTER, type SlotType } from "@void-drift/mode-a";

// Study-only geometry, upright (across, aft). No playable chassis is registered.
export type Point = readonly [number, number];
export interface Face {
	points: readonly Point[];
	color: string;
}
export interface Mount {
	x: number;
	y: number;
	type: SlotType;
}
export type Variant = "A" | "B" | "C";
export const variants = [
	{
		id: "A",
		name: "Keel bridge",
		character: "A heavy fork built around a command spine.",
		reason:
			"A narrow central bridge repeats Wasp’s nose and canopy. The blades carry the equipment; the centre stays quiet.",
		tension:
			"Strong family resemblance, but the centre can read as a third prow.",
	},
	{
		id: "B",
		name: "Port bridge",
		character: "Two long blades, one watchful shoulder.",
		reason:
			"A port-side bridge leaves the throat completely open. A low stern beam joins two equal load-bearing hulls.",
		tension:
			"The clearest catamaran; the offset canopy must remain visible among fittings.",
	},
	{
		id: "C",
		name: "Broad yoke",
		character: "A fortress held behind two outstretched claws.",
		reason:
			"A wider stern and short, raised bridge gather the ship’s weight behind the blades. Thin swept shoulders retain the LHI stance.",
		tension:
			"The most imposing body; a filled stern may make it feel less agile and less like Wasp.",
	},
] as const;

const [light, top, left, dark, right, mid] = FIGHTER.facets;

export function geometry(id: Variant) {
	const faces: Face[] = [];
	const add = (points: readonly Point[], color: string) =>
		faces.push({ points, color });
	const spread = id === "C" ? 29 : 25;
	const stern = id === "C" ? 51 : 54;
	const throat = id === "A" ? 18 : id === "B" ? 12 : 4;

	// Low crossbeam: a shallow solid below the two raised longitudinal hulls.
	add(
		[
			[-spread, throat],
			[spread, throat],
			[spread + 5, stern - 10],
			[0, stern],
			[-spread - 5, stern - 10],
		],
		mid,
	);
	add(
		[
			[-spread, throat],
			[0, throat + 6],
			[0, stern],
			[-spread - 5, stern - 10],
		],
		left,
	);
	add(
		[
			[0, throat + 6],
			[spread, throat],
			[spread + 5, stern - 10],
			[0, stern],
		],
		right,
	);

	for (const side of [-1, 1]) {
		const x = side * spread;
		// Thin swept shoulder: one plane, distinct from the tall blade above it.
		add(
			[
				[x, -8],
				[side * (spread + 20), 29],
				[side * (spread + 11), 40],
				[x, 29],
			],
			side < 0 ? left : dark,
		);
		// Raised blade: narrow bow, calm deck, left ridge, dark right chine.
		add(
			[
				[x - 4, -62],
				[x + 4, -62],
				[x + 8, -35],
				[x + 8, 29],
				[x + 5, stern],
				[x - 5, stern],
				[x - 8, 29],
				[x - 8, -35],
			],
			mid,
		);
		add(
			[
				[x - 4, -62],
				[x - 1, -62],
				[x - 3, -32],
				[x - 3, 25],
				[x - 5, stern],
				[x - 8, 29],
				[x - 8, -35],
			],
			light,
		);
		add(
			[
				[x - 1, -62],
				[x + 4, -62],
				[x + 5, -32],
				[x + 5, 25],
				[x + 2, stern],
				[x - 5, stern],
				[x - 3, 25],
				[x - 3, -32],
			],
			side < 0 ? top : mid,
		);
		add(
			[
				[x + 4, -62],
				[x + 8, -35],
				[x + 8, 29],
				[x + 5, stern],
				[x + 2, stern],
				[x + 5, 25],
				[x + 5, -32],
			],
			side < 0 ? mid : right,
		);
	}

	const bridgeX = id === "B" ? -spread : 0;
	const bridgeY = id === "A" ? -9 : id === "B" ? -1 : 3;
	const bridgeLength = id === "A" ? 54 : 25;
	const bridgeWidth = id === "C" ? 9 : 6;
	add(
		[
			[bridgeX - 2, bridgeY],
			[bridgeX, bridgeY],
			[bridgeX, bridgeY + bridgeLength],
			[bridgeX - bridgeWidth, bridgeY + bridgeLength - 5],
			[bridgeX - bridgeWidth, bridgeY + 12],
		],
		light,
	);
	add(
		[
			[bridgeX, bridgeY],
			[bridgeX + 3, bridgeY],
			[bridgeX + bridgeWidth, bridgeY + 12],
			[bridgeX + bridgeWidth, bridgeY + bridgeLength - 5],
			[bridgeX, bridgeY + bridgeLength],
		],
		mid,
	);
	const canopy: Point[] = [
		[bridgeX, bridgeY + 5],
		[bridgeX + 3, bridgeY + 11],
		[bridgeX + 3, bridgeY + 17],
		[bridgeX, bridgeY + 20],
		[bridgeX - 3, bridgeY + 17],
		[bridgeX - 3, bridgeY + 11],
	];

	const mounts: Mount[] = [];
	for (const x of [-spread, spread]) {
		mounts.push(
			{ x, y: -40, type: "equipment" },
			{ x, y: -23, type: "equipment" },
		);
	}
	mounts.push(
		{ x: -spread - 10, y: 25, type: "equipment" },
		{ x: spread + 10, y: 25, type: "equipment" },
		{ x: -12, y: 38, type: "universal" },
		{ x: 12, y: 38, type: "universal" },
		{ x: -spread, y: 45, type: "engine" },
		{ x: spread, y: 45, type: "engine" },
	);
	return { faces, canopy, mounts, spread };
}
