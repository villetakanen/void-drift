<script lang="ts">
import { COLOR } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  type BuildMount,
  buildMounts,
  drawBuild,
  LoadoutSchema,
  starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import launcherSvg from "../../../../public/studies/drone-launcher-2026-11-25/02-1-launcher-master.svg?raw";
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import {
  FittingSchema,
  initialSizing,
  MasterSchema,
  SizingSchema,
} from "./sizing";

const storageKey = "study-drone-launcher-02-2-sizing-v1";
const slotNames = ["Forward left", "Forward right", "Aft left", "Aft right"];
const keys = ["hull-0", "hull-1", "aft-0", "aft-1"];
let settings = $state(initialSizing());
let ready = $state(false);
let error = $state("");
let canvas: HTMLCanvasElement;
let flight: HTMLCanvasElement;
let redraw = () => {};
const centreY = $derived(
  Math.max(
    330,
    ((settings.length * settings.anchorPercent) / 100) * settings.zoom +
      5 * BUILD_FLIGHT_SCALE * settings.zoom +
      36,
    48 * BUILD_FLIGHT_SCALE * settings.zoom + 36,
  ),
);
const mainHeight = $derived(
  Math.max(
    540,
    centreY +
      Math.max(
        30 * BUILD_FLIGHT_SCALE * settings.zoom,
        settings.length * (1 - settings.anchorPercent / 100) * settings.zoom +
          17 * BUILD_FLIGHT_SCALE * settings.zoom,
      ) +
      36,
  ),
);
let sourceWidth = $state(8.505661);
let sourceLength = $state(22.138202);
const width = $derived((settings.length * sourceWidth) / sourceLength);

function exportSizing() {
  const result = SizingSchema.parse($state.snapshot(settings));
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "drone-launcher-02-2-sizing.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

onMount(() => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = SizingSchema.safeParse(JSON.parse(saved));
      if (parsed.success) settings = parsed.data;
    }
  } catch {
    /* Storage can be unavailable; inspection still works. */
  }
  const doc = new DOMParser().parseFromString(launcherSvg, "image/svg+xml");
  const parsed = MasterSchema.safeParse({
    bounds: doc.documentElement
      .getAttribute("viewBox")
      ?.split(/\s+/)
      .map(Number),
    faces: [...doc.querySelectorAll("path")].map((p) => ({
      fill: p.getAttribute("fill"),
      path: p.getAttribute("d"),
    })),
  });
  if (!parsed.success) {
    error = "The launcher master could not be read.";
    return;
  }
  const master = parsed.data;
  sourceWidth = master.bounds[2];
  sourceLength = master.bounds[3];
  const faces = master.faces.map((face) => ({
    fill: face.fill,
    path: new Path2D(face.path),
  }));

  function painter(ctx: CanvasRenderingContext2D, mount: BuildMount) {
    const index = keys.indexOf(mount.key);
    if (index < 0 || settings.slots[index] !== "Launcher") return false;
    ctx.save();
    ctx.rotate(Math.PI / 2);
    const scale = settings.length / sourceLength / BUILD_FLIGHT_SCALE;
    ctx.scale(scale, scale);
    ctx.translate(0, (-sourceLength * settings.anchorPercent) / 100);
    for (const face of faces) {
      ctx.fillStyle = face.fill;
      ctx.fill(face.path);
    }
    ctx.restore();
    return true;
  }

  function draw(
    target: HTMLCanvasElement,
    height: number,
    zoom: number,
    labels: boolean,
  ) {
    const w = target.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    target.width = Math.round(w * dpr);
    target.height = Math.round(height * dpr);
    const ctx = target.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const build = starterLoadout("fighter");
    const parts = settings.slots.map((value) =>
      value === "Plasma rifle"
        ? "plasma-rifle"
        : value === "Empty"
          ? null
          : "light-ion-cannon",
    );
    build.hull = parts.slice(0, 2);
    build.aft = parts.slice(2);
    LoadoutSchema.parse(build);
    const mounts = buildMounts(build);
    // The cannon is only a valid carrier for the study painter, never simulated.
    const cy = labels ? centreY : 77;
    drawBuild(
      ctx,
      build,
      w / 2,
      cy,
      -Math.PI / 2,
      BUILD_FLIGHT_SCALE * zoom,
      "",
      undefined,
      mounts,
      undefined,
      true,
      painter,
    );
    if (labels) {
      ctx.font = "12px monospace";
      ctx.textBaseline = "middle";
      for (const mount of mounts.filter((m) => keys.includes(m.key))) {
        const index = keys.indexOf(mount.key);
        const left = index % 2 === 0;
        const x = w / 2 + mount.y * BUILD_FLIGHT_SCALE * zoom;
        const y = cy - mount.x * BUILD_FLIGHT_SCALE * zoom;
        const edge = left ? 12 : w - 12;
        ctx.strokeStyle = COLOR.textMuted;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(left ? edge + 110 : edge - 110, y);
        ctx.stroke();
        ctx.fillStyle = COLOR.textMuted;
        ctx.textAlign = left ? "left" : "right";
        ctx.fillText(slotNames[index], edge, y - 12);
        ctx.fillStyle = COLOR.text;
        ctx.fillText(settings.slots[index], edge, y + 8);
      }
    }
  }
  redraw = () => {
    draw(canvas, mainHeight, settings.zoom, true);
    draw(flight, 130, 1, false);
  };
  const observer = new ResizeObserver(redraw);
  observer.observe(canvas);
  observer.observe(flight);
  ready = true;
  redraw();
  return () => {
    observer.disconnect();
    redraw = () => {};
  };
});

