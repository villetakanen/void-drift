import { CloudBodyPainter, RockBodyPainter, Vec2 } from "@void-drift/core";
import {
  FLIGHT_PASSES,
  type FlightFrame,
  PRACTICE_MERCURY_SPIN_SECONDS,
  STEP,
} from "@void-drift/mode-a";
import { describe, expect, it, vi } from "vitest";
import { practicePlanetAppearances } from "./practice-planet-appearances";

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

describe("shared Practice body appearance adapter", () => {
  it("drives production body and light passes from prepared materials and their full visual bounds", () => {
    const mercury = planet("moon", 1, -10.01);
    const venus = planet("venus", 3, -10.6);
    const mercuryPainter = Object.create(
      RockBodyPainter.prototype,
    ) as RockBodyPainter;
    const mercuryBody = vi.fn();
    const mercuryLight = vi.fn();
    Object.assign(mercuryPainter, {
      materials: [],
      body: mercuryBody,
      light: mercuryLight,
    });
    const mercurySurface = { draw: vi.fn() };
    const venusPainter = Object.create(
      CloudBodyPainter.prototype,
    ) as CloudBodyPainter;
    const venusBody = vi.fn();
    const venusLight = vi.fn();
    const atmosphere = vi.fn();
    Object.assign(venusPainter, { materials: [] });
    Object.assign(venusPainter, {
      body: venusBody,
      light: venusLight,
      atmosphere,
    });
    const venusSurface = { draw: vi.fn() };
    const bodyAppearances = practicePlanetAppearances([mercury, venus], {
      mercury: { painter: mercuryPainter, surface: mercurySurface },
      venus: { painter: venusPainter, surface: venusSurface },
    });
    const renderer = { drawPlanet: vi.fn() };
    const frame = {
      bodyAppearances,
      camera: {
        zoom: 0.5,
        getViewRect: () => ({ x: 0, y: 0, width: 100, height: 100 }),
      },
      renderer,
      sim: {
        planets: [mercury, venus],
        star: { pos: new Vec2(40, 50) },
        ticks: 9,
      },
    } as unknown as FlightFrame;
    const ctx = {} as CanvasRenderingContext2D;
    const appearancesBeforeDraw = frame.bodyAppearances;

    pass("planets").draw(frame, ctx);
    expect(mercurySurface.draw).not.toHaveBeenCalled();
    expect(mercuryBody).not.toHaveBeenCalled();
    expect(venusSurface.draw).toHaveBeenCalledTimes(1);
    expect(venusBody).toHaveBeenCalledTimes(1);
    expect(atmosphere).toHaveBeenCalledTimes(1);

    venus.pos.x = -10.651;
    pass("planets").draw(frame, ctx);
    expect(venusSurface.draw).toHaveBeenCalledTimes(1);
    expect(atmosphere).toHaveBeenCalledTimes(1);

    mercury.pos.x = -10;
    pass("planets").draw(frame, ctx);
    expect(mercurySurface.draw).toHaveBeenCalledWith(
      (9 * STEP * 2 * Math.PI) / PRACTICE_MERCURY_SPIN_SECONDS,
      10,
    );
    expect(mercuryBody).toHaveBeenCalledWith(ctx, 0, -10, 50, 10);

    mercury.pos.x = -10.01;
    pass("body-light").draw(frame, ctx);
    expect(mercuryLight).not.toHaveBeenCalled();
    mercury.pos.x = -10;
    pass("body-light").draw(frame, ctx);
    expect(mercuryLight).toHaveBeenCalledTimes(1);
    expect(venusLight).not.toHaveBeenCalled();
    expect(frame.bodyAppearances).toBe(appearancesBeforeDraw);
    expect(renderer.drawPlanet).not.toHaveBeenCalled();
  });
});
