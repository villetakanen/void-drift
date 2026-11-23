import { describe, expect, it } from "vitest";
import { PlasmaVentArea } from "./plasma-vent-area";
import type { SalvageBody } from "./salvage";
import type { PlasmaVentEvent } from "./schemas/salvage";

function outlets(
  x: number,
  y: number,
  vx: number,
  vy: number,
  gap = 0,
): PlasmaVentEvent["outlets"] {
  return [
    { x, y, vx, vy },
    { x, y: y + gap, vx, vy },
  ];
}
function target(x: number, y: number): SalvageBody {
  return {
    kind: "ship",
    id: 7,
    group: 1,
    x,
    y,
    previousX: x,
    previousY: y,
    vx: 0,
    vy: 0,
    radius: 0,
    hull: 100,
    rotation: 0,
  };
}
describe("drifting plasma vent geometry", () => {
  it("preserves entry times in a drifting frame", () => {
    const entry = (drift: number) => {
      const area = new PlasmaVentArea();
      area.emit(
        "rifle",
        0,
        0.3,
        outlets(0, 0, drift + 300, 0),
        outlets(drift * 0.3, 0, drift + 300, 0),
      );
      const body = target(45, 0);
      body.vx = drift;
      const hits: number[] = [];
      area.sweep(0, 0.3, [body], undefined, (_, t) => hits.push(t));
      expect(hits).toHaveLength(1);
      return hits[0];
    };
    const still = entry(0);
    for (const drift of [400, -500]) expect(entry(drift)).toBeCloseTo(still, 3);
  });
  it("sweeps a crossing through both overlapping outlets as one continuous entry", () => {
    const area = new PlasmaVentArea();
    area.emit(
      "rifle",
      0,
      0.3,
      outlets(0, 0, 300, 0, 8),
      outlets(0, 0, 300, 0, 8),
    );
    const body = target(30, -40);
    body.vy = 10000;
    const hits: number[] = [];
    area.sweep(0.2, 0.01, [body], undefined, (_, t) => hits.push(t));
    expect(hits).toHaveLength(1);
  });
  it("counts a second entry when a body crosses a real gap between the two outlets", () => {
    const area = new PlasmaVentArea();
    area.emit(
      "rifle",
      0,
      0.3,
      outlets(0, 0, 300, 0, 30),
      outlets(0, 0, 300, 0, 30),
    );
    const body = target(30, -40);
    body.vy = 10000;
    const hits: number[] = [];
    area.sweep(0.2, 0.01, [body], undefined, (_, t) => hits.push(t));
    expect(hits).toHaveLength(2);
  });
  it("retains earlier trajectories across a turn and excludes empty space between headings", () => {
    const area = new PlasmaVentArea();
    area.emit("rifle", 0, 0.15, outlets(0, 0, 300, 0), outlets(0, 0, 300, 0));
    area.emit(
      "rifle",
      0.15,
      0.15,
      outlets(0, 0, 0, 300),
      outlets(0, 0, 0, 300),
    );
    const bodies = [
      [80, 0],
      [0, 45],
      [40, 40],
      [0, 0],
    ].map(([x, y], id) => ({ ...target(x, y), id }));
    const hits: number[] = [];
    area.sweep(0.4, 0.001, bodies, undefined, (b) => hits.push(b.id));
    expect(hits).toEqual([0, 1]);
    area.sweep(0.661, 0.001, bodies, undefined, () => {
      throw Error("Expired vent hit");
    });
    expect(area.active).toBe(false);
  });

  it("preserves the drift from an intermediate emission during a continuous turn", () => {
    const area = new PlasmaVentArea();
    const duration = 1 / 60;
    const straight = outlets(0, 0, 300, 0);
    const turning = outlets(0, 0, 300, 30);
    area.emit("rifle", 0, duration, straight, turning);
    area.emit("rifle", duration, duration, turning, straight);

    const age = 0.3 - duration;
    const body = target(300 * age, 30 * age);
    const hits: number[] = [];
    area.sweep(0.3, 0.001, [body], undefined, (_, t) => hits.push(t));
    expect(hits).toEqual([0]);
  });
});
