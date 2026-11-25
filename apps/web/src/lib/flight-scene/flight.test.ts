import { getPlanetInfluenceRadius } from "@void-drift/core";
import { buildStats, Simulation, stockSettings } from "@void-drift/mode-a";
import { describe, expect, it, vi } from "vitest";
import { ROCK_ATMOSPHERE_SCENE } from "../../components/studies/rock-atmospheres/fixture";
import { TOTAL_TICKS } from "../instrument/burns";
import { FlightSceneDocumentSchema } from "./config";
import { DERELICT_INSTRUMENT_SCENE } from "./derelict-fixture";
import { FlightRun } from "./flight";
import { PRACTICE_FLIGHT_SCENE, STARTER_FLIGHT_SCENE } from "./starter";

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected value to be present");
  return value;
}

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
    expect(accepts({ follow: { near: 1.6, far: 4 } })).toBe(false);
    for (const view of ["game", "follow", "follow-far"])
      expect(accepts({ opening: { view } })).toBe(false);
    for (const view of ["auto", "1x", "2x", "4x", "8x"])
      expect(accepts({ opening: { view } })).toBe(true);
    expect(
      FlightSceneDocumentSchema.parse({ loadout: doc.loadout }).opening.view,
    ).toBe("auto");
    expect(accepts({ wreckSpin: -1 })).toBe(false);
    expect(accepts({ wreckSpin: 2 })).toBe(true);
    expect(accepts({ wreckSpin: 2.1 })).toBe(false);
    expect(accepts({ wreckSpin: null })).toBe(false);
    expect(accepts({ wreckSpin: Infinity })).toBe(false);
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
  it("stages default and zero wreck spin and replays rotation", () => {
    for (const spin of [undefined, 0]) {
      const staged = FlightSceneDocumentSchema.parse({
        ...STARTER_FLIGHT_SCENE,
        wreckSpin: spin,
      });
      expect(staged.wreckSpin).toBe(spin ?? 0.3);
      const run = new FlightRun(staged, "course", "placed");
      const rotation = () =>
        required(required(run.sim.salvage).bodies.find((b) => b.id === 101))
          .rotation;
      run.seek(10);
      const first = rotation();
      if (spin === 0) expect(first).toBe(0);
      else expect(first).toBeGreaterThan(0);
      run.seek(20);
      run.seek(10);
      expect(rotation()).toBe(first);
    }
  });
  it("takes the shipped derelict encounter through breakup and replays it", () => {
    const encounter = FlightSceneDocumentSchema.parse(
      DERELICT_INSTRUMENT_SCENE,
    );
    const run = new FlightRun(encounter, "course", "placed");
    const step = vi.spyOn(run.sim, "step");
    const wreck = () =>
      required(
        required(run.sim.salvage).bodies.find((b) => b.kind === "wreck"),
      );
    expect(run.sim.ship.vel).toMatchObject({ x: 0, y: 0 });
    expect(wreck()).toMatchObject({ vx: 0, vy: 0 });
    for (const point of [run.sim.ship.pos, wreck()]) {
      expect(
        Math.hypot(point.x - run.sim.star.pos.x, point.y - run.sim.star.pos.y),
      ).toBeGreaterThan(run.sim.star.influenceRadius);
      for (const planet of run.sim.planets)
        expect(
          Math.hypot(point.x - planet.pos.x, point.y - planet.pos.y),
        ).toBeGreaterThan(getPlanetInfluenceRadius(planet));
    }
    const initialHull = required(run.targetHull(0)).current;
    let shedding = false,
      destroyed = false,
      cell = false,
      damaged = false;
    let snapshot: unknown;
    let middle = 0;
    for (let tick = 1; tick <= TOTAL_TICKS; tick++) {
      run.seek(tick);
      const bodies = run.sim.salvage?.bodies ?? [];
      expect(step).toHaveBeenLastCalledWith(
        expect.objectContaining({ leftThruster: false, rightThruster: false }),
      );
      const hull = run.targetHull(0);
      const intact = hull !== null && hull.current > 0;
      damaged ||= intact && hull.current < initialHull;
      if (
        !middle &&
        intact &&
        bodies.some((body) => body.kind === "fragment")
      ) {
        shedding = true;
        middle = tick;
        snapshot = structuredClone({
          bodies,
          hull,
          ship: run.sim.ship,
          discharges: required(run.sim.salvage).pointDefenceDischarges,
        });
      }
      destroyed ||= !intact;
      cell ||= bodies.some((body) => body.kind === "cell");
    }
    run.seek(middle);
    const fragment = required(
      required(run.sim.salvage).bodies.find((body) => body.kind === "fragment"),
    );
    const position = { x: fragment.x, y: fragment.y };
    run.seek(middle + 1);
    const moved = required(
      required(run.sim.salvage).bodies.find((body) => body.id === fragment.id),
    );
    expect(
      Math.hypot(moved.x - position.x, moved.y - position.y),
    ).toBeGreaterThan(0);
    run.seek(TOTAL_TICKS);
    expect(required(run.sim.salvage).pointDefenceDischarges).toBeGreaterThan(0);
    expect({ shedding, destroyed, cell, damaged }).toEqual({
      shedding: true,
      destroyed: true,
      cell: true,
      damaged: true,
    });
    run.seek(middle);
    expect({
      bodies: run.sim.salvage?.bodies ?? [],
      hull: run.targetHull(0),
      ship: run.sim.ship,
      discharges: required(run.sim.salvage).pointDefenceDischarges,
    }).toEqual(snapshot);
  });
  it("damages a placed derelict with one Wasp ion point defence", () => {
    const encounter = FlightSceneDocumentSchema.parse({
      ...STARTER_FLIGHT_SCENE,
      loadout: {
        ...STARTER_FLIGHT_SCENE.loadout,
        hull: [
          "ion-point-defence",
          ...STARTER_FLIGHT_SCENE.loadout.hull.slice(1),
        ],
      },
      targets: [{ x: 460, y: 440 }],
      encounter: { restTicks: 120 },
    });
    const run = new FlightRun(encounter, "course", "placed");
    const initial = required(run.targetHull(0));
    run.seek(120);
    expect(required(run.targetHull(0)).current).toBeLessThan(initial.current);
  });
  it("exposes placed wreck hull and reconstructs it on backward seek", () => {
    const run = new FlightRun(doc, "course", "placed");
    const initial = run.targetHull(0);
    expect(initial?.current).toBe(initial?.maximum);
    expect(run.targetHull(-1)).toBeNull();
    run.seek(100);
    const selected = run.targetHull(0);
    run.seek(200);
    run.seek(100);
    expect(run.targetHull(0)).toEqual(selected);
  });
  it("replays a staged firing encounter with an initial thruster rest", () => {
    const encounter = FlightSceneDocumentSchema.parse({
      ...STARTER_FLIGHT_SCENE,
      encounter: { restTicks: 120 },
    });
    const run = new FlightRun(encounter, "course");
    run.seek(300);
    const expected = state(run);
    const hull = run.targetHull(0);
    run.seek(30);
    run.seek(300);
    expect(state(run)).toEqual(expected);
    expect(run.targetHull(0)).toEqual(hull);
  });
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
