import { expect, it } from "vitest";
import { FlightRun } from "../../../lib/flight-scene/flight";
import { BURN_IDS, TOTAL_TICKS } from "../../../lib/instrument/burns";
import { DEFAULT_FLIGHT } from "./flight-motion";
import { flightExperiment, LAUNCH_SCENE } from "./launch";

it("keeps every launch course outside the smallest G star's gravity field, including replay", () => {
  for (const burn of BURN_IDS) {
    const run = new FlightRun(
      LAUNCH_SCENE,
      burn,
      "none",
      [],
      {},
      flightExperiment(DEFAULT_FLIGHT),
    );
    expect(run.sim.star.radius).toBe(36);
    expect(run.sim.star.denomination).toBe("G4");
    expect(run.sim.planets).toHaveLength(0);
    for (let tick = 0; tick <= TOTAL_TICKS; tick++) {
      run.seek(tick);
      expect(
        Math.hypot(
          run.sim.ship.pos.x - run.sim.star.pos.x,
          run.sim.ship.pos.y - run.sim.star.pos.y,
        ),
      ).toBeGreaterThan(run.sim.star.influenceRadius + run.sim.ship.radius);
    }
    run.seek(60);
    expect(run.sim.star.radius).toBe(36);
    expect(run.sim.planets).toHaveLength(0);
  }
});

it("launches once per two-second cycle and rebuilds the sequence on rewind", () => {
  let status = "";
  const run = new FlightRun(
    LAUNCH_SCENE,
    "course",
    "none",
    [],
    {},
    flightExperiment(DEFAULT_FLIGHT, (text) => {
      status = text;
    }),
  );
  run.seek(59);
  expect(status).toContain("Pause · first launch");
  run.seek(60);
  expect(status).toContain("1 launched · Launch");
  run.seek(120);
  expect(status).toContain("1 launched · Pause");
  run.seek(180);
  expect(status).toContain("2 launched · Launch");
  run.seek(300);
  expect(status).toContain("3 launched · Launch");
  run.seek(60);
  expect(status).toContain("1 launched · Launch");
  run.seek(300);
  expect(status).toContain("3 launched · Launch");
});
