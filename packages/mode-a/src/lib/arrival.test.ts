import { expect, it } from "vitest";
import { gameSettings, Simulation } from "./simulation";

it("enters moving inward at a position the seed decides", () => {
  const entry = (seed: number) =>
    new Simulation({ ...gameSettings(), arrival: true, seed }).ship;
  const a = entry(7);
  const { x: dx, y: dy } = { x: a.pos.x - 960, y: a.pos.y - 540 };
  expect(dx * a.vel.x + dy * a.vel.y).toBeLessThan(0);
  expect(entry(7).pos).toEqual(a.pos);
  expect(entry(8).pos).not.toEqual(a.pos);
});
