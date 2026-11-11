import { ION_CANNON } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import { FlightSceneDocumentSchema } from "./config";
import { FlightRun, HELD_ID, targetModes } from "./flight";
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
const fragments = (run: FlightRun, group: number) =>
  (run.sim.salvage?.bodies ?? []).filter(
    (b) => b.kind === "fragment" && b.group === group,
  );

describe("flight scene document", () => {
  it("accepts the starter and fills in defaults", () => {
    const sparse = FlightSceneDocumentSchema.parse({
      loadout: STARTER_FLIGHT_SCENE.loadout,
      held: {},
    });
    expect(sparse.targets).toEqual([]);
    expect(sparse.held?.distance).toBeGreaterThan(0);
    expect(sparse.follow.near).toBeLessThan(sparse.follow.far);
    expect(sparse.opening.view).toBe("follow");
  });
  it("refuses invalid documents", () => {
    const accepts = (patch: object) =>
      FlightSceneDocumentSchema.safeParse({ ...STARTER_FLIGHT_SCENE, ...patch })
        .success;
    expect(accepts({})).toBe(true);
    expect(accepts({ loadout: { chassis: "nope" } })).toBe(false);
    expect(accepts({ held: { distance: -1 } })).toBe(false);
    expect(accepts({ held: { shardLife: 0 } })).toBe(false);
    expect(accepts({ follow: { near: 4, far: 2 } })).toBe(false);
    expect(accepts({ opening: { burn: "nope" } })).toBe(false);
    expect(accepts({ opening: { tick: 99999 } })).toBe(false);
    expect(accepts({ opening: { tick: -1 } })).toBe(false);
    expect(accepts({ targets: [{ x: Number.NaN, y: 0 }] })).toBe(false);
    expect(accepts({ extra: 1 })).toBe(false);
    expect(
      accepts({ targets: Array.from({ length: 17 }, () => ({ x: 0, y: 0 })) }),
    ).toBe(false);
    expect(accepts({ start: { x: 0, y: 0 } })).toBe(false);
  });
  it("offers only the target modes the document supports", () => {
    expect(targetModes(doc)).toEqual(["none", "placed", "held"]);
    expect(targetModes({ ...doc, targets: [] })).toEqual(["none", "held"]);
    expect(targetModes({ ...doc, held: undefined })).toEqual([
      "none",
      "placed",
    ]);
  });
});

describe("flight run", () => {
  it("flies to the same instant to the same state, every time", () => {
    const a = new FlightRun(doc, "course");
    const b = new FlightRun(doc, "course");
    a.seek(500);
    b.seek(500);
    expect(a.tick).toBe(500);
    expect(state(a)).toEqual(state(b));
  });
  it("makes a backward jump equal to a fresh flight", () => {
    const jumped = new FlightRun(doc, "weave");
    jumped.seek(700);
    jumped.seek(300);
    const fresh = new FlightRun(doc, "weave");
    fresh.seek(300);
    expect(jumped.tick).toBe(300);
    expect(state(jumped)).toEqual(state(fresh));
  });
  it("keeps a live held wreck within the cannon's reach across a burn", () => {
    const run = new FlightRun(doc, "course", "held");
    let seen = 0;
    run.seek(Number.POSITIVE_INFINITY, (wrapped) => {
      // Across the arena's edge the ship and the wreck are a torus apart.
      if (wrapped) return;
      const held = run.sim.salvage?.bodies.find(
        (b) => b.id === HELD_ID && b.kind === "wreck",
      );
      if (!held) return;
      seen++;
      const { x, y } = run.sim.ship.pos;
      expect(Math.hypot(held.x - x, held.y - y)).toBeLessThanOrEqual(
        ION_CANNON.range,
      );
    });
    expect(seen).toBeGreaterThan(0);
  });
  it("clears held shards after their lifetime", () => {
    const run = new FlightRun(doc, "course", "held");
    const limit = Math.ceil((doc.held?.shardLife ?? 0) * 60) + 2;
    const firstSeen = new Map<number, number>();
    run.seek(Number.POSITIVE_INFINITY, () => {
      for (const shard of fragments(run, HELD_ID)) {
        if (!firstSeen.has(shard.id)) firstSeen.set(shard.id, run.tick);
        expect(run.tick - (firstSeen.get(shard.id) ?? 0)).toBeLessThanOrEqual(
          limit,
        );
      }
    });
    expect(firstSeen.size).toBeGreaterThan(0);
  });
  it("keeps a placed wreck's shards", () => {
    const run = new FlightRun(doc, "course", "placed");
    run.seek(Number.POSITIVE_INFINITY);
    const shards = (run.sim.salvage?.bodies ?? []).filter(
      (b) => b.kind === "fragment" && b.group > HELD_ID,
    );
    expect(shards.length).toBeGreaterThan(0);
    for (const shard of shards) expect(shard.life).toBeUndefined();
  });
});
