import { CloudBodyPainter, RockBodyPainter, Vec2 } from "@void-drift/core";
import {
  FLIGHT_PASSES,
  type FlightFrame,
  gameSettings,
  Simulation,
} from "@void-drift/mode-a";
import { describe, expect, it, vi } from "vitest";
import { planetAppearances } from "./planet-appearances";

function pass(id: string) {
  const result = FLIGHT_PASSES.find((item) => item.id === id);
  if (!result) throw new Error(`Missing pass ${id}`);
  return result;
}

function planet(id: string, systemPosition: number, x: number) {
  return {
    id,
    systemPosition,
    pos: new Vec2(x, 50),
    orbitCenter: new Vec2(40, 50),
    orbitRadius: Math.hypot(x - 40, 0),
    orbitSpeed: 0,
    orbitAngle: 0,
    initialAngle: 0,
    radius: 10,
    mass: 100,
    color: "#777",
    type: "rock",
  };
}

describe("shared body appearance adapter", () => {
  it("culls a body just outside the view unless its atmosphere reaches in", () => {
    // Both bodies sit just beyond the left edge of the view by their radius.
    const mercury = planet("moon", 1, -10.01);
    const venus = planet("venus", 3, -10.01);
    const material = <T extends object>(painter: T) => {
      Object.assign(painter, {
        materials: [],
        body: vi.fn(),
        light: vi.fn(),
        atmosphere: vi.fn(),
      });
      return { painter, surface: { draw: vi.fn() } };
    };
    const rock = material(
      Object.create(RockBodyPainter.prototype) as RockBodyPainter,
    );
    const cloud = material(
      Object.create(CloudBodyPainter.prototype) as CloudBodyPainter,
    );
    const frame = {
      bodyAppearances: planetAppearances([mercury, venus], {
        mercury: rock,
        venus: cloud,
      }),
      camera: {
        zoom: 0.5,
        getViewRect: () => ({ x: 0, y: 0, width: 100, height: 100 }),
      },
      renderer: { drawPlanet: vi.fn() },
      sim: {
        planets: [mercury, venus],
        star: { pos: new Vec2(40, 50) },
        ticks: 9,
      },
    } as unknown as FlightFrame;
    const ctx = {} as CanvasRenderingContext2D;

    pass("planets").draw(frame, ctx);
    pass("body-light").draw(frame, ctx);
    expect(rock.surface.draw).not.toHaveBeenCalled();
    expect(rock.painter.body).not.toHaveBeenCalled();
    expect(rock.painter.light).not.toHaveBeenCalled();
    expect(cloud.painter.body).toHaveBeenCalledTimes(1);
    expect(cloud.painter.atmosphere).toHaveBeenCalledTimes(1);
  });
});

describe("generated planet material binding", () => {
  it("binds the mercurial identity across modes, replacement runs and changing ordinals", () => {
    const material = {
      painter: { body: vi.fn(), light: vi.fn() } as unknown as RockBodyPainter,
      surface: { draw: vi.fn() },
    };
    for (const mode of [
      "survival",
      "derelicts",
      "gauntlet",
      "practice",
    ] as const) {
      for (const seed of [1, 12345]) {
        const sim = new Simulation({ ...gameSettings("wasp"), mode, seed });
        const moon = sim.planets.find((body) => body.id === "moon");
        if (!moon?.systemPosition) throw new Error("Missing mercurial body");
        const map = planetAppearances(sim.planets, { mercury: material });
        expect([...map.keys()]).toEqual([moon.systemPosition]);
        expect(planetAppearances(sim.planets, {}).size).toBe(0);
      }
    }
    const staged = [planet("rock", 1, 0), planet("moon", 2, 50)];
    expect([
      ...planetAppearances(staged, { mercury: material }).keys(),
    ]).toEqual([2]);
  });
});
