import { expect, it } from "vitest";
import { FlightRun } from "../../../lib/flight-scene/flight";
import { TOTAL_TICKS } from "../../../lib/instrument/burns";
import {
  CHARGE_EVERY,
  CHARGE_SCENE,
  chargeExperiment,
  DEFAULT_STAGING,
  FIRST_CHARGE,
} from "./fission-charge";
import {
  chargeLife,
  DEFAULT_LIGHT,
  dose,
  FissionLightSchema,
  FissionSparks,
  shellArrival,
  shellRadius,
} from "./fission-light";

function stagedRun() {
  const status = { text: "" };
  const run = new FlightRun(
    CHARGE_SCENE,
    "course",
    "none",
    [],
    {},
    chargeExperiment(DEFAULT_LIGHT, DEFAULT_STAGING, (text) => {
      status.text = text;
    }),
  );
  return { run, status };
}
const taken = (text: string, name: string) =>
  Number(new RegExp(`${name} \\d+ u · (\\d+)%`).exec(text)?.[1]);

it("holds the ship at rest outside the star's gravity field", () => {
  const { run } = stagedRun();
  const start = { ...run.sim.ship.pos };
  for (const tick of [0, FIRST_CHARGE, TOTAL_TICKS]) {
    run.seek(tick);
    const { pos } = run.sim.ship;
    expect(Math.hypot(pos.x - start.x, pos.y - start.y)).toBeLessThan(1e-6);
    expect(
      Math.hypot(pos.x - run.sim.star.pos.x, pos.y - run.sim.star.pos.y),
    ).toBeGreaterThan(run.sim.star.influenceRadius + run.sim.ship.radius);
  }
});

it("is dark before the first charge and gives nearer ships more of the flash", () => {
  const { run, status } = stagedRun();
  run.seek(FIRST_CHARGE - 1);
  expect(status.text).toContain("Dark");
  run.seek(CHARGE_SCENE.opening.tick);
  expect(status.text).toContain("Charge 1");
  const scout = taken(status.text, "Scout");
  const fighter = taken(status.text, "Fighter");
  const wasp = taken(status.text, "Wasp");
  expect(scout).toBeGreaterThan(fighter);
  expect(fighter).toBeGreaterThan(wasp);
  expect(wasp).toBeGreaterThan(0);
});

it("repeats the charge on its cadence and rebuilds the same state on rewind", () => {
  const { run, status } = stagedRun();
  const opening = CHARGE_SCENE.opening.tick;
  run.seek(opening);
  const first = status.text;
  run.seek(FIRST_CHARGE + CHARGE_EVERY * 2 + 3);
  expect(status.text).toContain("Charge 3");
  run.seek(opening);
  expect(status.text).toBe(first);
});

it("thins the flash with distance and stops it at the limit", () => {
  const { fatal, limit } = DEFAULT_LIGHT.reach;
  expect(dose(DEFAULT_LIGHT, fatal / 2)).toBe(1);
  expect(dose(DEFAULT_LIGHT, fatal)).toBe(1);
  expect(dose(DEFAULT_LIGHT, fatal * 2)).toBeCloseTo(0.25, 5);
  let previous = 1;
  for (let d = fatal; d < limit; d += 5) {
    expect(dose(DEFAULT_LIGHT, d)).toBeLessThanOrEqual(previous);
    previous = dose(DEFAULT_LIGHT, d);
  }
  expect(dose(DEFAULT_LIGHT, limit)).toBe(0);
  expect(dose(DEFAULT_LIGHT, limit * 2)).toBe(0);
});

it("moves the shell outward to the limit and reports when it arrives", () => {
  const { ticks } = DEFAULT_LIGHT.shell;
  const { limit } = DEFAULT_LIGHT.reach;
  let previous = -1;
  for (let age = 0; age <= ticks; age++) {
    const radius = shellRadius(DEFAULT_LIGHT, age);
    expect(radius).not.toBeNull();
    expect(radius as number).toBeGreaterThan(previous);
    previous = radius as number;
  }
  expect(previous).toBeCloseTo(limit, 6);
  expect(shellRadius(DEFAULT_LIGHT, ticks + 1)).toBeNull();
  const halfway = limit / 2;
  const arrival = shellArrival(DEFAULT_LIGHT, halfway) as number;
  expect(shellRadius(DEFAULT_LIGHT, arrival) as number).toBeGreaterThanOrEqual(
    halfway,
  );
  expect(shellRadius(DEFAULT_LIGHT, arrival - 1) as number).toBeLessThan(
    halfway,
  );
  expect(shellArrival(DEFAULT_LIGHT, limit * 2)).toBeNull();
  expect(chargeLife(DEFAULT_LIGHT)).toBeGreaterThanOrEqual(ticks);
});

it("keeps sparks bounded, divides a spark once and lets them all die", () => {
  const sparks = new FissionSparks();
  sparks.emit(0, 0, 0, Math.PI, 4, [100, 100], [1, 1], true);
  expect(sparks.count).toBe(4);
  for (let i = 0; i < 40; i++) sparks.step(1 / 60);
  expect(sparks.count).toBe(8);
  for (let i = 0; i < 40; i++) sparks.step(1 / 60);
  expect(sparks.count).toBe(0);
  sparks.emit(0, 0, 0, Math.PI, 1000, [10, 20], [1, 2], false);
  expect(sparks.count).toBe(FissionSparks.CAPACITY);
});

it("refuses a recipe with unknown fields", () => {
  expect(
    FissionLightSchema.safeParse({ ...DEFAULT_LIGHT, leaves: 5 }).success,
  ).toBe(false);
});
