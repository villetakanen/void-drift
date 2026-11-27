import type { FxBench } from "../../packages/mode-a/src/lib/fx-bench";
import { expect, test } from "../helpers/local-browser";

const modeAPath = (testDir: string) =>
  `/@fs/${new URL("../../packages/mode-a/src/index.ts", `file://${testDir}/`).pathname}`;

test("production FX restores canvas state and only reads gameplay state", async ({
  page,
}, testInfo) => {
  await page.goto("/lab/fx");
  const result = await page.evaluate(async (path) => {
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
  }, modeAPath(testInfo.project.testDir));
  expect(result.restored).toBe(true);
  expect(result.unchanged).toBe(true);
  expect(result.used).toBeGreaterThan(0);
});

test("mixed-scene profiles keep their intended sources active through the loop", async ({
  page,
}, testInfo) => {
  await page.goto("/lab/fx");
  const result = await page.evaluate(async (path) => {
    const { FxBench: Bench } = (await import(path)) as {
      FxBench: typeof FxBench;
    };
    const bench = new Bench();
    return (["baseline", "mixed", "fission-heavy", "weapons"] as const).map(
      (workload) => {
        bench.reset(workload);
        const seen = bench.ships.map(() => 0);
        return Array.from({ length: 4 }, () => {
          let coincidentIgnitions = 0;
          let plasma = false;
          let mixed = false;
          let laser = false;
          let turret = false;
          let twin = false;
          let collector = false;
          for (let tick = 0; tick < 120; tick++) {
            bench.step();
            coincidentIgnitions = Math.max(
              coincidentIgnitions,
              bench.ignitionCount,
            );
            for (const [index, sim] of bench.ships.entries()) {
              const chargingOrFiring = sim.emitters.some(
                (e) =>
                  e.style === "plasma" && (e.output > 0 || (e.charge ?? 0) > 0),
              );
              plasma ||= chargingOrFiring;
              mixed ||=
                chargingOrFiring &&
                sim.fissionIgnitions.length > 0 &&
                sim.emitters.some((e) => e.style !== "plasma" && e.output > 0);
              collector ||= sim.gravityCollectionRate > 0;
              let cannons = 0;
              for (const event of sim.salvage?.events ?? []) {
                if (event.id <= seen[index]) continue;
                seen[index] = event.id;
                laser ||= event.kind === "laser";
                turret ||= event.kind === "point-defence";
                if (event.kind === "ion-cannon") cannons++;
              }
              twin ||= cannons >= 2;
            }
          }
          return {
            coincidentIgnitions,
            plasma,
            mixed,
            laser,
            turret,
            twin,
            collector,
          };
        });
      },
    );
  }, modeAPath(testInfo.project.testDir));
  const [baseline, mixed, heavy, weapons] = result;
  for (const window of baseline) {
    expect(window).toMatchObject({
      coincidentIgnitions: 0,
      plasma: true,
      laser: false,
      turret: false,
      twin: false,
    });
  }
  for (const [index, window] of mixed.entries()) {
    expect(window).toMatchObject({
      mixed: true,
      laser: false,
      turret: false,
      twin: false,
    });
    expect(heavy[index]).toMatchObject({
      plasma: true,
      laser: false,
      turret: false,
      twin: false,
    });
    expect(heavy[index].coincidentIgnitions).toBeGreaterThan(
      window.coincidentIgnitions,
    );
  }
  for (const window of weapons) {
    expect(window).toMatchObject({
      coincidentIgnitions: 0,
      laser: true,
      turret: true,
      twin: true,
      collector: true,
    });
  }
});
