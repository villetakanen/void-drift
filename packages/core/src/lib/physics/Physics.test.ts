import { describe, expect, it } from "vitest";
import { SURVIVAL_CONFIG } from "../config";
import type { InputState } from "../entities/Input";
import type { GameObject, Planet, Star } from "./Physics";
import { updatePower, updateShip, Vec2 } from "./Physics";

describe("updatePower", () => {
  const sun: Star = {
    pos: new Vec2(0, 0),
    influenceRadius: 360,
    mass: 600,
    color: "#ffffff",
    glowColor: "#ffffff",
    type: "G",
    pulseSpeed: 1,
    radius: 40,
    powerMultiplier: 1,
    burnMultiplier: 1,
  };

  it("keeps power between 0 and 100", () => {
    const resources = { hull: 100, power: 99 };
    updatePower(resources, SURVIVAL_CONFIG.POWER_ZONE_1_RADIUS - 10, sun, 10);
    expect(resources.power).toBe(100);
    resources.power = 0.5;
    updatePower(resources, 1000, sun, 10);
    expect(resources.power).toBe(0);
  });
});

describe("planet with a study well", () => {
  const noInput: InputState = {
    leftThruster: false,
    rightThruster: false,
    fire: false,
  };
  const arenaSize = 2400;

  function makeShip(x: number, y: number): GameObject {
    return {
      pos: new Vec2(x, y),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 16,
    };
  }

  function makePlanet(overrides: Partial<Planet> = {}): Planet {
    return {
      pos: new Vec2(600, 600),
      orbitCenter: new Vec2(600, 600),
      orbitRadius: 0,
      orbitSpeed: 0,
      orbitAngle: 0,
      initialAngle: 0,
      radius: 30,
      mass: 400,
      color: "#8B7355",
      type: "rock",
      hasRing: false,
      ...overrides,
    };
  }

  it("does not pull outside the well's reach", () => {
    const planet = makePlanet({ well: { reach: 150, strength: 600 } });
    const outside = makeShip(600 - 151, 600);
    const inside = makeShip(600 - 149, 600);
    for (const ship of [outside, inside])
      updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [
        planet,
      ]);
    expect(outside.vel).toEqual(new Vec2(0, 0));
    expect(inside.vel.x).toBeGreaterThan(0);
  });

  it("pulls with the well's own curve", () => {
    const [inverse, linear] = (["inverse-square", "linear"] as const).map(
      (curve) => {
        const ship = makeShip(600 - 50, 600);
        updateShip(ship, noInput, 1 / 60, arenaSize, arenaSize, undefined, [
          makePlanet({ well: { reach: 200, strength: 600, curve } }),
        ]);
        return ship.vel.x;
      },
    );
    expect(inverse).toBeGreaterThan(linear);
  });
});
