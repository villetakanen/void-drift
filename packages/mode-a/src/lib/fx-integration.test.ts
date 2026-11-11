import { expect, it } from "vitest";
import { FxBench } from "./fx-bench";

it("effect settings leave an armed mixed workload's simulations identical", () => {
  const a = new FxBench(),
    b = new FxBench();
  a.weapons = b.weapons = true;
  a.reset();
  b.reset();
  b.enabled = false;
  b.overload = true;
  for (let i = 0; i < 470; i++) {
    a.step();
    b.step();
  }
  expect(
    a.ships.reduce(
      (sum, sim) =>
        sum + (sim.salvage?.shotsFired ?? 0) + (sim.salvage?.laserPulses ?? 0),
      0,
    ),
  ).toBeGreaterThan(0);
  for (let i = 0; i < a.ships.length; i++) {
    expect(a.ships[i].ship).toEqual(b.ships[i].ship);
    expect(a.ships[i].salvage).toEqual(b.ships[i].salvage);
    expect(a.ships[i].state).toEqual(b.ships[i].state);
  }
});
