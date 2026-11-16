import { describe, expect, it } from "vitest";
import {
  FlightRun,
  FlightSceneDocumentSchema,
} from "../../../lib/flight-scene";
import { config, makeExperiment, type PlasmaRun } from "./round023";

function run(
  burn: "course" | "turn" | "weave" = "course",
  miss = false,
  options: unknown = {},
) {
  return new FlightRun(
    FlightSceneDocumentSchema.parse({
      ...config,
      start: { ...config.start, rotation: -Math.PI / 2 - (miss ? 0.34 : 0) },
    }),
    burn,
    "placed",
    [],
    {},
    makeExperiment(options),
  );
}
const evidence = (r: FlightRun) => (r.experimentRun as PlasmaRun).evidence;
const snapshot = (r: FlightRun) =>
  JSON.stringify({
    ship: r.sim.ship,
    resources: r.sim.state.resources,
    bodies: r.sim.salvage?.bodies,
    evidence: evidence(r),
  });
describe("02.3 mechanism", () => {
  it("pays before readiness and requires an actual target, while both outcomes vent", () => {
    for (const miss of [false, true]) {
      const r = run("course", miss);
      r.seek(30);
      const e = evidence(r);
      expect(e.powerBefore - e.powerAfter).toBeCloseTo(18);
      expect(e.strikeTick).toBe(-1);
      r.seek(83);
      expect(e.strikeTick).toBe(-1);
      r.seek(220);
      expect(e.vents).toEqual([42, 69, 102, 132]);
      expect(e.strikeTick).toBe(miss ? -1 : 84);
    }
    const empty = new FlightRun(
      config,
      "course",
      "none",
      [],
      {},
      makeExperiment(),
    );
    empty.seek(220);
    expect(evidence(empty).strikeTick).toBe(-1);
    expect(evidence(empty).vents).toHaveLength(4);
  });
  it("does not charge or vent without enough energy", () => {
    const r = run();
    r.seek(29);
    r.sim.state.resources.power = 17;
    r.seek(220);
    expect(evidence(r).spent).toBe(0);
    expect(evidence(r).vents).toHaveLength(0);
  });
});
describe("02.3 contact and damage", () => {
  it("damages wrecks and subsequently released fragments through production breakup", () => {
    const r = run();
    r.seek(220);
    const e = evidence(r);
    const wreck = e.contacts.filter(
      (c) => c.source === "eruption" && c.kind === "wreck",
    );
    const debris = e.contacts.filter(
      (c) => c.source === "eruption" && c.kind === "fragment",
    );
    expect(wreck.reduce((n, c) => n + c.damage, 0)).toBe(85);
    expect(debris.length).toBeGreaterThan(0);
    expect(debris.some((c) => c.tick > wreck[0].tick)).toBe(true);
    expect(
      e.contacts.some((c) => c.source === "exhaust" && c.kind === "wreck"),
    ).toBe(true);
    expect(e.vents.some((t) => t > e.strikeTick + 16)).toBe(true);
    expect(e.maxParcels).toBeLessThanOrEqual(128);
  });
  it("missed primary can still damage debris with cooling exhaust", () => {
    const r = run("course", true);
    r.seek(220);
    expect(
      evidence(r).contacts.some(
        (c) => c.source === "exhaust" && c.kind === "fragment",
      ),
    ).toBe(true);
    expect(evidence(r).contacts.some((c) => c.source === "eruption")).toBe(
      false,
    );
  });
});
describe("02.3 replay and flight", () => {
  for (const burn of ["course", "turn", "weave"] as const)
    for (const miss of [false, true]) {
      it(`${burn} / ${miss ? "miss" : "close"}: full sequence and backward seek reconstruct exactly`, () => {
        const r = run(burn, miss);
        r.seek(840);
        const final = snapshot(r);
        const e = evidence(r);
        console.log(burn, miss ? "miss" : "close", {
          strike: e.strikeTick / 60,
          vents: e.vents.length,
          lost: r.lost,
        });
        expect(e.vents).toHaveLength(4);
        r.seek(40);
        r.seek(840);
        expect(snapshot(r)).toBe(final);
        const fresh = run(burn, miss);
        fresh.seek(840);
        expect(snapshot(fresh)).toBe(final);
        if (burn === "course") expect(r.lost).toBeNull();
      });
    }
  it("response options replay without accumulating force; zero preserves baseline flight", () => {
    for (const timing of ["Preparation", "Release"])
      for (const check of [0, 65, 120]) {
        const r = run("course", false, { check, timing });
        r.seek(220);
        const first = snapshot(r);
        r.seek(0);
        r.seek(220);
        expect(snapshot(r)).toBe(first);
      }
    const baseline = new FlightRun(config, "course", "none");
    baseline.seek(80);
    const zero = new FlightRun(
      config,
      "course",
      "none",
      [],
      {},
      makeExperiment({ check: 0 }),
    );
    zero.seek(80);
    expect(zero.sim.ship.pos).toEqual(baseline.sim.ship.pos);
    expect(zero.sim.ship.vel).toEqual(baseline.sim.ship.vel);
  });
});
