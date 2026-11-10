import { describe, expect, it } from "vitest";
import {
  advanceRenderModelHeading,
  createRenderModelFixture,
  isIonBeamPulseActive,
  RENDER_MODEL_CENTER,
} from "./render-model-fixture";

describe("render model Wasp fixture", () => {
  it("completes and wraps a full production-rate turn in two seconds", () => {
    expect(advanceRenderModelHeading(0, 1)).toBeCloseTo(Math.PI);
    expect(advanceRenderModelHeading(0, 2)).toBeCloseTo(0);
    expect(advanceRenderModelHeading(Math.PI * 1.9, 0.2)).toBeCloseTo(
      Math.PI * 0.1,
    );
  });

  it("keeps the hull centre fixed and rotates its production plume mounts", () => {
    const fixture = createRenderModelFixture();
    const outletsAtZero: { x: number; y: number; angle: number }[] = [];
    const turningOutputs = fixture.advance(1 / 60, 0);
    fixture.plume.inspect(({ x, y, angle }) =>
      outletsAtZero.push({ x, y, angle }),
    );

    expect(fixture.ship.pos.x).toBe(RENDER_MODEL_CENTER.x);
    expect(fixture.ship.pos.y).toBe(RENDER_MODEL_CENTER.y);
    expect(outletsAtZero).toHaveLength(3);
    expect(fixture.emitters[0].output).toBe(1);
    expect(turningOutputs.stabilizers[0]).toBeGreaterThan(0);
    expect(turningOutputs.stabilizers[1]).toBe(0);
    expect(turningOutputs.stabilizers[2]).toBe(0);
    expect(turningOutputs.stabilizers[3]).toBeGreaterThan(0);

    const outletsAtQuarterTurn: { x: number; y: number; angle: number }[] = [];
    fixture.advance(1 / 60, Math.PI / 2);
    fixture.plume.inspect(({ x, y, angle }) =>
      outletsAtQuarterTurn.push({ x, y, angle }),
    );
    expect(fixture.ship.pos.x).toBe(RENDER_MODEL_CENTER.x);
    expect(fixture.ship.pos.y).toBe(RENDER_MODEL_CENTER.y);
    expect(outletsAtQuarterTurn).toHaveLength(3);
    for (let index = 0; index < outletsAtZero.length; index++) {
      const before = outletsAtZero[index];
      const after = outletsAtQuarterTurn[index];
      expect(after.x - RENDER_MODEL_CENTER.x).toBeCloseTo(
        -(before.y - RENDER_MODEL_CENTER.y),
      );
      expect(after.y - RENDER_MODEL_CENTER.y).toBeCloseTo(
        before.x - RENDER_MODEL_CENTER.x,
      );
      expect(after.angle).toBeCloseTo(before.angle + Math.PI / 2);
    }
  });

  it("matches the production cannon flash and cooldown cadence", () => {
    expect(isIonBeamPulseActive(0)).toBe(true);
    expect(isIonBeamPulseActive(0.079)).toBe(true);
    expect(isIonBeamPulseActive(0.08)).toBe(false);
    expect(isIonBeamPulseActive(1 / 3)).toBe(true);
    expect(isIonBeamPulseActive(1 / 3 + 0.08)).toBe(false);
  });
});
