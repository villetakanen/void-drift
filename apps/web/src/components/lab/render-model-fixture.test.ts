import { ASSEMBLED_ION_DEFAULTS, ION_CANNON } from "@void-drift/mode-a";
import { describe, expect, it } from "vitest";
import {
  advanceRenderModelHeading,
  createRenderModelFixture,
  isIonBeamPulseActive,
  RENDER_MODEL_CENTER,
} from "./render-model-fixture";

describe("render model Wasp fixture", () => {
  it("completes and wraps a full turn at the production turn rate", () => {
    const fullTurn = 360 / ASSEMBLED_ION_DEFAULTS.maxTurn;
    expect(advanceRenderModelHeading(0, fullTurn / 2)).toBeCloseTo(Math.PI);
    expect(advanceRenderModelHeading(0, fullTurn)).toBeCloseTo(0);
    expect(
      advanceRenderModelHeading(Math.PI * 1.9, fullTurn * 0.1),
    ).toBeCloseTo(Math.PI * 0.1);
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

  it("uses the fitted engine's production plume and advances its thrust time", () => {
    const ion = createRenderModelFixture();
    const plasma = createRenderModelFixture(RENDER_MODEL_CENTER, "plasma");
    ion.advance(1 / 60, 0);
    plasma.advance(1 / 60, 0);
    expect(plasma.emitters[0].style).not.toBe(ion.emitters[0].style);
    expect(plasma.emitters[0].style).toBe("plasma");
    const elapsed = plasma.emitters[0].thrustSeconds ?? 0;
    plasma.advance(1 / 60, 0);
    expect(plasma.emitters[0].thrustSeconds).toBeGreaterThan(elapsed);
    plasma.advance(0, 0);
    expect(plasma.emitters[0].thrustSeconds).toBe(0);
  });

  it("matches the production cannon flash and cooldown cadence", () => {
    const { cooldown, flashSeconds } = ION_CANNON;
    expect(isIonBeamPulseActive(0)).toBe(true);
    expect(isIonBeamPulseActive(flashSeconds * 0.99)).toBe(true);
    expect(isIonBeamPulseActive(flashSeconds)).toBe(false);
    expect(isIonBeamPulseActive(cooldown)).toBe(true);
    expect(isIonBeamPulseActive(cooldown + flashSeconds)).toBe(false);
  });
});
