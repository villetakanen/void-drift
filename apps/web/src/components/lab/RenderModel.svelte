<script lang="ts">
import { type FxPass, FxSurface } from "@void-drift/core";
import { FLIGHT_LAYERS, type FlightLayerId } from "@void-drift/mode-a";
import { onMount } from "svelte";
import FlightLayers from "../FlightLayers.svelte";

const WIDTH = 1920;
const HEIGHT = 1080;
type BlendMode =
  | "normal"
  | "plus-lighter"
  | "screen"
  | "multiply"
  | "hard-light";
const BLENDS = [
  { label: "Normal", value: "normal" },
  { label: "Add", value: "plus-lighter" },
  { label: "Screen", value: "screen" },
  { label: "Multiply", value: "multiply" },
  { label: "Hard light", value: "hard-light" },
] as const satisfies readonly { label: string; value: BlendMode }[];
const COLORS = {
  world: ["#ff426f", "#ffc857"],
  fx: ["#52eaff", "#a875ff"],
  lfx: ["#b8ff52", "#ff8d3a"],
} satisfies Record<FlightLayerId, readonly [string, string]>;

let { label = "Render model" }: { label?: string } = $props();
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let blends = $state<Record<FlightLayerId, string>>(
  Object.fromEntries(
    FLIGHT_LAYERS.map(({ id, blend }) => [id, blend]),
  ) as Record<FlightLayerId, BlendMode>,
);
let visible = $state<Record<FlightLayerId, boolean>>({
  world: true,
  fx: true,
  lfx: true,
});
let running = $state(false);
let hasSample = $state(false);
let ready = $state(false);
let presentationTime = 0;
let surface: FxSurface | undefined;
let frame = 0;

