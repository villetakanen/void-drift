import { Vec2 } from "@void-drift/core";
import { describe, expect, it, vi } from "vitest";
import { BUILD_FLIGHT_SCALE } from "./build-renderer";
import { createStar } from "./game-loop";
import {
  liveShipBody,
  type SalvageBody,
  SalvageSystem,
  type TargetingMetrics,
} from "./salvage";
import { CHASSIS, defaultLoadout } from "./schemas/loadout";
import { ION_CANNON } from "./schemas/salvage";
import { STEP } from "./simulation";
import { acquireFleetTargets } from "./targeting";

const dt = STEP / 4;
const origin = 400;
const star = createStar("G", 1800, 1000);

function fixture(part: "light-ion-cannon" | "ion-point-defence") {
  const loadout = defaultLoadout("fighter");
  loadout.hull[0] = part;
  const system = new SalvageSystem(loadout, 2026);
  const ship = {
    pos: new Vec2(origin, origin),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  const metrics: TargetingMetrics = {
    bodyVisits: 0,
    comparisons: 0,
    acquisitionMs: 0,
    contactMs: 0,
  };
  const shooter = { system, ship, shooterId: 10 };
  const resources = { power: 100, hull: 100 };
  const acquire = (roster: readonly SalvageBody[], occluder = star) =>
    acquireFleetTargets(roster, [shooter], occluder, [], dt, metrics).get(
      system,
    );
  const execute = (
    roster: readonly SalvageBody[],
    selection?: ReturnType<typeof acquire>,
  ) =>
    system.stepWeapons(
      dt,
      ship,
      star,
      resources,
      100,
      [],
      roster,
      undefined,
      { shooterId: shooter.shooterId },
      selection,
    );
  return { system, metrics, acquire, execute, resources, ship };
}

function circle(x: number, y: number, radius = 10, id = 20) {
  return liveShipBody(
    id,
    {
      pos: new Vec2(origin + x, origin + y),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius,
    },
    100,
    () => {},
  );
}

describe("shared mounted acquisition", () => {
  const halfWidth = (CHASSIS.fighter.width * BUILD_FLIGHT_SCALE) / 2;
  it.each([
    {
      name: "beyond the rounded far corner",
      x: ION_CANNON.range + 8,
      y: halfWidth + 8,
      shots: 0,
    },
    { name: "touching the far end", x: ION_CANNON.range + 10, y: 0, shots: 1 },
    { name: "overlapping the near edge from behind", x: -5, y: 0, shots: 1 },
  ])("handles a live circle $name", ({ x, y, shots }) => {
    const f = fixture("light-ion-cannon");
    const roster = [circle(x, y)];
    f.execute(roster, f.acquire(roster));
    expect(f.system.ionDischarges).toBe(shots);
  });

  it("does no acquisition work when every cannon is cooling", () => {
    const f = fixture("light-ion-cannon");
    f.system.weapons[0].readyAt = 10;
    f.acquire([circle(75, 0)]);
    expect(f.metrics.bodyVisits).toBe(0);
    expect(f.metrics.comparisons).toBe(0);
  });

  it("a captured trigger can spend a shot after its target has died", () => {
    const f = fixture("light-ion-cannon");
    const roster = [circle(80, 0)];
    const selection = f.acquire(roster);
    const damage = vi.fn();
    roster[0].onDamage = damage;
    roster[0].hull = 0;
    f.execute(roster, selection);
    expect(f.system.ionDischarges).toBe(1);
    expect(f.system.energySpent).toBeCloseTo(ION_CANNON.energy);
    expect(damage).not.toHaveBeenCalled();
  });

  it("keeps a captured miss until the next acquisition pass", () => {
    const f = fixture("light-ion-cannon");
    const roster = [circle(80, 200)];
    const first = f.acquire(roster);
    roster[0].y = origin;
    f.execute(roster, first);
    expect(f.system.ionDischarges).toBe(0);
    f.execute(roster, f.acquire(roster));
    expect(f.system.ionDischarges).toBe(1);
  });

  it("selects the visible runner-up when the nearest turret target is occluded", () => {
    const f = fixture("ion-point-defence");
    const near = circle(80, 0);
    const visible = circle(0, 120, 10, 21);
    const roster = [near, visible];
    const turret = f.system.weapons[0];
    expect(f.acquire(roster)?.targets.get(turret)?.id).toBe(near.id);
    const blocker = { ...star, pos: new Vec2(origin + 40, origin), radius: 12 };
    expect(f.acquire(roster, blocker)?.targets.get(turret)?.id).toBe(
      visible.id,
    );
  });

  it("breaks equal turret distances by stable ID in either roster order", () => {
    const first = circle(80, 20, 10, 20);
    const second = circle(80, 20, 10, 21);
    for (const roster of [
      [second, first],
      [first, second],
    ]) {
      const f = fixture("ion-point-defence");
      f.execute(roster, f.acquire(roster));
      expect(f.system.weapons[0].target).toBe(first.id);
    }
  });

  it("preserves the normal weapon outcome for a standalone caller", () => {
    const fallback = fixture("light-ion-cannon");
    const fleet = fixture("light-ion-cannon");
    const contact = circle(80, 0);
    fallback.execute([{ ...contact }]);
    const roster = [{ ...contact }];
    fleet.execute(roster, fleet.acquire(roster));
    expect(fallback.system.ionDischarges).toBe(1);
    expect(fallback.system.ionDischarges).toBe(fleet.system.ionDischarges);
    expect(fallback.resources.power).toBe(fleet.resources.power);
  });
});
