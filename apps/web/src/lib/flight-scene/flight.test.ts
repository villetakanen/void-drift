import { buildStats, Simulation, stockSettings } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { ROCK_ATMOSPHERE_SCENE } from "../../components/studies/rock-atmospheres/fixture";
import { FlightSceneDocumentSchema } from "./config";
import { FlightRun } from "./flight";
import { PRACTICE_FLIGHT_SCENE, STARTER_FLIGHT_SCENE } from "./starter";

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
  it("opens and reconstructs the complete production Practice system", () => {
    const practice = FlightSceneDocumentSchema.parse(PRACTICE_FLIGHT_SCENE);
    const run = new FlightRun(practice, "course");
    const reference = new Simulation({
      ...stockSettings(practice.loadout.chassis),
      mode: "practice",
      loadout: practice.loadout,
    });
    expect(run.sim.planets).toEqual(reference.planets);
    run.seek(180);
    run.seek(0);
    expect(run.sim.planets).toEqual(reference.planets);
  });
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

describe("staged planet replay", () => {
  const planetDoc = ROCK_ATMOSPHERE_SCENE;
  it("reconstructs drag on backward seek without applying it again on inspection", () => {
    const run = new FlightRun(planetDoc, "course");
    run.seek(180);
    const end = state(run);
    run.seek(180);
    expect(state(run)).toEqual(end);
    run.seek(15);
    run.seek(180);
    expect(state(run)).toEqual(end);
    const bareDoc = FlightSceneDocumentSchema.parse({
      ...planetDoc,
      planet: { reference: "practice-venus" },
    });
    const bare = new FlightRun(bareDoc, "course");
    bare.seek(180);
    expect(
      Math.hypot(
        run.sim.ship.vel.x - bare.sim.ship.vel.x,
        run.sim.ship.vel.y - bare.sim.ship.vel.y,
      ),
    ).toBeGreaterThan(1);
  });
  it("refuses conflicting staging instead of silently dropping targets", () => {
    for (const patch of [
      { targets: [{ x: 0, y: 0 }] },
      { held: { distance: 140 } },
    ])
      expect(
        FlightSceneDocumentSchema.safeParse({ ...planetDoc, ...patch }).success,
      ).toBe(false);
  });
});
