import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { weaponPose } from "./build-renderer";
import { createStar } from "./game-loop";
import {
  type SalvageBody,
  SalvageSystem,
  type TargetingMetrics,
} from "./salvage";
import { defaultLoadout } from "./schemas/loadout";
import { STEP } from "./simulation";
import { acquireFleetTargets } from "./targeting";

const dt = STEP / 4;
const star = createStar("G", 1800, 1000);

function fixture(twins = false) {
  const loadout = defaultLoadout("wasp");
  loadout.hull = ["plasma-rifle", twins ? "plasma-rifle" : null];
  const system = new SalvageSystem(loadout, 2026);
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(3, -2),
    acc: new Vec2(0, 0),
    rotation: 0.73,
    radius: 20,
  };
  const [rifle] = system.weapons;
  const muzzle = weaponPose(ship, rifle.mount);
  const shooter = { system, ship, shooterId: 10 };
  return { system, ship, rifle, muzzle, shooter };
}

function target(
  muzzle: ReturnType<typeof weaponPose>,
  id: number,
  distance: number,
  degrees = 0,
  kind: SalvageBody["kind"] = "ship",
  hull = 100,
): SalvageBody {
  const angle = muzzle.angle + (degrees * Math.PI) / 180;
  const x = muzzle.muzzleX + distance * Math.cos(angle);
  const y = muzzle.muzzleY + distance * Math.sin(angle);
  return {
    id,
    kind,
    group: id,
    x,
    y,
    previousX: x,
    previousY: y,
    vx: 0,
    vy: 0,
    hull,
    radius: 20,
    rotation: 0,
  };
}

describe("Plasma rifle acquisition", () => {
  it("queries each mount independently and visits each body once", () => {
    const f = fixture(true);
    const contact = target(f.muzzle, 11, 8);
    const metrics: TargetingMetrics = {
      bodyVisits: 0,
      comparisons: 0,
      acquisitionMs: 0,
      contactMs: 0,
    };
    const snapshot = acquireFleetTargets(
      [contact],
      [f.shooter],
      star,
      [],
      dt,
      metrics,
    ).get(f.system);
    expect(snapshot?.targets.get(f.rifle)?.id).toBe(contact.id);
    expect(snapshot?.targets.has(f.system.weapons[1])).toBe(false);
    expect(metrics.bodyVisits).toBe(1);
  });

  it.each([
    { distance: 130, degrees: -15, eligible: true },
    { distance: 130, degrees: 15, eligible: true },
    { distance: 130.001, degrees: 0, eligible: false },
    { distance: 90, degrees: -15.001, eligible: false },
    { distance: 90, degrees: 15.001, eligible: false },
    { distance: 1, degrees: 180, eligible: false },
  ])(
    "tests the body centre at $distance units and $degrees degrees",
    ({ distance, degrees, eligible }) => {
      const f = fixture();
      const contact = target(f.muzzle, 11, distance, degrees);
      const snapshot = acquireFleetTargets(
        [contact],
        [f.shooter],
        star,
        [],
        dt,
      ).get(f.system);
      expect(snapshot?.targets.has(f.rifle)).toBe(eligible);
    },
  );

  it("excludes the shooter, dead bodies, fragments, pickups and disallowed ships", () => {
    const f = fixture();
    const self = target(f.muzzle, f.shooter.shooterId, 1);
    const allied = target(f.muzzle, 11, 10);
    const opponent = target(f.muzzle, 12, 40);
    const wreck = target(f.muzzle, 13, 30, 0, "wreck");
    const cell = target(f.muzzle, 14, 2, 0, "cell");
    const fragment = target(f.muzzle, 15, 3, 0, "fragment");
    const destroyed = target(f.muzzle, 16, 4, 0, "ship", 0);
    const ineligible = [self, cell, fragment, destroyed];
    const acquire = (roster: SalvageBody[], aimId?: number) =>
      acquireFleetTargets(roster, [{ ...f.shooter, aimId }], star, [], dt)
        .get(f.system)
        ?.targets.get(f.rifle)?.id;
    expect(acquire(ineligible)).toBeUndefined();
    expect(acquire([...ineligible, wreck, opponent])).toBe(wreck.id);
    expect(acquire([...ineligible, allied, wreck, opponent], opponent.id)).toBe(
      opponent.id,
    );
  });

  it("keeps an eligible wreck, then selects the visible replacement", () => {
    const f = fixture();
    const wreck = target(f.muzzle, 11, 80, 0, "wreck");
    const ship = target(f.muzzle, 12, 50, 12);
    const roster = [ship, wreck];
    f.rifle.target = wreck.id;
    const acquire = (occluder = star) =>
      acquireFleetTargets(roster, [f.shooter], occluder, [], dt)
        .get(f.system)
        ?.targets.get(f.rifle)?.id;
    expect(acquire()).toBe(wreck.id);
    const halfway = target(f.muzzle, 13, 28);
    expect(
      acquire({ ...star, pos: new Vec2(halfway.x, halfway.y), radius: 3 }),
    ).toBe(ship.id);
    wreck.hull = 0;
    expect(acquire()).toBe(ship.id);
  });

  it("breaks equal-distance ties by stable ID in either roster order", () => {
    const f = fixture();
    const lower = target(f.muzzle, 11, 80);
    const higher = { ...lower, id: 12 };
    for (const roster of [
      [higher, lower],
      [lower, higher],
    ])
      expect(
        acquireFleetTargets(roster, [f.shooter], star, [], dt)
          .get(f.system)
          ?.targets.get(f.rifle)?.id,
      ).toBe(lower.id);
  });
});
