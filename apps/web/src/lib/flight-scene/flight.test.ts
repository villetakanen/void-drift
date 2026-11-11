import { describe, expect, it } from "vitest";
import { FlightSceneDocumentSchema } from "./config";
import { FlightRun } from "./flight";
import { STARTER_FLIGHT_SCENE } from "./starter";

const doc = FlightSceneDocumentSchema.parse(STARTER_FLIGHT_SCENE);
// Everything a flight has made at an instant: the ship's pose and velocity, the
// simulation's clock and the salvage bodies with their ids and positions.
const state = (run: FlightRun) => ({
  x: run.sim.ship.pos.x,
  y: run.sim.ship.pos.y,
  rotation: run.sim.ship.rotation,
  vx: run.sim.ship.vel.x,
  vy: run.sim.ship.vel.y,
  ticks: run.sim.ticks,
  bodies: (run.sim.salvage?.bodies ?? []).map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
  })),
});

describe("flight scene document", () => {
  it("refuses invalid documents", () => {
    const accepts = (patch: object) =>
      FlightSceneDocumentSchema.safeParse({ ...STARTER_FLIGHT_SCENE, ...patch })
        .success;
    expect(accepts({})).toBe(true);
    expect(accepts({ extra: 1 })).toBe(false);
    expect(accepts({ opening: { tick: 99999 } })).toBe(false);
    expect(
      accepts({
        targets: Array.from({ length: 10000 }, () => ({ x: 0, y: 0 })),
      }),
    ).toBe(false);
    expect(accepts({ start: { x: 0, y: 0 } })).toBe(false);
  });
});

describe("flight run", () => {
  it("makes a backward jump equal to a fresh flight", () => {
    const jumped = new FlightRun(doc, "weave");
    jumped.seek(700);
    jumped.seek(300);
    const fresh = new FlightRun(doc, "weave");
    fresh.seek(300);
    expect(state(jumped)).toEqual(state(fresh));
  });
});
