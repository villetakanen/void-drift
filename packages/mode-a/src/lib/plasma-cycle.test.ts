import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { liveShipBody, type SalvageBody, SalvageSystem } from "./salvage";
import { defaultLoadout, type Loadout } from "./schemas/loadout";
import { STEP } from "./simulation";

const substep = STEP / 4;
const star = createStar("G", 1800, 1000);

function fixture(
  hull: Loadout["hull"] = ["plasma-rifle", null],
  power = 100,
  capacity = 100,
) {
  const build = defaultLoadout("wasp");
  build.hull = hull;
  const system = new SalvageSystem(build, 2026);
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 20,
  };
  const resources = { hull: 100, power };
  const target = (id: number) =>
    liveShipBody(id, { ...ship, pos: new Vec2(490, 400) }, 1000, () => {});
  const original = target(20);
  const rifles = system.weapons.filter(
    (weapon) => weapon.kind === "plasma-rifle",
  );
  function step(dt = substep, roster: readonly SalvageBody[] = [original]) {
    system.stepWeapons(dt, ship, star, resources, capacity, [], roster);
  }
  function advance(
    seconds: number,
    roster?: readonly SalvageBody[],
    maximumStep = substep,
  ) {
    while (seconds > 1e-12) {
      const dt = Math.min(seconds, maximumStep);
      step(dt, roster);
      seconds -= dt;
    }
  }
  return { system, resources, rifles, ship, target, original, step, advance };
}

