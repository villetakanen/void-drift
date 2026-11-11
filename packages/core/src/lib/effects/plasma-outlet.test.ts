import { expect, it, vi } from "vitest";
import { Vec2 } from "../physics/Physics";
import { FxPass } from "./arcade-fx";
import { EnginePlume } from "./engine-plume";
import { paintPlasmaCharge } from "./plasma-charge";

vi.mock("./plasma-charge", () => ({ paintPlasmaCharge: vi.fn() }));

it("draws and budgets only an actively charging plasma outlet", () => {
  const plume = new EnginePlume();
  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 1,
  };
  const emitter = {
    style: "plasma" as const,
    x: 0,
    y: 0,
    angle: 0,
    output: 0,
    charge: 0.5,
  };
  const ctx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
  const pass = new FxPass();
  pass.visible = () => true;
  plume.stepMounted(1 / 60, ship, [emitter]);
  plume.stamp(ctx, pass);
  expect(pass.budget.essential).toBeGreaterThan(0);
  const traceBudget = pass.budget.essential;
  expect(paintPlasmaCharge).toHaveBeenCalledTimes(1);
  plume.drawCharge(ctx);
  expect(paintPlasmaCharge).toHaveBeenCalledTimes(2);
  plume.drawCharge(ctx);
  expect(paintPlasmaCharge).toHaveBeenLastCalledWith(ctx, emitter.charge);
  expect(pass.budget.essential).toBe(traceBudget);
  plume.stepMounted(1 / 60, ship, [{ ...emitter, charge: undefined }]);
  plume.stamp(ctx, pass);
  plume.drawCharge(ctx);
  expect(paintPlasmaCharge).toHaveBeenCalledTimes(3);
});
