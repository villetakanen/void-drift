/** Accepted Lance with original 26° engine angle, in local units (+x forward). */
export const FIGHTER = {
	hull: [
		[48, 0],
		[-18, -20],
		[-25, -17],
		[-19, 0],
		[-25, 17],
		[-18, 20],
	],
	facets: ["#c8f4f0", "#83c7d0", "#437e99", "#264d6b", "#365d79", "#6193a9"],
	ridge: [
		[38, 0],
		[-15, -4],
		[-21, 0],
		[-15, 4],
	],
	cockpit: [
		[26, 0],
		[20, -3],
		[11, -3],
		[9, 0],
		[11, 3],
		[20, 3],
	],
	sideX: -12,
	arm: 15,
	// Direct angular response tuning, independent of forward thrust.
	turnResponse: 2.5,
	// Owner retained the original production angle after flight review.
	angle: (26 * Math.PI) / 180,
	length: 48,
	width: 20,
} as const;
