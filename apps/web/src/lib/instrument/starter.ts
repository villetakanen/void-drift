// The Lab page's starting document: the three Fighters compared in the
// lab-instrument study (02.7): ion aft, plasma aft, and plasma with more thrust.
const fighter = (aft: [string | null, string | null]) => ({
	version: 2,
	chassis: "balanced",
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
