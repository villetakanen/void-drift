// The Lab instrument's fixed set of 14-second input programs (study
// lab-instrument-2026-11-01, 02.6). A configuration names one by id; nobody
// writes inputs. Durations are whole ticks at 60 Hz.
export const TICK_RATE = 60;
export const DT = 1 / TICK_RATE;
export const SECONDS = 14;
export const TOTAL_TICKS = SECONDS * TICK_RATE;

export type Input = "LR" | "L" | "R" | "–";
export type Segment = { input: Input; ticks: number };
/** Version 1 documents' burns. */
export const BURN_IDS = ["course", "turn", "weave"] as const;
/** Version 2 documents add coast: no input, for pure gravity paths. */
export const V2_BURN_IDS = [...BURN_IDS, "coast"] as const;
export type BurnId = (typeof V2_BURN_IDS)[number];

const s = (seconds: number) => Math.round(seconds * TICK_RATE);

/** B1: burns, coasts, single-engine turns and restarts, one input per second. */
function course(): Segment[] {
	const program: Input[] = [
		"LR",
		"LR",
		"–",
		"L",
		"–",
		"LR",
		"–",
		"R",
		"–",
		"R",
		"–",
		"LR",
		"LR",
		"LR",
	];
	return program.map((input) => ({ input, ticks: TICK_RATE }));
}

/** B2: 6 s on both engines, 2 s left, 1 s coast, both to the end. */
function turn(): Segment[] {
	return [
		{ input: "LR", ticks: s(6) },
		{ input: "L", ticks: s(2) },
		{ input: "–", ticks: s(1) },
		{ input: "LR", ticks: s(5) },
	];
}

/** B3: LR, L, R repeating; each round's step grows by 0.3 s; cut at 14 s. */
function weave(): Segment[] {
	const out: Segment[] = [];
	let used = 0;
	for (let round = 1; used < TOTAL_TICKS; round++) {
		for (const input of ["LR", "L", "R"] as const) {
			const ticks = Math.min(s(0.3 * round), TOTAL_TICKS - used);
			if (ticks <= 0) break;
			out.push({ input, ticks });
			used += ticks;
		}
	}
	return out;
}

/** label is what the switcher shows; name describes the program. */
export const BURNS: Record<
	BurnId,
	{ label: string; name: string; segments: Segment[] }
> = {
	course: { label: "B1", name: "Course", segments: course() },
	turn: { label: "B2", name: "Turn", segments: turn() },
	weave: { label: "B3", name: "Weave", segments: weave() },
	coast: {
		label: "B0",
		name: "Coast",
		segments: [{ input: "–", ticks: TOTAL_TICKS }],
	},
};

/** Engine state at a tick, for the calculation. */
export function inputAt(burn: BurnId, tick: number) {
	let t = Math.max(0, Math.min(tick, TOTAL_TICKS - 1));
	for (const seg of BURNS[burn].segments) {
		if (t < seg.ticks)
			return {
				left: seg.input === "LR" || seg.input === "L",
				right: seg.input === "LR" || seg.input === "R",
			};
		t -= seg.ticks;
	}
	return { left: false, right: false };
}
