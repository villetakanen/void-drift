import { defaultLoadout, PARTS } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { FlightSceneDocumentSchema } from "./config";
import { FlightRun } from "./flight";
import { mainEngines, studyLightState } from "./light";

// A Wasp with a plasma main engine: one delayed engine beside ion stabilizers.
const doc = FlightSceneDocumentSchema.parse({
  loadout: { ...defaultLoadout("wasp"), side: "plasma" },
});
const chargeTicks = Math.round(PARTS.plasma.chargeSeconds * 60);
const engine = (run: FlightRun) =>
  studyLightState(run.sim, doc.loadout, run.tick).engines[0];
const pose = (run: FlightRun) => ({
  x: run.sim.ship.pos.x,
  y: run.sim.ship.pos.y,
  rotation: run.sim.ship.rotation,
  vx: run.sim.ship.vel.x,
  vy: run.sim.ship.vel.y,
  power: run.sim.state.resources.power,
});

describe("study light", () => {
  it("names the main engines in the simulation's emitter order", () => {
    expect(mainEngines(doc.loadout)).toEqual([
      { index: 0, key: "left", part: "plasma" },
    ]);
    const scout = mainEngines({
      ...defaultLoadout("scout"),
      side: "plasma",
    });
    expect(scout.map((e) => e.key).slice(0, 2)).toEqual(["left", "right"]);
  });
  it("reports a charge that rises with no output, then output at full charge", () => {
    const run = new FlightRun(doc, "course");
    let previous = 0;
    for (let tick = 1; tick < chargeTicks; tick++) {
      run.seek(tick);
      const state = engine(run);
      expect(state.part).toBe("plasma");
      expect(state.output).toBe(0);
      expect(state.charge).toBeGreaterThan(previous);
      expect(state.charge).toBeLessThan(1);
      previous = state.charge;
    }
    run.seek(chargeTicks + 6);
    expect(engine(run).charge).toBe(1);
    expect(engine(run).output).toBeGreaterThan(0);
  });
  it("leaves a replaced engine's plume dark and the others lit", () => {
    const plain = new FlightRun(doc, "course");
    const replaced = new FlightRun(doc, "course", undefined, ["plasma"]);
    plain.seek(chargeTicks + 6);
    replaced.seek(chargeTicks + 6);
    expect(plain.sim.plume.activeCount).toBeGreaterThan(0);
    expect(replaced.sim.plume.activeCount).toBe(
      plain.sim.plume.activeCount - 1,
    );
    // The study still sees the output the game would have painted.
    expect(engine(replaced).output).toBe(engine(plain).output);
  });
  it("does not change the flight", () => {
    const plain = new FlightRun(doc, "weave");
    const replaced = new FlightRun(doc, "weave", undefined, ["plasma"]);
    plain.seek(600);
    replaced.seek(600);
    expect(pose(replaced)).toEqual(pose(plain));
  });
  it("replaces nothing for a part the loadout does not carry", () => {
    const plain = new FlightRun(doc, "course");
    const other = new FlightRun(doc, "course", undefined, ["fusion"]);
    plain.seek(chargeTicks + 6);
    other.seek(chargeTicks + 6);
    expect(other.sim.plume.activeCount).toBe(plain.sim.plume.activeCount);
  });
});

describe("part tuning", () => {
  const firstThrust = (run: FlightRun) => {
    for (let tick = 1; tick <= 120; tick++) {
      run.seek(tick);
      if (engine(run).output > 0) return tick;
    }
    return Number.POSITIVE_INFINITY;
  };
  it("moves the release with the tuned charge and leaves the game's parts alone", () => {
    const game = PARTS.plasma.chargeSeconds;
    const plain = firstThrust(new FlightRun(doc, "course"));
    const short = firstThrust(
      new FlightRun(doc, "course", undefined, [], {
        plasma: { chargeSeconds: game / 3 },
      }),
    );
    const long = firstThrust(
      new FlightRun(doc, "course", undefined, [], {
        plasma: { chargeSeconds: game * 1.4 },
      }),
    );
    expect(short).toBeLessThan(plain);
    expect(long).toBeGreaterThan(plain);
    expect(PARTS.plasma.chargeSeconds).toBe(game);
  });
  it("reports the tuned charge to a study's light", () => {
    const run = new FlightRun(doc, "course", undefined, [], {
      plasma: { chargeSeconds: 0.3 },
    });
    run.seek(9);
    expect(engine(run).chargeSeconds).toBe(0.3);
    expect(engine(run).charge).toBeCloseTo(0.5, 1);
  });
  it("flies the game's own parts when nothing is tuned", () => {
    expect(new FlightRun(doc, "course").sim.parts).toBe(PARTS);
  });
});
