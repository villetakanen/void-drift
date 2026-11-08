import { INPUT_SEQUENCE, TOTAL_TICKS } from "./movement-bench";

// The instrument's fixed set of 14-second input programs. Studies pick one by
// id; nobody writes inputs. Durations are whole ticks at 60 Hz.
export type Input = "LR" | "L" | "R" | "–";
export type Segment = { input: Input; ticks: number };
export type BurnId = "course" | "turn" | "weave";

const s = (seconds: number) => Math.round(seconds * 60);

function course(): Segment[] {
  return INPUT_SEQUENCE.map((input) => ({ input, ticks: 60 }));
}

function turn(): Segment[] {
  return [
    { input: "LR", ticks: s(6) },
    { input: "L", ticks: s(2) },
    { input: "–", ticks: s(1) },
    { input: "LR", ticks: s(5) },
  ];
}

/** LR, L, R repeating; each round's step grows by 0.3 s; cut at 14 s. */
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
};
export const BURN_IDS = Object.keys(BURNS) as BurnId[];

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
