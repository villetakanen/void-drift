import {
  FxBudget,
  FxSparks,
} from "../../packages/core/src/lib/effects/arcade-fx";
import { expect, test } from "../helpers/local-browser";

test("mixed FX scene pauses, resets, bounds overload and supports presentation off", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/lab/fx");
  const scene = page.getByRole("region", { name: "Arcade FX instrument" });
  await expect
    .poll(async () => Number(await scene.getAttribute("data-ticks")))
    .toBeGreaterThan(30);
  await scene
    .getByRole("button", { name: "Overload off", exact: true })
    .click();
  await expect
    .poll(async () => Number(await scene.getAttribute("data-dropped")))
    .toBeGreaterThan(0);
  expect(Number(await scene.getAttribute("data-marks"))).toBeLessThanOrEqual(
    FxBudget.DECORATION,
  );
  expect(
    Number(await scene.getAttribute("data-particles")),
  ).toBeLessThanOrEqual(FxSparks.CAPACITY);
  await expect
    .poll(async () => Number(await scene.getAttribute("data-essential")))
    .toBeGreaterThan(0);
  await scene.getByRole("button", { name: "Pause", exact: true }).click();
  const tick = await scene.getAttribute("data-ticks");
  await page.clock.runFor(150);
  await expect(scene).toHaveAttribute("data-ticks", tick ?? "");
  await scene.getByRole("button", { name: "FX on", exact: true }).click();
  await expect(scene).toHaveAttribute("data-marks", "0");
  await expect(scene).toHaveAttribute("data-essential", "0");
  await scene.getByRole("button", { name: "Reset scene", exact: true }).click();
  await expect(scene).toHaveAttribute("data-ticks", "0");
  await expect(scene).toHaveAttribute("data-particles", "0");
  await scene.getByRole("button", { name: "Run", exact: true }).click();
  await expect
    .poll(async () => Number(await scene.getAttribute("data-ticks")))
    .toBeGreaterThan(0);
});

test("production FX restores canvas state and only reads gameplay state", async ({
  page,
}, testInfo) => {
  await page.goto("/lab/fx");
  const result = await page.evaluate(
    async (path) => {
      const { FxBench } = await import(path);
      const bench = new FxBench();
      for (let i = 0; i < 60; i++) bench.step();
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D context unavailable");
      ctx.translate(10, 20);
      ctx.scale(1.2, 1.2);
      ctx.globalAlpha = 0.3;
      ctx.globalCompositeOperation = "xor";
      ctx.shadowBlur = 4;
      ctx.filter = "opacity(0.7)";
      const state = () =>
        JSON.stringify({
          matrix: Array.from(ctx.getTransform().toFloat64Array()),
          alpha: ctx.globalAlpha,
          blend: ctx.globalCompositeOperation,
          blur: ctx.shadowBlur,
          filter: ctx.filter,
        });
      const before = state(),
        game = JSON.stringify(
          bench.ships.map((sim: { ship: unknown; state: unknown }) => [
            sim.ship,
            sim.state,
          ]),
        );
      bench.drawFx(ctx);
      return {
        restored: before === state(),
        unchanged:
          game ===
          JSON.stringify(
            bench.ships.map((sim: { ship: unknown; state: unknown }) => [
              sim.ship,
              sim.state,
            ]),
          ),
        used: bench.fx.pass.budget.essential,
      };
    },
    `/@fs/${new URL("../../packages/mode-a/src/index.ts", `file://${testInfo.project.testDir}/`).pathname}`,
  );
  expect(result.restored).toBe(true);
  expect(result.unchanged).toBe(true);
  expect(result.used).toBeGreaterThan(0);
});
