<script lang="ts">
import { FxSurface } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  SALVAGE,
  type SalvageBody,
  SalvageSystem,
  Simulation,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { createDraftPainter } from "../derelict-draft-two/renderer";
import { studyStarterWasp } from "../starter-wasp-fixture";

let {
  label = "Intact derelict beside two controlled energy-release proposals",
}: { label?: string } = $props();
let canvas: HTMLCanvasElement;
let time = $state(0.6);
let playing = $state(false);
let render = () => {};
const scale = 110 / 140;
const pieces = [
  {
    x: 87,
    y: 118,
    path: "M72 75H100L102 130 98 151 87 148 72 155Z",
    vx: -1,
    vy: -0.65,
  },
  {
    x: 114,
    y: 118,
    path: "M100 75H132V155L114 148 98 151 102 130Z",
    vx: 1,
    vy: -0.65,
  },
  {
    x: 87,
    y: 185,
    path: "M72 155L87 148 98 151 103 179 100 225H72Z",
    vx: -1,
    vy: 0.65,
  },
  {
    x: 114,
    y: 185,
    path: "M98 151L114 148 132 155V225H100L103 179Z",
    vx: 1,
    vy: 0.65,
  },
];
onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const painter = createDraftPainter();
  const build = studyStarterWasp();
  const paths = pieces.map((p) => new Path2D(p.path));
  function frames(eject: boolean) {
    const sim = new Simulation({
      ...stockSettings("wasp"),
      loadout: build,
      mode: "practice",
      seed: 2026,
    });
    sim.ship.pos.set(100, 100);
    const system = new SalvageSystem(build, 2026);
    system.nextPass = Infinity;
    system.weapons.length = 0;
    system.bodies = pieces.map(
      (p, i): SalvageBody => ({
        id: i + 1,
        group: 1,
        kind: "fragment",
        x: 600 + (p.x - 101) * scale,
        y: 540 + (p.y - 150) * scale,
        previousX: 0,
        previousY: 0,
        vx: p.vx * SALVAGE.fragment.speed * 0.65,
        vy: p.vy * SALVAGE.fragment.speed * 0.65,
        radius: SALVAGE.fragment.radius,
        hull: SALVAGE.fragment.hull,
        rotation: 0,
      }),
    );
    system.bodies.push({
      id: 5,
      group: 1,
      kind: "cell",
      x: 600 + (100.05 - 101) * scale,
      y: 540 + (154.15 - 150) * scale,
      previousX: 0,
      previousY: 0,
      vx: 0,
      vy: eject ? -45 : 0,
      radius: SALVAGE.cell.radius,
      hull: 1,
      life: SALVAGE.cell.life,
      rotation: 0,
    });
    const result = [system.bodies.map((b) => ({ ...b }))];
    for (let tick = 1; tick <= 72; tick++) {
      system.step(
        1 / 60,
        sim.ship,
        sim.star,
        sim.state.resources,
        100,
        100,
        100,
        false,
      );
      result.push(system.bodies.map((b) => ({ ...b })));
    }
    return result;
  }
  const variants = [frames(false), frames(true)];
  const scratch = document.createElement("canvas");
  scratch.width = 1080;
  scratch.height = 440;
  const light = scratch.getContext("2d");
  const fx = new FxSurface();
  const position = (
    target: CanvasRenderingContext2D,
    column: number,
    x: number,
    y: number,
  ) => {
    target.translate(
      column * 360 + 180 + (x - 600) * 1.6,
      210 + (y - 540) * 1.6,
    );
  };
  const core = (
    target: CanvasRenderingContext2D,
    column: number,
    tick: number,
  ) => {
    const cell =
      column === 0 ? variants[0][0][4] : variants[column - 1][tick][4];
    position(target, column, cell.x, cell.y);
    target.scale(scale * 1.6, scale * 1.6);
    target.translate(-100.05, -154.15);
  };
  render = () => {
    if (!light) return;
    canvas.width = 1080;
    canvas.height = 440;
    const tick = Math.round(time * 60);
    for (let col = 0; col < 3; col++) {
      drawBuild(
        ctx,
        build,
        col * 360 + 40,
        50,
        -Math.PI / 2,
        BUILD_FLIGHT_SCALE * 1.6,
      );
      if (col === 0 || tick === 0) {
        ctx.save();
        position(ctx, col, 600, 540);
        ctx.scale(scale * 1.6, scale * 1.6);
        ctx.translate(-101, -150);
        painter.hull(ctx);
        ctx.restore();
      } else
        for (let i = 0; i < 4; i++) {
          const body = variants[col - 1][tick][i];
          const piece = pieces[i];
          ctx.save();
          position(ctx, col, body.x, body.y);
          ctx.rotate(body.rotation);
          ctx.scale(scale * 1.6, scale * 1.6);
          ctx.translate(-piece.x, -piece.y);
          ctx.clip(paths[i]);
          painter.hull(ctx);
          ctx.restore();
        }
      ctx.save();
      core(ctx, col, tick);
      painter.core(ctx, time);
      ctx.restore();
    }
    fx.clear();
    for (let n = -30; n <= tick; n++) {
      fx.draw(light, (n + 31) / 60, (target, pass) => {
        for (let col = 0; col < 3; col++) {
          target.save();
          core(target, col, Math.max(0, n));
          painter.light(target, pass, Math.max(0, n) / 60);
          target.restore();
        }
      });
    }
    fx.draw(ctx, (tick + 31) / 60, () => {});
    for (let col = 0; col < 3; col++) {
      ctx.save();
      core(ctx, col, tick);
      painter.aperture(ctx, time);
      ctx.restore();
    }
  };
  render();
  let previous = performance.now();
  let raf = 0;
  const animate = (now: number) => {
    if (playing) {
      time = Math.min(1.2, time + Math.min((now - previous) / 1000, 0.05));
      if (time >= 1.2) playing = false;
    }
    previous = now;
    raf = requestAnimationFrame(animate);
  };
  raf = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(raf);
});
$effect(() => {
  void time;
  render();
});
</script>
<div class="controls">
  <button
    class="btn"
    type="button"
    onclick={() => {
      if (time >= 1.2) time = 0;
      playing = !playing;
    }}
  >
    {playing ? "Pause" : "Play rupture"}
  </button>
  <button
    class="btn"
    type="button"
    onclick={() => {
      playing = false;
      time = 0;
    }}
  >
    Intact / reset
  </button>
  <label
    >After rupture · {time.toFixed(2)} s
    <input
      aria-label="Time after rupture"
      type="range"
      min="0"
      max="1.2"
      step="0.01"
      bind:value={time}
      oninput={() => (playing = false)}
    ></label
  >
</div>
<div class="headings">
  <strong>Intact · 110 units</strong><strong>A · Leave the energy behind</strong
  ><strong>B · Eject the energy</strong>
</div>
<canvas bind:this={canvas} aria-label={label}></canvas>
<style>
.controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
label {
  display: grid;
  gap: var(--spacing-sm);
}
input {
  width: 260px;
  accent-color: var(--color-action);
}
.headings {
  display: grid;
  grid-template-columns: repeat(3, 360px);
  font-family: var(--font-family-ui);
}
canvas {
  display: block;
  width: 1080px;
  height: 440px;
  max-width: none;
  background: var(--color-void);
}
</style>
