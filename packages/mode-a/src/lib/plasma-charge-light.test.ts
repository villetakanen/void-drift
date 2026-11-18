import { Vec2 } from "@void-drift/core";
import { describe, expect, it } from "vitest";
import { createStar } from "./game-loop";
import { plasmaChargeAppearance } from "./plasma-rifle-art";
import { liveShipBody, SalvageSystem } from "./salvage";
import { defaultLoadout } from "./schemas/loadout";

const star = createStar("G", 1800, 1000);
const dark = { center: 0, sides: 0 };

function fixture(power: number) {
  const loadout = defaultLoadout("wasp");
  loadout.hull = ["plasma-rifle", null];
  const system = new SalvageSystem(loadout, 2026);
  const ship = {
    pos: new Vec2(400, 400),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 20,
  };
  const target = liveShipBody(
    20,
    { ...ship, pos: new Vec2(490, 400) },
    100,
    () => {},
  );
  const resources = { hull: 100, power };
  const [rifle] = system.weapons;
  function step(seconds: number, roster = [target]) {
    system.stepWeapons(seconds, ship, star, resources, 100, [], roster);
  }
  return {
    rifle,
    resources,
    step,
    light: () => plasmaChargeAppearance(rifle.plasma),
  };
}

describe("mounted plasma charge light", () => {
  it("shows paid charge, holds it through a power shortfall, and dims as it vents", () => {
    const flight = fixture(10);
    flight.step(0.7);
    expect(flight.light()).toEqual(dark);

    flight.resources.power = 10.875;
    flight.step(0.7);
    expect(flight.light().center).toBeCloseTo(0.25);
    expect(flight.light().sides).toBe(0);
    flight.step(0.7);
    expect(flight.light().center).toBeCloseTo(0.25);

    flight.resources.power = 12.625;
    flight.step(0.525);
    expect(flight.rifle.plasma?.phase).toBe("charging");
    expect(flight.light()).toEqual({ center: 1, sides: 1 });
    flight.step(0.06, []);
    expect(flight.rifle.plasma?.phase).toBe("venting");
    expect(flight.light().center).toBeCloseTo(0.8);
    expect(flight.light().sides).toBeCloseTo(0.6);
    flight.step(0.12, []);
    expect(flight.light().center).toBeCloseTo(0.4);
    expect(flight.light().sides).toBe(0);
    flight.step(0.12, []);
    expect(flight.rifle.plasma?.phase).toBe("cooldown");
    expect(flight.light()).toEqual(dark);
  });

  it("lights the side channels past half charge and clears the bead on release", () => {
    const flight = fixture(100);
    flight.step(0.35);
    expect(flight.light().center).toBeCloseTo(0.5);
    expect(flight.light().sides).toBe(0);
    flight.step(0.07);
    expect(flight.light().center).toBeCloseTo(0.6);
    expect(flight.light().sides).toBeCloseTo(0.2);
    flight.step(0.28);
    expect(flight.rifle.plasma?.phase).toBe("firing");
    expect(flight.rifle.plasma?.charge).toBe(1);
    expect(flight.light()).toEqual(dark);
  });
});
