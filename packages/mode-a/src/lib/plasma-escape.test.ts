import { expect, it } from "vitest";
import { TOTAL_TICKS } from "../../../../apps/web/src/components/studies/movement-bench";
import {
  ESCAPE_HZ,
  START_SPEED,
  simulateEscape,
  simulateEscapeSequence,
} from "../../../../apps/web/src/components/studies/plasma-escape";
import { ionCeiling } from "./schemas/ion";

it("keeps the historical escape comparison finite and separate from production flight", () => {
  const runs = simulateEscape();
  expect(runs.length).toBeGreaterThan(0);
  expect(
    runs.every((run) =>
      run.samples.every((sample) => Number.isFinite(sample.speed)),
    ),
  ).toBe(true);
});
it("isolates adjustable force, preserves delay and bounds diminishing speed returns", () => {
  const low = simulateEscape({ strength: 1 }),
    high = simulateEscape({ strength: 10 });
  for (const i of [0, 1, 2]) expect(high[i]).toEqual(low[i]);
  expect(high[3].mass).toBe(low[3].mass);
  expect(high[3].samples[24].speed).toBe(START_SPEED);
  expect(high[3].samples[25].speed).toBeGreaterThan(START_SPEED);
  expect(high[3].samples[6 * ESCAPE_HZ].distance).toBeGreaterThan(
    low[3].samples[6 * ESCAPE_HZ].distance,
  );
  expect(
    high[3].samples.every(
      (p) => p.speed < ionCeiling(Infinity) && p.ceiling < ionCeiling(Infinity),
    ),
  ).toBe(true);
  expect(() => simulateEscape({ strength: 10.1 })).toThrow();
  expect(() => simulateEscape({ strength: 0 })).toThrow();
});

it("keeps historical sequence examples finite", () => {
  const run = simulateEscapeSequence()[0];
  expect(run.samples.length).toBe(TOTAL_TICKS * 4 + 1);
  expect(
    run.samples.every(
      (sample) =>
        Number.isFinite(sample.x) &&
        Number.isFinite(sample.y) &&
        Number.isFinite(sample.speed),
    ),
  ).toBe(true);
  expect(Math.abs(run.samples[14 * ESCAPE_HZ].y)).toBeGreaterThan(1);
  const low = simulateEscapeSequence({ strength: 1 })[3],
    high = simulateEscapeSequence({ strength: 10 })[3];
  expect(high.samples[24]).toEqual(low.samples[24]);
  expect(high.samples[25].speed).toBeGreaterThan(low.samples[25].speed);
  expect(
    high.samples.every(
      (p) => Number.isFinite(p.x) && p.speed <= ionCeiling(Infinity),
    ),
  ).toBe(true);
});