describe("Plasma rifle charge cycle", () => {
  it("releases at 0.7 s, finishes firing and cooldown, and charges again", () => {
    const f = fixture();
    const [rifle] = f.rifles;
    expect(rifle.plasma?.phase).toBe("idle");
    f.advance(0.7 - substep);
    expect(rifle.plasma?.phase).toBe("charging");
    expect(f.system.plasmaReleases).toBe(0);
    expect(f.resources.power).toBeCloseTo(100 - 5 * (0.7 - substep));
    f.step();
    expect(rifle.plasma?.phase).toBe("firing");
    expect(rifle.plasma?.remaining).toBeCloseTo(0.7);
    expect(f.resources.power).toBeCloseTo(93);
    expect(f.system.plasmaReleases).toBe(1);

    f.advance(0.7 - substep, []);
    expect(rifle.plasma?.phase).toBe("firing");
    expect(f.resources.power).toBeCloseTo(93);
    f.step(substep, []);
    expect(rifle.plasma?.phase).toBe("cooldown");
    expect(rifle.plasma?.remaining).toBeCloseTo(2.1);
    f.advance(2.1 - substep);
    expect(rifle.plasma?.phase).toBe("cooldown");
    expect(f.resources.power).toBeCloseTo(93);

    f.advance(0.7 + substep);
    expect(rifle.plasma?.phase).toBe("firing");
    expect(rifle.plasma?.remaining).toBeCloseTo(0.7);
    expect(f.system.plasmaReleases).toBe(2);
    expect(f.resources.power).toBeCloseTo(86);
  });

  it("holds paid charge at the fitted reserve and debits one funded release", () => {
    const f = fixture(["plasma-rifle", null], 22, 200);
    const [rifle] = f.rifles;
    f.advance(0.6);
    expect(rifle.plasma?.charge).toBeCloseTo(0.4 / 0.7);
    expect(f.resources.power).toBeCloseTo(20);
    f.advance(0.6);
    expect(rifle.plasma?.charge).toBeCloseTo(0.4 / 0.7);
    expect(f.system.plasmaVents).toBe(0);

    f.resources.power = 21.5;
    f.advance(0.3);
    expect(rifle.plasma?.charge).toBeCloseTo(1);
    expect(rifle.plasma?.phase).toBe("charging");
    expect(f.resources.power).toBeCloseTo(20);
    f.resources.power = 23.499;
    f.step();
    expect(f.system.plasmaReleases).toBe(0);
    expect(f.resources.power).toBeCloseTo(23.499);
    f.resources.power = 23.5;
    f.step();
    expect(f.system.plasmaReleases).toBe(1);
    expect(f.resources.power).toBeCloseTo(20);
    expect(f.system.energySpent).toBeCloseTo(7);
  });

  it("does not vent or cool down when an unfunded observation ends", () => {
    const f = fixture(["plasma-rifle", null], 10);
    const [rifle] = f.rifles;
    f.advance(0.7);
    expect(rifle.target).toBe(f.original.id);
    expect(rifle.plasma?.phase).toBe("idle");
    expect(rifle.plasma?.charge).toBe(0);
    f.step(substep, []);
    expect(rifle.plasma?.phase).toBe("idle");
    expect(f.system.plasmaVents).toBe(0);
    expect(f.system.plasmaReleases).toBe(0);
    expect(f.resources.power).toBe(10);
    f.resources.power = 11;
    f.step();
    expect(rifle.plasma?.phase).toBe("charging");
    expect(rifle.plasma?.charge).toBeCloseTo(substep / 0.7);
  });

  it.each(["lost", "replaced"] as const)(
    "vents paid partial charge when its target is %s and ignores the returning target",
    (exit) => {
      const f = fixture();
      const [rifle] = f.rifles;
      f.advance(0.35);
      expect(rifle.plasma?.charge).toBeCloseTo(0.5);
      const changed = exit === "lost" ? [] : [f.target(21)];
      f.step(substep, changed);
      expect(rifle.plasma?.phase).toBe("venting");
      expect(f.system.plasmaVents).toBe(1);
      f.advance(0.15 - 2 * substep);
      expect(rifle.plasma?.phase).toBe("venting");
      f.step();
      expect(rifle.plasma?.phase).toBe("cooldown");
      expect(rifle.plasma?.remaining).toBeCloseTo(2.1);
      expect(f.resources.power).toBeCloseTo(98.25);
      f.advance(2.1 + substep);
      expect(rifle.plasma?.phase).toBe("charging");
      expect(rifle.plasma?.targetId).toBe(f.original.id);
      expect(rifle.plasma?.charge).toBeCloseTo(substep / 0.7);
      expect(f.system.plasmaReleases).toBe(0);
    },
  );

  it.each([true, false])(
    "shares scarce release funding with a ready cannon in slot order (rifle first: %s)",
    (rifleFirst) => {
      const f = fixture(
        rifleFirst
          ? ["plasma-rifle", "light-ion-cannon"]
          : ["light-ion-cannon", "plasma-rifle"],
        13.5,
      );
      const [rifle] = f.rifles;
      const cannon = f.system.weapons.find(
        (weapon) => weapon.kind === "light-ion-cannon",
      );
      if (!cannon) throw new Error("Missing fitted cannon");
      cannon.readyAt = Infinity;
      f.advance(0.7);
      expect(rifle.plasma?.charge).toBeCloseTo(1);
      expect(f.system.plasmaReleases).toBe(0);
      cannon.readyAt = 0;
      f.resources.power = 13.5;
      f.step();
      expect(f.system.plasmaReleases).toBe(rifleFirst ? 1 : 0);
      expect(f.system.ionDischarges).toBe(rifleFirst ? 0 : 1);
      expect(f.resources.power).toBeCloseTo(rifleFirst ? 10 : 13.3);
    },
  );

  it("funds two fitted rifles independently and releases them in slot order", () => {
    const f = fixture(["plasma-rifle", "plasma-rifle"], 17);
    const [first, second] = f.rifles;
    f.advance(0.7);
    expect(first.plasma?.charge).toBeCloseTo(1);
    expect(second.plasma?.charge).toBeCloseTo(1);
    expect(f.system.plasmaReleases).toBe(0);
    f.resources.power = 13.5;
    f.step();
    expect(first.plasma?.phase).toBe("firing");
    expect(second.plasma?.phase).toBe("charging");
    expect(second.plasma?.charge).toBeCloseTo(1);
    expect(f.system.plasmaReleases).toBe(1);
    expect(f.resources.power).toBeCloseTo(10);
    f.resources.power = 13.5;
    f.step();
    expect(second.plasma?.phase).toBe("firing");
    expect(f.system.plasmaReleases).toBe(2);
    expect(f.resources.power).toBeCloseTo(10);
  });

  it("matches the isolated held cycle across substep partitions", () => {
    const regular = fixture();
    const uneven = fixture();
    for (const duration of [0.699, 0.008, 0.688, 0.009, 2.112, 0.69, 0.71]) {
      regular.advance(duration);
      uneven.advance(duration, undefined, 0.137);
      const [a] = regular.rifles;
      const [b] = uneven.rifles;
      expect(regular.system.plasmaReleases).toBe(uneven.system.plasmaReleases);
      expect(regular.resources.power).toBeCloseTo(uneven.resources.power, 9);
      expect(a.plasma?.phase).toBe(b.plasma?.phase);
      expect(a.plasma?.charge).toBeCloseTo(b.plasma?.charge ?? -1, 9);
      expect(a.plasma?.remaining).toBeCloseTo(b.plasma?.remaining ?? -1, 9);
    }
  });
});