$effect(() => {
  const snapshot = $state.snapshot(settings);
  if (!ready) return;
  redraw();
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(SizingSchema.parse(snapshot)),
    );
  } catch {
    /* Keep controls usable without persistence. */
  }
});
</script>

<div class="bench">
  <div class="controls">
    <h4>Launcher size</h4>
    <RingSlider
      label="Launcher length"
      min={8}
      max={48}
      step={0.1}
      digits={1}
      unit="u"
      bind:value={settings.length}
    />
    <p class="readout">
      {settings.length.toFixed(1)}
      × {width.toFixed(1)} u · proportions locked
    </p>
    <RingSlider
      label="Mount position from nose"
      min={50}
      max={95}
      step={1}
      unit="%"
      bind:value={settings.anchorPercent}
    />
    <p class="note">
      68% is the supplied mounting position. Changing size keeps this point on
      the slot.
    </p>
    <h4>Fighter fittings</h4>
    {#each slotNames as name, i}
      <div class="slot-control">
        <p>{name}</p>
        <SegmentedControl
          label={`${name} fitting`}
          options={FittingSchema.options}
          bind:value={settings.slots[i]}
        />
      </div>
    {/each}
    <RingSlider
      label="Inspection zoom"
      min={4}
      max={10}
      step={0.5}
      digits={1}
      unit="×"
      bind:value={settings.zoom}
    />
    <div class="actions">
      <button
        type="button"
        class="btn"
        onclick={exportSizing}
        disabled={!ready}
      >
        Export sizing
      </button>
      <button
        type="button"
        class="btn"
        onclick={() => (settings = initialSizing())}
      >
        Reset
      </button>
    </div>
    <p class="note">
      Settings stay in this browser. Export keeps a sizing record for the study.
    </p>
  </div>
  <div class="views">
    <p class="view-label">
      Fighter · enlarged {settings.zoom.toFixed(1)}× · actual hull overlap
    </p>
    {#if error}
      <p role="alert">{error}</p>
    {/if}
    <canvas
      bind:this={canvas}
      style:height={`${mainHeight}px`}
      aria-label="Fighter with selected launcher, ion cannon and plasma rifle fittings at inspection scale"
    ></canvas>
    <div class="flight">
      <p class="view-label">Flight scale · 1 CSS pixel per world unit</p>
      <canvas
        bind:this={flight}
        aria-label="The same Fighter fittings at one CSS pixel per world unit"
      ></canvas>
    </div>
  </div>
</div>

<style>
.bench {
  display: grid;
  grid-template-columns: 400px minmax(0, 1fr);
  gap: var(--spacing-lg);
  margin-block: var(--spacing-xl);
  font-family: var(--font-family-ui);
}
.controls {
  padding: var(--spacing-md);
  background: var(--color-elev-1);
  border: 1px solid var(--color-border);
}
h4 {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-body);
}
.controls h4:not(:first-child) {
  margin-top: var(--spacing-lg);
}
.readout,
.note,
.slot-control p,
.view-label {
  font-size: var(--font-size-caption);
}
.note,
.view-label {
  color: var(--color-text-muted);
}
.note {
  margin: var(--spacing-sm) 0 var(--spacing-md);
}
.readout {
  margin: 0 0 var(--spacing-md);
}
.slot-control {
  margin-bottom: var(--spacing-md);
}
.slot-control p {
  margin: 0 0 var(--spacing-xs);
}
.slot-control :global(.segmented-control) {
  font-size: 11px;
}
.actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
.views {
  min-width: 0;
  background: var(--color-void);
  border: 1px solid var(--color-border);
}
.view-label {
  margin: 0;
  padding: var(--spacing-md);
}
canvas {
  display: block;
  width: 100%;
  height: 540px;
}
.flight {
  border-top: 1px solid var(--color-border);
}
.flight canvas {
  height: 130px;
}
</style>
