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
  it("brightens with paid charge, lights the sides past half and clears on release", () => {
    const flight = fixture(100);
    flight.step(0.35);
    const half = flight.light();
    expect(half.center).toBeGreaterThan(0);
    expect(half.sides).toBe(0);
    flight.step(0.07);
    expect(flight.light().center).toBeGreaterThan(half.center);
    expect(flight.light().sides).toBeGreaterThan(0);
    flight.step(0.28);
    expect(flight.rifle.plasma?.phase).toBe("firing");
    expect(flight.light()).toEqual(dark);
  });

  it("holds through a power shortfall, dims while venting and is dark in cooldown", () => {
    const flight = fixture(10);
    flight.step(0.7);
    expect(flight.light()).toEqual(dark);
    flight.resources.power = 12.625;
    flight.step(0.7);
    const held = flight.light();
    expect(held.center).toBeGreaterThan(0);
    flight.step(0.7);
    expect(flight.light()).toEqual(held);
    flight.step(0.06, []);
    expect(flight.rifle.plasma?.phase).toBe("venting");
    expect(flight.light().center).toBeGreaterThan(0);
    expect(flight.light().center).toBeLessThan(held.center);
    flight.step(0.3, []);
    expect(flight.rifle.plasma?.phase).toBe("cooldown");
    expect(flight.light()).toEqual(dark);
  });
});
