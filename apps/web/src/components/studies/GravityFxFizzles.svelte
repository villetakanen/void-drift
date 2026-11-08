<script lang="ts">
import { paintIonBeam } from "@void-drift/core";
import { drawUtilityArtwork } from "@void-drift/mode-a";
import { onMount } from "svelte";

let { label = "Pixel field sketches" }: { label?: string } = $props();
let host: HTMLElement;
let time = $state(0);
let playing = $state(false);
let engines = $state(true);
let paint = () => {};
const proposals = [
  {
    title: "D / Inward static",
    note: "A broad grainy field concentrates toward the aperture. Small fizzles accumulate on the incoming side, then disappear into conversion.",
  },
  {
    title: "E / Granular fold",
    note: "A volume of scattered pixels shears and tumbles around the device. The fold is visible through shifting density, with no drawn contours.",
  },
  {
    title: "F / Downstream fallout",
    note: "Intake stays invisible. Pixels appear beyond the coil, then spread toward the other end of the field: visible residue of an unseen conversion.",
  },
  {
    title: "G / Broken-space wake",
    note: "An invisible gathering front crosses the incoming region. Stationary patches of static remain where it passed, then dissolve. Space remembers the event.",
  },
];
const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 41.7) * 43758.5453;
  return v - Math.floor(v);
};
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
      // Fixed births and analytic trajectories make scrubbing reproducible.
      for (let i = 0; i < 800; i++) {
        const birth = 1 + i / 200;
        const age = time - birth;
        const lifetime = 0.7 + noise(i + 6) * 0.8;
        if (age < 0 || age >= lifetime) continue;
        const p = age / lifetime;
        const spread = noise(i + 30) * 2 - 1;
        const flicker = noise(i * 17 + Math.floor(time * 14));
        if (flicker < 0.23) continue;
        let x = 0;
        let y = 0;
        if (index === 0) {
          x = 65 + 185 * (1 - (1 - p) ** 1.8);
          y = 130 + spread * (65 * (1 - p) + 3) + Math.sin(p * 8 + i) * 4;
        } else if (index === 1) {
          const angle =
            noise(i + 90) * Math.PI * 2 + age * (spread > 0 ? 2 : -2);
          const radius =
            12 + Math.sqrt(noise(i + 50)) * 65 * Math.sin(p * Math.PI);
          x = 250 + Math.cos(angle) * radius;
          y =
            130 +
            Math.sin(angle) *
              radius *
              (0.45 + 0.3 * Math.sin(time + radius / 20));
        } else if (index === 2) {
          x = 270 + p * 125;
          y = 130 + spread * (6 + p * 65);
        } else {
          // Static sites, not particles travelling along the collection route.
          const front = ((birth - 1) % 1.3) / 1.3;
          const cell = Math.floor(front * 14);
          x = 55 + cell * 13 + Math.floor(noise(i + 5) * 4) * 3;
          y = 130 + Math.round((spread * (55 - front * 30)) / 3) * 3;
        }
        light.globalAlpha =
          clamp((birth - 1) * 2) *
          Math.sin(p * Math.PI) *
          (0.2 + flicker * 0.55);
        light.fillStyle =
          i % 7 === 0 ? "#eedbff" : i % 3 === 0 ? "#8566d9" : "#c783ff";
        const size = i % 9 === 0 ? 3 : 1.5;
        light.fillRect(Math.round(x), Math.round(y), size, size);
      }

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
