import { buildStats } from "@void-drift/mode-a";
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
    expect(accepts({ impulses: [{ tick: 0, backwardMomentum: 10 }] })).toBe(
      false,
    );
    expect(accepts({ impulses: [{ tick: 10, backwardMomentum: -1 }] })).toBe(
      false,
    );
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
  it("applies a staged backward impulse once and reconstructs it on seek", () => {
    const base = FlightSceneDocumentSchema.parse({
      ...STARTER_FLIGHT_SCENE,
      start: { x: 960, y: -360, rotation: 0 },
    });
    const momentum = buildStats(base.loadout).mass * 70;
    const kickedDoc = FlightSceneDocumentSchema.parse({
      ...base,
      impulses: [{ tick: 101, backwardMomentum: momentum }],
    });
    const reference = new FlightRun(base, "course");
    const kicked = new FlightRun(kickedDoc, "course");
    reference.seek(100);
    kicked.seek(100);
    expect(state(kicked)).toEqual(state(reference));
    reference.seek(101);
    kicked.seek(101);
    const angle = reference.sim.ship.rotation;
    const dx = kicked.sim.ship.vel.x - reference.sim.ship.vel.x;
    const dy = kicked.sim.ship.vel.y - reference.sim.ship.vel.y;
    expect(dx * Math.cos(angle) + dy * Math.sin(angle)).toBeCloseTo(-70, 8);
    expect(-dx * Math.sin(angle) + dy * Math.cos(angle)).toBeCloseTo(0, 8);
    expect(kicked.sim.ship.rotation).toBe(reference.sim.ship.rotation);
    const released = state(kicked);
    kicked.seek(101);
    expect(state(kicked)).toEqual(released);
    kicked.seek(180);
    kicked.seek(101);
    expect(state(kicked)).toEqual(released);
  });
});
