<script lang="ts">
import { FxSurface, Vec2 } from "@void-drift/core";
import {
  applyBuildEngines,
  BUILD_FLIGHT_SCALE,
  buildMounts,
  drawBuild,
  type EngineTimers,
  starterLoadout,
  weaponPose,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { type BurnId, inputAt, type Track, traces } from "../../lib/instrument";
import MotionInstrumentScreen from "../lab/instrument/MotionInstrumentScreen.svelte";
import "@void-drift/core/styles/buttons.css";

let {
  label = "Ion Cannon flight and world-fixed afterglow",
}: { label?: string } = $props();
let burn = $state<BurnId>("weave");
let tick = $state(75);
let playing = $state(false);
let canvas: HTMLCanvasElement;
let lfxCanvas: HTMLCanvasElement;
let render = () => {};
const build = starterLoadout("wasp");
build.hull[0] = "light-ion-cannon";
const cannonMount = buildMounts(build).find(
  (m) => m.part === "light-ion-cannon",
);
const frames = $derived.by(() => {
  const ship = {
    pos: new Vec2(0, 0),
    vel: new Vec2(0, 0),
    acc: new Vec2(0, 0),
    rotation: 0,
    radius: 16,
  };
  const timers: EngineTimers = {};
  const motion = { velocity: 0 };
  const result = [];
  for (let n = 0; n <= 840; n++) {
    result.push({
      x: ship.pos.x,
      y: ship.pos.y,
      vx: ship.vel.x,
      vy: ship.vel.y,
      spin: (motion.velocity * 180) / Math.PI,
      rotation: ship.rotation,
    });
    const input = inputAt(burn, n);
    for (let sub = 0; sub < 4; sub++) {
      applyBuildEngines(
        ship,
        build,
        { leftThruster: input.left, rightThruster: input.right, fire: false },
        1 / 240,
        true,
        timers,
        1,
        motion,
      );
      ship.pos.x += ship.vel.x / 240;
      ship.pos.y += ship.vel.y / 240;
    }
  }
  return result;
});
const tracks = $derived<Track[]>([
  {
    label: "Wasp · 200 units · 3 shots/s",
    color: "#8cddff",
    samples: frames,
    traces: traces(frames),
  },
]);
onMount(() => {
  const ctx = canvas.getContext("2d");
  const lfx = lfxCanvas.getContext("2d");
  if (!ctx || !lfx) return;
  const scratch = document.createElement("canvas");
  scratch.width = scratch.height = 672;
  const light = scratch.getContext("2d");
  if (!light) return;
  const surface = new FxSurface();
  let painted = -1;
  let previousFrames: typeof frames | undefined;
  function pose(n: number) {
    const f = frames[n];
    if (!cannonMount) throw new Error("Cannon mount missing");
    const p = weaponPose(
      { pos: new Vec2(f.x, f.y), rotation: f.rotation },
      cannonMount,
    );
    return { x: p.muzzleX, y: p.muzzleY, angle: p.angle };
  }
  function paintRay(
    target: CanvasRenderingContext2D,
    n: number,
    opacity: number,
    dispersal = false,
  ) {
    const p = pose(n);
    target.save();
    target.translate(p.x, p.y);
    target.rotate(p.angle);
    const g = target.createLinearGradient(0, 0, 200, 0);
    g.addColorStop(0, dispersal ? "#8cddff" : "#eafaff");
    g.addColorStop(0.25, "#8cddff");
    g.addColorStop(0.65, "#29baff");
    g.addColorStop(1, "#29baff00");
    target.strokeStyle = g;
    for (const [width, alpha] of dispersal
      ? [
          [3, 0.09],
          [1.333, 0.24],
          [0.4, 0.65],
        ]
      : [
          [3, 0.09],
          [1.333, 0.24],
          [0.4, 1],
        ]) {
      target.lineWidth = width;
      target.globalAlpha = opacity * alpha;
      target.beginPath();
      target.moveTo(0, 0);
      target.lineTo(200, 0);
      target.stroke();
    }
    target.restore();
  }
  render = () => {
    if (previousFrames !== frames || tick < painted) {
      surface.clear();
      painted = -1;
      previousFrames = frames;
    }
    for (let n = painted + 1; n <= tick; n++) {
      const f = frames[n];
      light.resetTransform();
      light.clearRect(0, 0, 672, 672);
      light.setTransform(1, 0, 0, 1, 230 - f.x, 336 - f.y);
      surface.draw(light, (n + 1) / 60, (target, pass) => {
        const shot = 15 + Math.floor((n - 15) / 20) * 20;
        if (shot >= 15 && n - shot < 5 && pass.budget.take(true))
          paintRay(target, n, pass.opacity * 0.65, true);
      });
    }
    painted = tick;
    const f = frames[tick];
    ctx.resetTransform();
    ctx.clearRect(0, 0, 672, 672);
    ctx.setTransform(1, 0, 0, 1, 230 - f.x, 336 - f.y);
    ctx.strokeStyle = "#182330";
    ctx.lineWidth = 1;
    for (let x = Math.floor((f.x - 230) / 50) * 50; x < f.x + 442; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, f.y - 336);
      ctx.lineTo(x, f.y + 336);
      ctx.stroke();
    }
    for (let y = Math.floor((f.y - 336) / 50) * 50; y < f.y + 336; y += 50) {
      ctx.beginPath();
      ctx.moveTo(f.x - 230, y);
      ctx.lineTo(f.x + 442, y);
      ctx.stroke();
    }
    drawBuild(ctx, build, f.x, f.y, f.rotation, BUILD_FLIGHT_SCALE);
    ctx.resetTransform();
    const shot = 15 + Math.floor((tick - 15) / 20) * 20;
    const age = (tick - shot) / 60;
    // Persistent FX contains only dispersal, already dimmed at emission.
    ctx.drawImage(scratch, 0, 0);
    // LFX is a separate, cleared top canvas: no image history or reprojection.
    lfx.resetTransform();
    lfx.clearRect(0, 0, 672, 672);
    lfx.setTransform(1, 0, 0, 1, 230 - f.x, 336 - f.y);
    if (shot >= 15 && tick - shot < 5) paintRay(lfx, tick, 1 - age / (5 / 60));
  };
  render();
  let raf = 0,
    last = performance.now(),
    accumulator = 0;
  function animate(now: number) {
    if (playing) {
      accumulator += Math.min((now - last) / 1000, 0.1);
      const steps = Math.floor(accumulator * 60);
      accumulator -= steps / 60;
      tick = Math.min(840, tick + steps);
      if (tick === 840) playing = false;
    } else accumulator = 0;
    last = now;
    raf = requestAnimationFrame(animate);
  }
  raf = requestAnimationFrame(animate);
  return () => {
    cancelAnimationFrame(raf);
  };
});
$effect(() => {
  void tick;
  void frames;
  render();
});
</script>
<div class="controls">
  <button
    type="button"
    class="btn"
    onclick={() => {
      if (!playing) tick = 0;
      playing = !playing;
    }}
  >
    {playing ? "Pause flight" : "Replay flight"}
  </button>
  <button
    type="button"
    class="btn"
    onclick={() => {
      playing = false;
      tick = 78;
    }}
  >
    Inspect active turn · 1.30 s
  </button>
  <span>50-unit grid · 1 px/unit · camera follows position, not heading</span>
</div>
<MotionInstrumentScreen
  {tracks}
  bind:burn
  bind:tick
  measures={["speed", "acceleration", "turn"]}
  {label}
>
  {#snippet scene(_time)}
    <div class="scene">
      <canvas
        bind:this={canvas}
        width="672"
        height="672"
        aria-label="Production Wasp flight and persistent ion dispersal FX"
      ></canvas>
      <canvas
        class="lfx"
        bind:this={lfxCanvas}
        width="672"
        height="672"
        aria-label="LFX: fresh active ray attached to the current muzzle above the scene"
      ></canvas>
    </div>
  {/snippet}
  <p>
    Production flight laws, unlimited power, no gravity or arena wrap. Choose
    B1, B2 or B3 below the view. Pause playback before scrubbing the time
    cursor.
  </p>
</MotionInstrumentScreen>
<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
  margin-block: var(--spacing-md);
  font-family: var(--font-family-ui);
}
span {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.scene {
  position: relative;
  width: 672px;
  height: 672px;
  background: var(--color-void);
}
canvas {
  display: block;
}
.lfx {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
