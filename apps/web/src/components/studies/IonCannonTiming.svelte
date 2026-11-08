<script lang="ts">
import { FxSurface } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

let {
  afterglow = false,
  ranges = false,
  cadence = false,
}: { afterglow?: boolean; ranges?: boolean; cadence?: boolean } = $props();
let canvas: HTMLCanvasElement;
let time = $state(0.28);
let playing = $state(false);
let burst = $state(false);
let render = () => {};
const shots = () => (burst ? [0.25, 0.75, 1.25] : [0.25]);
const cadenceShots = (row: number) =>
  Array.from(
    { length: Math.ceil(1.5 * (row + 1)) },
    (_, i) => 0.25 + i / (row + 1),
  );
const names = $derived(
  cadence
    ? ["1 shot / second", "2 shots / second", "3 shots / second"]
    : ranges
      ? [
          "100 units · 65% afterglow",
          "150 units · 65% afterglow",
          "200 units · 65% afterglow",
        ]
      : afterglow
        ? [
            "B · Original reference",
            "B · 65% residual light",
            "B · 35% residual light",
          ]
        : [
            "A · Clean flash",
            "B · Whole ray afterglow",
            "C · Flash + scattered residue",
          ],
);

onMount(() => {
  if (afterglow) time = 0.35;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const image = new Image();
  image.src = "/studies/light-ion-cannon-2026-11-08/cannon.svg";
  const scratch = document.createElement("canvas");
  scratch.width = 1080;
  scratch.height = 540;
  const light = scratch.getContext("2d");
  if (!light) return;
  const surface = new FxSurface();
  let paintedTick = -1;
  let paintedBurst = false;
  const build = starterLoadout("wasp");
  // A stationary shot fixture: no invented flight or combat simulation.
  const muzzle = 310,
    reach = 450;
  const rowReach = (row: number) =>
    cadence ? 600 : ranges ? [300, 450, 600][row] : reach;
  function ray(
    target: CanvasRenderingContext2D,
    y: number,
    opacity: number,
    length = reach,
  ) {
    target.save();
    target.globalCompositeOperation = "lighter";
    target.globalAlpha *= opacity;
    const gradient = target.createLinearGradient(muzzle, 0, muzzle + length, 0);
    gradient.addColorStop(0, "#eafaff");
    gradient.addColorStop(0.25, "#8cddff");
    gradient.addColorStop(0.65, "#29baff");
    gradient.addColorStop(1, "#29baff00");
    target.strokeStyle = gradient;
    for (const [width, alpha] of [
      [9, 0.09],
      [4, 0.24],
      [1.2, 1],
    ]) {
      target.lineWidth = width;
      target.globalAlpha = opacity * alpha;
      target.beginPath();
      target.moveTo(muzzle, y);
      target.lineTo(muzzle + length, y);
      target.stroke();
    }
    target.restore();
  }
  render = () => {
    ctx.clearRect(0, 0, 1080, 540);
    for (let row = 0; row < 3; row++) {
      const y = 90 + row * 180;
      drawBuild(ctx, build, 230, y + 18, 0, BUILD_FLIGHT_SCALE * 3);
      if (image.complete && image.naturalWidth) {
        ctx.save();
        ctx.translate(muzzle, y);
        ctx.rotate(Math.PI / 2);
        // Exact supplied paths, provisionally 24 world units long.
        ctx.drawImage(image, -9.75, 0, 19.5, 72);
        ctx.restore();
      }
      ctx.strokeStyle = "#28313e";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(muzzle, y + 39);
      ctx.lineTo(muzzle + rowReach(row), y + 39);
      ctx.stroke();
      ctx.font = "12px monospace";
      ctx.fillStyle = "#94a2b8";
      for (let i = 0; i <= rowReach(row) / 150; i++) {
        const x = muzzle + i * 150;
        ctx.fillText(`${i * 50}`, x - 5, y + 60);
        ctx.beginPath();
        ctx.moveTo(x, y + 35);
        ctx.lineTo(x, y + 43);
        ctx.stroke();
      }
    }
    const requestedTick = Math.round(time * 120);
    if (requestedTick < paintedTick || paintedBurst !== burst) {
      surface.clear();
      paintedTick = -1;
    }
    paintedBurst = burst;
    // Advance history incrementally; backward seeking replays the same sequence.
    for (let tick = paintedTick + 1; tick <= requestedTick; tick++) {
      const t = tick / 120;
      light.clearRect(0, 0, 1080, 540);
      surface.draw(light, t + 1 / 120, (target, pass) => {
        if (cadence) {
          for (let row = 0; row < 3; row++) {
            for (const shot of cadenceShots(row)) {
              const age = t - shot;
              if (age >= 0 && age < 0.08 && pass.budget.take(true))
                ray(target, 90 + row * 180, pass.opacity, rowReach(row));
            }
          }
          return;
        }

        for (const shot of shots()) {
          const age = t - shot;
          if (age >= 0 && age < 0.08 && pass.budget.take(true)) {
            if (afterglow || ranges) {
              for (let row = 0; row < 3; row++)
                ray(target, 90 + row * 180, pass.opacity, rowReach(row));
            } else ray(target, 270, pass.opacity);
          }
          if (
            !afterglow &&
            !ranges &&
            Math.abs(age) < 0.001 &&
            pass.budget.take(true)
          ) {
            target.save();
            target.globalAlpha = pass.opacity;
            for (let i = 0; i < 44; i++) {
              const fraction = i / 44;
              target.fillStyle = i % 4 === 0 ? "#eafaff" : "#29baff";
              target.globalAlpha = (1 - fraction) * 0.95;
              target.fillRect(
                muzzle + fraction * reach,
                450 + Math.sin(i * 13) * 4,
                2.4,
                2,
              );
            }
            target.restore();
          }
        }
      });
    }
    paintedTick = requestedTick;
    if (afterglow || ranges || cadence) {
      const latest = shots()
        .filter((shot) => shot <= time)
        .at(-1);
      const age = latest === undefined ? 0 : time - latest;
      // Preserve the original strike for 80 ms, then transition residual gain
      // over 40 ms. Each row retains the production surface's decay curve.
      const transition = Math.max(0, Math.min(1, (age - 0.08) / 0.04));
      (ranges || cadence ? [0.65, 0.65, 0.65] : [1, 0.65, 0.35]).forEach(
        (gain, row) => {
          ctx.save();
          const rowLatest = cadence
            ? cadenceShots(row)
                .filter((shot) => shot <= time)
                .at(-1)
            : undefined;
          const rowTransition = cadence
            ? Math.max(
                0,
                Math.min(
                  1,
                  ((rowLatest === undefined ? 0 : time - rowLatest) - 0.08) /
                    0.04,
                ),
              )
            : transition;
          ctx.globalAlpha = 1 - rowTransition * (1 - gain);
          ctx.drawImage(
            scratch,
            0,
            row * 180,
            1080,
            180,
            0,
            row * 180,
            1080,
            180,
          );
          ctx.restore();
        },
      );
    } else ctx.drawImage(scratch, 0, 0);
    for (const shot of shots()) {
      const age = time - shot;
      if (!afterglow && !ranges && !cadence && age >= 0 && age < 0.08) {
        ray(ctx, 90, 1 - age / 0.08);
        ray(ctx, 450, 1 - age / 0.08);
      }
    }
  };
  image.onload = () => render();
  render();
  let last = performance.now();
  let raf = 0;
  function animate(now: number) {
    if (playing) {
      time = Math.min(1.8, time + Math.min((now - last) / 1000, 0.05));
      if (time >= 1.8) playing = false;
    }
    last = now;
    raf = requestAnimationFrame(animate);
  }
  raf = requestAnimationFrame(animate);
  return () => {
    cancelAnimationFrame(raf);
    image.onload = null;
  };
});
$effect(() => {
  void time;
  void burst;
  render();
});
</script>

