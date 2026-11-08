<script lang="ts">
import { paintIonBeam } from "@void-drift/core";
import { drawUtilityArtwork } from "@void-drift/mode-a";
import { onMount } from "svelte";

let { label = "Conversion motion sketches" }: { label?: string } = $props();
let host: HTMLElement;
let time = $state(0);
let playing = $state(false);
let engines = $state(true);
let paint = () => {};
const proposals = [
  {
    title: "A / Gather",
    note: "Threads arrive from the field direction and converge through the aperture. Conversion reads as continuous intake.",
  },
  {
    title: "B / Fold",
    note: "A local field opens, twists around the coil and contracts. Conversion reads as space being worked.",
  },
];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const phase = () =>
  time < 1
    ? "Idle"
    : time < 2
      ? "Engaging"
      : time < 5
        ? "Converting"
        : time < 6.5
          ? "Releasing"
          : "Idle";

onMount(() => {
  const fx = document.createElement("canvas");
  fx.width = 420;
  fx.height = 260;
  const light = fx.getContext("2d");
  paint = () => {
    if (!light) return;
    const envelope = clamp(time - 1) * clamp((6.5 - time) / 1.5);
    for (const [index, canvas] of Array.from(
      host.querySelectorAll("canvas"),
    ).entries()) {
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.clearRect(0, 0, 420, 260);
      ctx.save();
      ctx.translate(250, 130);
      drawUtilityArtwork(ctx, "gravity", 2);
      ctx.restore();
      ctx.fillStyle = "#83c7d0";
      ctx.font = "12px sans-serif";
      ctx.fillText("FIELD DIRECTION →", 16, 30);
      light.clearRect(0, 0, 420, 260);
      light.globalCompositeOperation = "lighter";
      if (engines) {
        light.save();
        light.translate(320, 155);
        light.scale(3.5, 3.5);
        light.globalAlpha = 0.65;
        paintIonBeam(light, 1, "ion-light");
        light.restore();
      }
      light.strokeStyle = "#c783ff";
      light.fillStyle = "#eedbff";
      if (index === 0) {
        for (let i = 0; i < 12; i++) {
          const p = (time * 0.6 + i / 12) % 1;
          const lane = (i % 3) - 1;
          light.globalAlpha = envelope * Math.sin(p * Math.PI) * 0.85;
          light.lineWidth = 1.8;
          light.beginPath();
          for (let j = 0; j < 10; j++) {
            const q = Math.max(0, p - j * 0.012);
            const x = 40 + 210 * q;
            const y =
              130 + lane * 65 * (1 - q) + Math.sin(q * 6 + time) * 14 * (1 - q);
            if (j === 0) light.moveTo(x, y);
            else light.lineTo(x, y);
          }
          light.stroke();
        }
      } else if (index === 1) {
        for (let i = 0; i < 4; i++) {
          light.globalAlpha = envelope * 0.36;
          light.lineWidth = 1.5;
          light.beginPath();
          light.ellipse(
            250,
            130,
            18 + 55 * envelope,
            10 + 18 * envelope,
            time * 0.8 + (i * Math.PI) / 4,
            0,
            Math.PI * 2,
          );
          light.stroke();
        }
      }
      light.globalAlpha = envelope * 0.6;
      light.lineWidth = 1.5;
      light.beginPath();
      light.arc(250, 130, 12, 0, Math.PI * 2);
      light.stroke();
      light.globalAlpha = 1;
      ctx.drawImage(fx, 0, 0);
    }
  };
  paint();
  let previous = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    if (playing) {
      time = Math.min(8, time + Math.min((now - previous) / 1000, 0.1));
      if (time === 8) playing = false;
    }
    previous = now;
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
});
$effect(() => {
  time;
  engines;
  paint();
});
</script>

<div class="controls">
  <button
    type="button"
    onclick={() => {
      if (time >= 8) time = 0;
      playing = !playing;
    }}
  >
    {playing ? "Pause" : "Play sequence"}
  </button>
  <button
    type="button"
    onclick={() => {
      playing = false;
      time = 0;
    }}
  >
    Reset
  </button>
  <label
    >Time
    <input
      type="range"
      min="0"
      max="8"
      step="0.01"
      bind:value={time}
      oninput={() => (playing = false)}
    ></label
  >
  <output>{time.toFixed(2)} s · {phase()}</output>
  <label><input type="checkbox" bind:checked={engines}> Engine FX</label>
</div>
<section class="sketches" aria-label={label} bind:this={host}>
  {#each proposals as proposal}
    <figure>
      <figcaption>
        <strong>{proposal.title}</strong>
        <p>{proposal.note}</p>
      </figcaption>
      <canvas width="420" height="260" aria-label={proposal.title}></canvas>
    </figure>
  {/each}
</section>
<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-block: 24px;
}
label {
  display: flex;
  align-items: center;
  gap: 8px;
}
button {
  padding: 8px 12px;
  color: var(--color-text);
  background: var(--color-void);
  border: 1px solid var(--color-border);
  cursor: pointer;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 3px;
}
.sketches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: 24px;
}
figure {
  margin: 0;
  border: 1px solid var(--color-border);
  padding: 12px;
}
figcaption {
  min-height: 115px;
}
figcaption p {
  font-size: 14px;
  color: var(--color-text-muted);
}
canvas {
  display: block;
  width: 100%;
  height: auto;
}
</style>
