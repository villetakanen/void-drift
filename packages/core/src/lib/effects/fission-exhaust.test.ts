import { describe, expect, it, vi } from "vitest";
import { FxBudget, FxPass } from "./arcade-fx";
import { FissionExhaust } from "./fission-exhaust";
import { fxRetention } from "./fx-surface";

function harness() {
  const weights: number[] = [];
  const flashes: number[] = [];
  const lines: number[][] = [];
  const noop = () => {};
  const ctx = {
    canvas: { width: 200, height: 100 },
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    globalAlpha: 1,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: (x: number, y: number) => lines.push([x, y]),
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    fill: () => weights.push(ctx.globalAlpha),
    stroke: () => weights.push(ctx.globalAlpha),
    drawImage: () => flashes.push(ctx.globalAlpha),
  };
  const canvas = ctx as unknown as CanvasRenderingContext2D;
  const pass = new FxPass();
  pass.begin(canvas);
  return { canvas, pass, weights, flashes, lines };
}

const nozzle = { x: 10, y: 50, exhaustAngle: 0 };

describe("Fission exhaust", () => {
  it("paints missed ticks with their original age and never restamps a tick", () => {
    const fission = new FissionExhaust();
    const { canvas, pass, weights } = harness();
    fission.capture(1, [nozzle]);
    fission.capture(1, [nozzle]);
    fission.capture(2, []);
    fission.capture(3, [nozzle]);
    fission.stamp(canvas, pass);
    expect(weights).toHaveLength(8); // 2 marks per active source per elapsed tick.
    expect(weights[0] / weights[2]).toBeCloseTo(fxRetention(1 / 60));
    fission.stamp(canvas, pass);
    expect(weights).toHaveLength(8);
    fission.clear();
    fission.capture(1, [nozzle]);
    fission.stamp(canvas, pass);
    expect(weights).toHaveLength(10);
  });

  it("starts the three-tick flash at 0.20 and keeps every coincident ignition cue", () => {
    const noop = () => {};
    vi.stubGlobal("document", {
      createElement: () => ({
        getContext: () => ({
          translate: noop,
          createRadialGradient: () => ({ addColorStop: noop }),
          beginPath: noop,
          moveTo: noop,
          arc: noop,
          fill: noop,
        }),
      }),
    });
    try {
      const fission = new FissionExhaust();
      const { canvas, pass, flashes, weights } = harness();
      fission.capture(
        1,
        Array.from({ length: 25 * 4 }, () => nozzle),
      );
      for (const [age, alpha] of [0.2, 0.12, 0.06, undefined].entries()) {
        pass.budget.reset();
        flashes.length = weights.length = 0;
        fission.live(canvas, pass, age + 1);
        expect(flashes).toEqual(
          alpha === undefined ? [] : Array(100).fill(alpha),
        );
        expect(weights).toHaveLength(200); // All lances and tips still draw.
        expect(pass.budget.essential).toBe(100);
        expect(pass.budget.dropped).toBe(0);
      }
      pass.budget.reset();
      pass.budget.decoration = FxBudget.DECORATION;
      flashes.length = 0;
      fission.live(canvas, pass, 1);
      expect(flashes).toHaveLength(100);
      expect(pass.budget.essential).toBe(100);
      expect(pass.budget.dropped).toBe(200); // Only the supporting marks yield.
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("retains current FX lances when catch-up and tracks cannot be stamped", () => {
    const fission = new FissionExhaust();
    const { canvas, pass, weights } = harness();
    fission.capture(1, [nozzle]);
    fission.capture(3, [nozzle]);
    pass.budget.decoration = FxBudget.DECORATION;
    fission.stamp(canvas, pass);
    expect(weights).toHaveLength(2);
    expect(pass.budget.essential).toBe(2);
    expect(pass.budget.dropped).toBe(6);
  });

  it("draws visible tips from offscreen nozzles, then lets them expire", () => {
    const fission = new FissionExhaust();
    const { canvas, pass, lines } = harness();
    fission.capture(1, [
      { ...nozzle, x: -55 },
      { ...nozzle, x: -500 },
    ]);
    fission.capture(15, []);
    fission.live(canvas, pass);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every(([x]) => x >= 0)).toBe(true);
    expect(pass.budget.essential).toBe(1);
    const count = lines.length;
    fission.capture(45, []);
    fission.live(canvas, pass);
    expect(lines).toHaveLength(count);
  });

  it("draws a return spark toward its recorded nozzle only from a contact", () => {
    const fission = new FissionExhaust();
    const { canvas, pass, lines } = harness();
    fission.capture(1, []);
    fission.live(canvas, pass);
    expect(lines).toEqual([]);
    fission.capture(2, [], [{ x: 100, y: 50, ignition: nozzle }]);
    fission.live(canvas, pass);
    fission.capture(3, []);
    fission.live(canvas, pass);
    expect(lines[0]).toEqual([98, 50]);
    expect(lines[1][0]).toBeLessThan(98);
  });
});
