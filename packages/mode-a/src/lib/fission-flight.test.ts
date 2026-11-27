import { describe, expect, it } from "vitest";
import { buildMounts, buildNozzlePose } from "./build-renderer";
import { ASSEMBLED_ION_DEFAULTS } from "./schemas/ion";
import {
  buildStats,
  defaultLoadout,
  LIFE_SUPPORT_DRAIN,
  type Loadout,
  PARTS,
} from "./schemas/loadout";
import { ION_CANNON, WEAPONS } from "./schemas/salvage";
import { scoutFlightProfile } from "./scout-predictor";
import { Simulation, STEP, stockSettings } from "./simulation";
import { PLAYER_BODY_ID } from "./targeting";

const idle = { leftThruster: false, rightThruster: false, fire: false };
const left = { ...idle, leftThruster: true };
const right = { ...idle, rightThruster: true };
const both = { ...left, rightThruster: true };

function flight(
  loadout: Loadout = { ...defaultLoadout("wasp"), side: "fusion" as const },
) {
  loadout.stabilizers = false;
  const sim = new Simulation({
    ...stockSettings(loadout.chassis),
    loadout,
    experimental: "On",
  });
  sim.planets.length = 0;
  sim.star.influenceRadius = 0;
  // Supply exactly life support, so battery readings isolate continuous drive and ignition.
  sim.star.collectionField = {
    reach: 3000,
    shoulder: 1,
    outerFraction: 1,
    peak: LIFE_SUPPORT_DRAIN,
  };
  sim.ship.pos.set(460, 540);
  sim.ship.rotation = 0;
  sim.ship.vel.set(0, 0);
  sim.start();
  return sim;
}

function fitted(sim: Simulation) {
  const { loadout } = sim.settings;
  if (!loadout) throw new Error("test requires a mounted actor");
  return loadout;
}

const pair = () =>
  flight({ ...defaultLoadout("fighter"), aft: ["fusion", "fusion"] });

describe("Scout prediction", () => {
  it.each(["side", "aft"] as const)(
    "rejects Fission in a %s mount",
    (mount) => {
      const loadout = defaultLoadout("scout");
      expect(scoutFlightProfile(loadout, ASSEMBLED_ION_DEFAULTS)).toBeDefined();
      if (mount === "side") loadout.side = "fusion";
      else loadout.aft[0] = "fusion";
      expect(() => scoutFlightProfile(loadout, ASSEMBLED_ION_DEFAULTS)).toThrow(
        "The Scout predictor does not support Fission fittings",
      );
    },
  );
});

