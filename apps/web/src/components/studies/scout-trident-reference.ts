/** Exact accepted 02.5 / 06 hull; embedded mounts preserve the original gallery. */
export const TRIDENT_STUDY = {
	name: "06 / Integrated trident",
	idea: "Three rearward points grow from one hull: two knife wings and a central keel. The aft fitting lives on that continuous keel, without a diamond or neck.",
	cockpit: -21,
	deck: -7,
	aft: 11,
	side: 0,
	arm: 11,
	angle: 26,
	planes: [
		["0,-23 21,24 11,14 8,4 5,9 5,20 0,29 -5,20 -5,9 -8,4 -11,14 -21,24", 3],
		["0,-23 -21,24 -11,14 -8,4 0,-4", 1],
		["0,-23 21,24 11,14 8,4 0,-4", 4],
		["0,-23 -4,-5 -5,20 0,29", 0],
		["0,-23 4,-5 5,20 0,29", 5],
		["-21,24 -6,-9 -11,14", 2],
	],
} as const;

/** Accepted screenshot layout; deck/aft values are reconstructed implementation starting points. */
export const TRIDENT_ACCEPTED_PLACEMENT = {
	deck: -1,
	aft: 11.5,
	side: -10.5,
	arm: 6,
	angle: 49,
	deckX: 0,
	aftX: 0,
};