<div class="controls">
  <button
    type="button"
    class="btn"
    onclick={() => {
      if (!playing) time = 0;
      playing = !playing;
    }}
  >
    {playing ? "Pause" : "Replay"}
  </button>
  {#if !cadence}
    <label
      ><input type="checkbox" bind:checked={burst}>
      Three shots · 2/s</label
    >
  {/if}
  <label
    >Sequence · {time.toFixed(2)} s
    <input
      aria-label="Shot sequence time"
      type="range"
      min="0"
      max="1.8"
      step="0.005"
      bind:value={time}
      oninput={() => (playing = false)}
    ></label
  >
</div>
<div class="controls">
  {#each [
    { t: 0.28, label: "Flash · 30 ms" },
    { t: 0.35, label: "After · 100 ms" },
    { t: 0.5, label: "After · 250 ms" },
  ] as mark}
    <button
      type="button"
      class="btn"
      onclick={() => {
        playing = false;
        time = mark.t;
      }}
    >
      {mark.label}
    </button>
  {/each}
</div>
<div class="bench">
  <canvas
    width="1080"
    height="540"
    bind:this={canvas}
    aria-label={cadence
      ? "Identical 200-unit ion rays at one, two and three shots per second with selected 65 percent afterglow."
      : ranges
        ? "Identical ion shots at 100, 150 and 200 world units, all with selected 65 percent afterglow."
        : afterglow
          ? "Identical whole-ray shots comparing original, 65 percent and 35 percent residual brightness. Rulers show 0 to 150 world units."
          : "Three identical stationary Wasp ships comparing a clean instant ion flash, whole ray persistence and sparse residue. Rulers show 0 to 150 world units."}
  ></canvas>
  <div class="labels">
    {#each names as name}
      <strong>{name}</strong>
    {/each}
  </div>
</div>
<p class="caption">
  {cadence
    ? "200 world units"
    : ranges
      ? "100 / 150 / 200 world units"
      : "150 world units"}
  · 80 ms flash · 3 px/unit · Wasp at production flight scale ×3 · shot at 0.25
  s{burst ? ", 0.75 s and 1.25 s" : ""}
</p>
<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-lg);
  margin-block: var(--spacing-md);
  font-family: var(--font-family-ui);
}
label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
input {
  accent-color: var(--color-action);
}
.bench {
  position: relative;
  background: var(--color-void);
}
canvas {
  display: block;
  width: 100%;
}
.labels {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  pointer-events: none;
  padding: 16px;
  font: var(--font-size-caption) var(--font-family-ui);
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
</style>
