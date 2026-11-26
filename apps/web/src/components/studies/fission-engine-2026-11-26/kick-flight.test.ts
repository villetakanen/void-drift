import { STEP } from "@void-drift/mode-a";
import { expect, test } from "vitest";
import {
  FlightRun,
  FlightSceneDocumentSchema,
} from "../../../lib/flight-scene";
import { type BurnId, inputAt } from "../../../lib/instrument/burns";
import {
  ASSUMED_KICK,
  CEILING,
  INERT_FISSION,
  KICK_SCENE,
  type KickReadout,
  kickExperiment,
  kickSpeeds,
  READ_AT,
  referenceSpeeds,
  TODAY_KICK,
} from "./kick-flight";

const at = (speeds: number[]) =>
  READ_AT.map((seconds) => Math.round(speeds[Math.round(seconds / STEP)]));

/** Flies a burn under a kick rule and returns what the rule reported each tick. */
function fly(kick: unknown, burn: BurnId, ticks = 840) {
  const readouts: KickReadout[] = [];
  const run = new FlightRun(
    FlightSceneDocumentSchema.parse(KICK_SCENE),
    burn,
    "none",
    ["fusion"],
    INERT_FISSION,
    kickExperiment(kick, undefined, undefined, (r) => readouts.push({ ...r })),
  );
  for (let tick = 0; tick < ticks; tick++) run.advance();
  return { readouts, run };
}

test("the reference table is the game's engines alone on the Wasp", () => {
  expect(at(referenceSpeeds("service-ion"))).toEqual([
    12, 24, 58, 108, 188, 248, 350,
  ]);
  expect(at(referenceSpeeds("ion"))).toEqual([35, 67, 148, 244, 349, 394, 425]);
  expect(at(referenceSpeeds("heavy-ion"))).toEqual([
    52, 98, 205, 312, 398, 422, 431,
  ]);
  expect(at(referenceSpeeds("plasma"))).toEqual([
    0, 0, 117, 245, 365, 407, 428,
  ]);
  expect(at(referenceSpeeds("fusion"))).toEqual([
    59, 102, 124, 212, 318, 366, 425,
  ]);
});

test("today's kick flies as the game's fission engine does", () => {
  const game = referenceSpeeds("fusion");
  const rule = kickSpeeds(TODAY_KICK);
  for (const seconds of READ_AT) {
    const tick = Math.round(seconds / STEP);
    expect(Math.abs(rule[tick] - game[tick])).toBeLessThan(4);
  }
});

test("a kick starts on the tick the pads go down", () => {
  const { readouts } = fly(TODAY_KICK, "course", 2);
  expect(readouts[0].kicks).toBe(1);
  expect(readouts[0].speed).toBeGreaterThan(0);
});

test("one per press gives one kick for each time both pads go down", () => {
  let presses = 0;
  let was = false;
  for (let tick = 0; tick < 840; tick++) {
    const { left, right } = inputAt("course", tick);
    if (left && right && !was) presses++;
    was = left && right;
  }
  const { readouts } = fly(
    { ...TODAY_KICK, holding: "One per press" },
    "course",
  );
  expect(readouts.at(-1)?.kicks).toBe(presses);
  const held = fly(TODAY_KICK, "course").readouts.at(-1)?.kicks ?? 0;
  expect(held).toBeGreaterThan(presses);
});

test("a one-tick kick is delivered at once, less the taper", () => {
  const { readouts } = fly({ ...TODAY_KICK, ticks: 1, gain: 150 }, "turn", 3);
  // All of it arrives on the first tick; nothing is left to cut short.
  expect(readouts[0].lastGain).toBeDefined();
  expect(readouts[2].speed).toBeCloseTo(readouts[0].speed, 2);
  // The game's taper acts within the tick, so even from rest it lands short.
  expect(readouts[0].lastGain).toBeGreaterThan(125);
  expect(readouts[0].lastGain).toBeLessThan(140);
});

test("holding fire keeps every kick whole and under the ceiling", () => {
  const kick = { ...TODAY_KICK, ceiling: "Holds fire", ticks: 1, gain: 150 };
  const { readouts } = fly(kick, "turn", 360);
  expect(Math.max(...readouts.map((r) => r.speed))).toBeLessThanOrEqual(
    CEILING + 0.5,
  );
  // Two whole kicks fit under 437 u/s; a third would not.
  expect(readouts.at(-1)?.kicks).toBe(2);
  expect(readouts.at(-1)?.lastGain).toBeCloseTo(150, 0);
});

test("overshooting passes the ceiling and bleeds back towards it", () => {
  const kick = { ...TODAY_KICK, ceiling: "Overshoots", ticks: 1, gain: 150 };
  const { readouts } = fly(kick, "turn", 540);
  // Held for 6 s: every kick is whole, so speed passes the ceiling.
  const peak = Math.max(...readouts.slice(0, 360).map((r) => r.speed));
  expect(peak).toBeGreaterThan(CEILING + 100);
  // Pads up from 8 s to 9 s: the excess halves every 0.5 s.
  const coast = readouts[539].speed - CEILING;
  const before = readouts[479].speed - CEILING;
  expect(coast / before).toBeCloseTo(0.25, 1);
});

test("the assumed kick reaches 390 u/s in five kicks and then holds fire", () => {
  expect(at(kickSpeeds(ASSUMED_KICK))).toEqual([
    78, 78, 156, 312, 390, 390, 390,
  ]);
  const { readouts } = fly(ASSUMED_KICK, "turn", 360);
  expect(readouts.at(-1)?.kicks).toBe(5);
  // The fifth kick lands 1.2 s after the pads go down.
  expect(readouts.findIndex((r) => r.kicks === 5)).toBe(72);
});
