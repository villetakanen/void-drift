import { expect, test } from "../helpers/local-browser";

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