function context(id: FlightLayerId) {
  return canvases[id]?.getContext("2d") ?? undefined;
}
function resolution(id: FlightLayerId) {
  return FLIGHT_LAYERS.find((layer) => layer.id === id)?.resolution ?? 1;
}
function clearLayer(ctx: CanvasRenderingContext2D) {
  ctx.resetTransform();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(
    resolution(ctx.canvas.dataset.layer as FlightLayerId),
    0,
    0,
    resolution(ctx.canvas.dataset.layer as FlightLayerId),
    0,
    0,
  );
}
function drawSamples(
  ctx: CanvasRenderingContext2D,
  colors: readonly [string, string],
  centers: readonly [number, number],
) {
  ctx.save();
  ctx.resetTransform();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const scale = resolution(ctx.canvas.dataset.layer as FlightLayerId);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  for (const [index, x] of centers.entries()) {
    ctx.fillStyle = colors[index];
    ctx.beginPath();
    ctx.arc(x, 540, 190, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function stampFx(ctx: CanvasRenderingContext2D, pass: FxPass) {
  if (!pass.budget.take()) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = pass.opacity;
  ctx.fillStyle = COLORS.fx[0];
  ctx.beginPath();
  ctx.arc(825, 540, 175, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.fx[1];
  ctx.beginPath();
  ctx.arc(1095, 540, 175, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function paint() {
  const world = context("world");
  const fx = context("fx");
  const lfx = context("lfx");
  if (!world || !fx || !lfx || !surface) return;
  drawSamples(world, COLORS.world, [700, 960]);
  drawSamples(lfx, COLORS.lfx, [960, 1220]);
  hasSample = true;
  presentationTime += 1 / 60;
  clearLayer(fx);
  surface.draw(fx, presentationTime, stampFx);
}
function clear() {
  for (const id of FLIGHT_LAYERS.map((layer) => layer.id)) {
    const ctx = context(id);
    if (ctx) {
      ctx.resetTransform();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }
  surface?.clear();
  hasSample = false;
}
function setRunning(next: boolean) {
  running = next;
  if (next) {
    let last: number | undefined;
    const tick = (now: number) => {
      if (!running) return;
      if (last !== undefined) {
        presentationTime += Math.min(0.1, Math.max(0, (now - last) / 1000));
        const fx = context("fx");
        const world = context("world");
        const lfx = context("lfx");
        if (hasSample && world) drawSamples(world, COLORS.world, [700, 960]);
        else if (world) clearLayer(world);
        if (hasSample && lfx) drawSamples(lfx, COLORS.lfx, [960, 1220]);
        else if (lfx) clearLayer(lfx);
        if (fx) {
          clearLayer(fx);
          surface?.draw(fx, presentationTime, () => {});
        }
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  } else cancelAnimationFrame(frame);
}

onMount(() => {
  let disposed = false;
  const initialize = () => {
    if (disposed) return;
    for (const { id, resolution } of FLIGHT_LAYERS) {
      const canvas = canvases[id];
      if (!canvas) throw new Error(`Missing ${id} FlightLayers canvas binding`);
      canvas.width = Math.round(WIDTH * resolution);
      canvas.height = Math.round(HEIGHT * resolution);
    }
    surface = new FxSurface();
    paint();
    ready = true;
  };
  const initializeFrame = requestAnimationFrame(initialize);
  return () => {
    disposed = true;
    cancelAnimationFrame(initializeFrame);
    running = false;
    cancelAnimationFrame(frame);
    surface?.clear();
  };
});
</script>

<section
  class="render-model"
  aria-label={label}
  data-ready={ready}
  data-running={running}
>
  <header>
    <div>
      <p class="eyebrow">Rendering workbench</p>
      <h1>{label}</h1>
      <p>
        Compare how the browser combines World, accumulated FX and fresh LFX.
      </p>
    </div>
    <fieldset class="transport">
      <legend>Picture controls</legend>
      <button type="button" class="btn btn-primary" onclick={paint}>
        Paint
      </button>
      <button
        type="button"
        class="btn btn-ghost"
        onclick={() => setRunning(!running)}
      >
        {running ? "Pause" : "Run"}
      </button>
      <button type="button" class="btn btn-ghost" onclick={clear}>Clear</button>
    </fieldset>
  </header>

  <div class="workbench">
    <div class="pane">
      <FlightLayers
        bind:canvases
        {blends}
        visibility={visible}
        label="Overlapping sample marks across World, FX and LFX"
      />
    </div>

    <div class="layers">
      {#each FLIGHT_LAYERS as layer (layer.id)}
        <section class="layer" data-layer-controls={layer.id}>
          <div class="layer-heading">
            <h2>{layer.name}</h2>
            <label class="visibility"
              ><input type="checkbox" bind:checked={visible[layer.id]}>
              Visible</label
            >
          </div>
          <p>
            {layer.id === "world"
              ? "Ordinary drawing, cleared and redrawn."
              : layer.id === "fx"
                ? "Accumulated light that fades while Run is active."
                : "Fresh light redrawn without image history."}
          </p>
          <label class="blend"
            >Blend with layers beneath
            <select
              aria-label={`${layer.name} blend mode`}
              bind:value={blends[layer.id]}
            >
              {#each BLENDS as blend (blend.value)}
                <option value={blend.value}>{blend.label}</option>
              {/each}
            </select>
          </label>
          <fieldset class="swatches">
            <legend>{layer.name} sample colours</legend>
            {#each COLORS[layer.id] as color}
              <span style={`--swatch:${color}`} title={color}></span>
            {/each}
          </fieldset>
        </section>
      {/each}
    </div>
  </div>
  <p class="note">
    Blend changes recomposite the held picture. Paint adds one fresh set of
    light; Run advances its presentation clock and Pause holds it. Clear empties
    all three layers.
  </p>
</section>

<style>
.render-model {
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-lg);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}
h1 {
  margin: 0;
  font-size: var(--font-size-heading);
}
header p {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-muted);
}
.eyebrow {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
}
.transport {
  display: flex;
  gap: var(--spacing-sm);
  border: 0;
}
.transport legend {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.pane {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: #080b12;
}
.workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 350px);
  gap: var(--spacing-lg);
  align-items: start;
}
.pane :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
.layers {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.layer {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-subtle);
}
.layer-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}
h2 {
  margin: 0;
  font-size: var(--font-size-label);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
}
.layer p,
.note {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  line-height: 1.5;
}
.blend {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--font-size-label);
}
select {
  padding: var(--spacing-xs) var(--spacing-sm);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font: inherit;
}
.visibility {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  font-size: var(--font-size-label);
}
input {
  accent-color: var(--color-action);
}
.swatches {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
  border: 0;
  padding: 0;
}
.swatches legend {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.swatches span {
  display: block;
  width: 1.2rem;
  height: 1.2rem;
  background: var(--swatch);
  border-radius: 50%;
}
.note {
  margin: var(--spacing-md) 0 0;
}
@media (max-width: 1100px) {
  header {
    align-items: start;
    flex-direction: column;
  }
  .workbench {
    grid-template-columns: 1fr;
  }
  .layers {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
