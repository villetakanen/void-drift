// The Lab page's starting document: the three Fighters compared in the
// lab-instrument study (02.7): ion aft, plasma aft, and plasma with more thrust.
const fighter = (aft: [string | null, string | null]) => ({
	version: 2,
	chassis: "fighter",
	side: "ion",
	stabilizers: true,
	hull: [null, null],
	aft,
});

export const STARTER_DOCUMENT = {
	version: 1,
	burn: "course",
	vehicles: [
		{ label: "Ion aft", loadout: fighter(["ion", "ion"]) },
		{ label: "Plasma aft", loadout: fighter(["plasma", "plasma"]) },
		{
			label: "Plasma aft, more thrust",
			loadout: fighter(["plasma", "plasma"]),
			changes: { plasma: { thrust: 46000 } },
		},
	],
};

// A field document for the field views' reference (lab-instrument.md, "Gravity
// field mode"): the game's sun and planets held still, two Lab wells in the
// empty lower right, and four coasting probes that end free, in the sun, bound
// by the Lab wells, and in the sun after touching the moon.
const probe = fighter(["ion", "ion"]);
export const FIELD_DOCUMENT = {
	version: 2,
	burn: "coast",
	field: {
		system: "game",
		orbits: "frozen",
		wells: [
			{
				label: "W1",
				x: 1600,
				y: 1000,
				reach: 220,
				strength: 900,
				curve: "inverse-square",
			},
			{
				label: "W2",
				x: 1790,
				y: 810,
				reach: 180,
				strength: 600,
				curve: "linear",
			},
		],
	},
	vehicles: [
		{
			label: "Close pass",
			loadout: probe,
			start: { x: 400, y: 682, heading: 0, speed: 500 },
		},
		{
			label: "Too deep",
			loadout: probe,
			start: { x: 400, y: 636, heading: 0, speed: 500 },
		},
		{
			label: "Lab wells",
			loadout: probe,
			start: { x: 1490, y: 1000, heading: 90, speed: 60 },
		},
		{
			label: "Moon",
			loadout: probe,
			start: { x: 850, y: 837, heading: 0, speed: 150 },
		},
	],
};