describe("paid Fission flight", () => {
  it("kicks once on the first substep and exports the pre-movement world nozzle pose", () => {
    const sim = flight();
    const loadout = fitted(sim);
    const stats = buildStats(loadout);
    expect(stats.mass).toBe(77);
    expect(stats.engineDraw).toBe(
      buildStats(defaultLoadout("wasp")).engineDraw - PARTS.ion.draw,
    );
    sim.ship.rotation = Math.PI / 2;
    const mount = buildMounts(loadout).find((m) => m.part === "fusion");
    if (!mount) throw new Error("test requires a fitted nozzle");
    const nozzle = buildNozzlePose(loadout, mount);
    const { x, y } = sim.ship.pos;
    sim.step(both);
    const kick = PARTS.fusion.impulse / stats.mass;
    expect(sim.ship.vel.y).toBeCloseTo(kick, 10);
    expect(sim.ship.pos.y).toBeCloseTo(y + kick * STEP, 10);
    expect(sim.state.resources.power).toBe(stats.capacity - 0.5);
    expect(sim.fissionIgnitions).toEqual([
      {
        carrierId: PLAYER_BODY_ID,
        mountKey: "left",
        tick: 0,
        x: x - nozzle.y,
        y: y + nozzle.x,
        exhaustAngle: (3 * Math.PI) / 2,
      },
    ]);
    expect(sim.emitters[0].output).toBe(0);
    sim.step(idle);
    expect(sim.fissionIgnitions).toHaveLength(0);
    for (let i = 2; i < 16; i++) {
      sim.step(both);
      expect(sim.fissionIgnitions).toHaveLength(0);
    }
    sim.step(both);
    expect(sim.fissionIgnitions.map((event) => event.tick)).toEqual([16]);
  });

  it("pays at exact balance for a mixed drive and delivers all four ion substeps", () => {
    const sim = pair();
    const funded = pair();
    delete sim.star.collectionField;
    delete funded.star.collectionField;
    const cost = 2 * PARTS.fusion.energyPerIgnition;
    const tickDrain = (2 * PARTS.ion.draw + LIFE_SUPPORT_DRAIN) * STEP;
    sim.state.resources.power = cost + tickDrain;
    funded.step(both);
    sim.step(both);
    expect(sim.fissionIgnitions.map((event) => event.mountKey)).toEqual([
      "aft-0",
      "aft-1",
    ]);
    expect(sim.state.resources.power).toBe(0);
    expect(sim.state.deathCause).toBe("POWER");
    expect(sim.ship.vel.x).toBeCloseTo(funded.ship.vel.x, 10);
    expect(sim.ship.pos.x).toBeCloseTo(funded.ship.pos.x, 10);
    expect(sim.engineOutput.left).toBeCloseTo(funded.engineOutput.left, 10);
  });

  it("withholds the whole pair when a first-substep purchase would starve later loads", () => {
    const sim = pair();
    delete sim.star.collectionField;
    const cost = 2 * PARTS.fusion.energyPerIgnition;
    const tickDrain = (2 * PARTS.ion.draw + LIFE_SUPPORT_DRAIN) * STEP;
    const power = cost + tickDrain / 4;
    sim.state.resources.power = power;
    sim.step(both);
    expect(sim.fissionIgnitions).toHaveLength(0);
    expect(sim.state.resources.power).toBeCloseTo(power - tickDrain, 12);
    expect(sim.engineOutput.left).toBeGreaterThan(0);
  });

  it("reserves gross loads when the kick can carry the ship out of collection", () => {
    const atFieldEdge = () => {
      const sim = flight();
      sim.star.pos.set(260, 540);
      sim.star.collectionField = {
        reach: 200,
        shoulder: 1,
        outerFraction: 1,
        peak: LIFE_SUPPORT_DRAIN,
      };
      return sim;
    };
    const cost = PARTS.fusion.energyPerIgnition;
    const reserve = (LIFE_SUPPORT_DRAIN * STEP * 3) / 4;
    const short = atFieldEdge();
    short.state.resources.power = cost + reserve / 2;
    short.step(both);
    expect(short.fissionIgnitions).toHaveLength(0);
    expect(short.ship.pos.x).toBe(460);
    expect(short.state.resources.power).toBe(cost + reserve / 2);

    const exact = atFieldEdge();
    exact.state.resources.power = cost + reserve;
    exact.step(both);
    expect(exact.fissionIgnitions).toHaveLength(1);
    expect(exact.ship.pos.x).toBeGreaterThan(460);
    expect(exact.state.resources.power).toBe(0);
    expect(exact.state.deathCause).toBe("POWER");
  });

  it("buys ignition before a ready cannon that could otherwise fire that tick", () => {
    const armed = () => {
      const loadout = { ...defaultLoadout("wasp"), side: "fusion" as const };
      loadout.hull[0] = "light-ion-cannon";
      const sim = flight(loadout);
      const combat = sim.salvage;
      if (!combat) throw new Error("test requires an active combat system");
      combat.nextPass = Infinity;
      combat.bodies.push({
        id: 1,
        group: 1,
        kind: "wreck",
        x: 530,
        y: 540,
        previousX: 530,
        previousY: 540,
        vx: 0,
        vy: 0,
        radius: 20,
        hull: 100,
        life: 100,
        rotation: 0,
      });
      sim.state.resources.power =
        WEAPONS.reserve +
        ION_CANNON.energy +
        PARTS.fusion.energyPerIgnition / 2;
      return { sim, combat };
    };
    const coasting = armed();
    coasting.sim.step(idle);
    expect(coasting.combat.ionDischarges).toBe(1);

    const driving = armed();
    driving.sim.step(both);
    expect(driving.sim.fissionIgnitions).toHaveLength(1);
    expect(driving.combat.ionDischarges).toBe(0);
    expect(driving.combat.weapons[0].readyAt).toBe(0);
  });

  it("waits until the next replay tick if only a later substep can afford ignition", () => {
    const sim = flight();
    const field = sim.star.collectionField;
    if (!field) throw new Error("test requires solar charge");
    field.peak += 2.4;
    sim.state.resources.power = 0.485;
    sim.step(both);
    expect(sim.state.resources.power).toBeGreaterThan(0.5);
    expect(sim.fissionIgnitions).toHaveLength(0);
    sim.step(both);
    expect(sim.fissionIgnitions.map((event) => event.tick)).toEqual([1]);
  });

  it("holds an entire dual-pad request when one side is recovering", () => {
    const sim = flight({ ...defaultLoadout("fighter"), side: "fusion" });
    sim.step(left);
    expect(sim.fissionIgnitions.map((event) => event.mountKey)).toEqual([
      "left",
    ]);
    const power = sim.state.resources.power;
    sim.step(both);
    expect(sim.fissionIgnitions).toHaveLength(0);
    expect(sim.state.resources.power).toBe(power);
    sim.step(right);
    expect(sim.fissionIgnitions.map((event) => event.mountKey)).toEqual([
      "right",
    ]);
    expect(sim.angularMotion.velocity).toBeCloseTo(0);
  });

  it("clips the summed pair, charges full cost and does not clamp overspeed", () => {
    const sim = flight({ ...defaultLoadout("fighter"), side: "fusion" });
    const ceiling = buildStats(fitted(sim)).poweredCruiseCeiling;
    sim.ship.vel.set(ceiling - 5, 0);
    sim.step(both);
    expect(sim.ship.vel.mag()).toBeCloseTo(ceiling, 10);
    expect(sim.fissionIgnitions).toHaveLength(2);
    expect(sim.state.resources.power).toBe(99);
    const over = flight();
    over.ship.vel.set(800, 0);
    over.step(both);
    expect(over.fissionIgnitions).toHaveLength(0);
    expect(over.ship.vel.mag()).toBe(800);
    over.ship.rotation = Math.PI;
    over.step(both);
    expect(over.fissionIgnitions).toHaveLength(1);
    expect(over.ship.vel.mag()).toBeCloseTo(
      800 - PARTS.fusion.impulse / 77,
      10,
    );
  });

  it("scales the signed side lever by the same fraction as the kick", () => {
    const create = () =>
      flight({ ...defaultLoadout("fighter"), side: "fusion" });
    const full = create();
    full.step(left);
    expect(full.angularMotion.velocity).toBeGreaterThan(0);
    const partial = create();
    const ceiling = buildStats(fitted(partial)).poweredCruiseCeiling;
    partial.ship.vel.set(ceiling - 5, 0);
    partial.step(left);
    const fraction = partial.ship.vel.y / full.ship.vel.y;
    expect(fraction).toBeGreaterThan(0);
    expect(fraction).toBeLessThan(1);
    expect(partial.angularMotion.velocity).toBeCloseTo(
      full.angularMotion.velocity * fraction,
      10,
    );
    expect(partial.ship.vel.mag()).toBeCloseTo(ceiling, 10);
    const mirror = create();
    mirror.step(right);
    expect(mirror.angularMotion.velocity).toBeCloseTo(
      -full.angularMotion.velocity,
      10,
    );
  });

  it("does not ignite for a linked Fiddler's release braking", () => {
    const sim = flight({
      ...defaultLoadout("fiddler"),
      aft: ["fusion", "fusion"],
      linkedEngines: true,
    });
    sim.angularMotion.velocity = 1;
    sim.step(idle);
    expect(sim.angularMotion.velocity).toBeLessThan(1);
    expect(sim.fissionIgnitions).toHaveLength(0);
    sim.step(left);
    expect(sim.fissionIgnitions.map((event) => event.mountKey)).toEqual([
      "aft-0",
    ]);
  });
});
