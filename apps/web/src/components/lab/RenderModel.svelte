<script lang="ts">
import { type FxPass, FxSurface, paintBeam } from "@void-drift/core";
import {
  defaultLoadout,
  drawBuild,
  drawDerelictShard,
  drawIonBeamMark,
  FLIGHT_LAYERS,
  type FlightLayerId,
  ION_CANNON,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import FlightLayers from "../FlightLayers.svelte";

const WIDTH = 1920;
const HEIGHT = 1080;
const SAMPLE_SCALE = 7;
let instanceId = $props.id();
const FILTER_ID = `render-model-filter-${instanceId}`;
type FilterKind =
  | "none"
  | "blur"
  | "brightness"
  | "noise"
  | "offset"
  | "spread"
  | "expand";
const FILTERS: readonly { label: string; value: FilterKind }[] = [
  { label: "None", value: "none" },
  { label: "Blur", value: "blur" },
  { label: "Brightness", value: "brightness" },
  { label: "Noise distortion", value: "noise" },
  { label: "Offset", value: "offset" },
  { label: "Offset spread", value: "spread" },
  { label: "Expand", value: "expand" },
];
const VECTOR_FILTERS: readonly FilterKind[] = [
  "noise",
  "offset",
  "spread",
  "expand",
];
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
const artworkBuild = defaultLoadout("fighter");

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
let sample = $state<"artwork" | "circles">("artwork");
let fxFilter = $state<FilterKind>("none");
let lfxFilter = $state<FilterKind>("none");
let fxAmount = $state(10);
let lfxAmount = $state(10);
let filters = $derived<Record<FlightLayerId, string>>({
  world: "none",
  fx: filterValue(fxFilter, fxAmount, "fx"),
  lfx: filterValue(lfxFilter, lfxAmount, "lfx"),
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
function filterValue(kind: FilterKind, amount: number, layer: "fx" | "lfx") {
  if (kind === "blur") return `blur(${amount}px)`;
  if (kind === "brightness") return `brightness(${(100 + amount * 4) / 100})`;
  if (VECTOR_FILTERS.includes(kind))
    return `url(#${FILTER_ID}-${layer}-${kind})`;
  return "none";
}
function filterAmountLabel(kind: FilterKind) {
  if (kind === "blur") return "Blur radius · CSS px";
  if (kind === "brightness") return "Brightness multiplier";
  if (kind === "noise") return "Displacement scale · CSS px";
  if (kind === "offset") return "Offset · CSS px";
  if (kind === "spread") return "Offset spread · CSS px";
  if (kind === "expand") return "Expand radius · CSS px";
  return "Amount";
}
function setFilter(layer: "fx" | "lfx", value: string) {
  if (layer === "fx") fxFilter = value as FilterKind;
  else lfxFilter = value as FilterKind;
}
function setFilterAmount(layer: "fx" | "lfx", value: string) {
  if (layer === "fx") fxAmount = Number(value);
  else lfxAmount = Number(value);
}
function stampFx(ctx: CanvasRenderingContext2D, pass: FxPass) {
  if (sample === "circles") {
    if (!pass.budget.take()) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = pass.opacity;
    for (const [index, x] of [825, 1095].entries()) {
      ctx.fillStyle = COLORS.fx[index];
      ctx.beginPath();
      ctx.arc(x, 540, 175, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  if (!pass.budget.take()) return;
  ctx.save();
  zoomSample(ctx);
  ctx.translate(1040, 540);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = pass.opacity;
  paintBeam(ctx, 3, "ion-light");
  ctx.restore();
}
function zoomSample(ctx: CanvasRenderingContext2D) {
  ctx.translate(WIDTH / 2, HEIGHT / 2);
  ctx.scale(SAMPLE_SCALE, SAMPLE_SCALE);
  ctx.translate(-WIDTH / 2, -HEIGHT / 2);
}
function drawArtworkWorld(world: CanvasRenderingContext2D) {
  world.save();
  world.globalCompositeOperation = "source-over";
  zoomSample(world);
  drawBuild(world, artworkBuild, 946.7, 540, 0, 1);
  drawDerelictShard(world, 975, 540, -0.2, 2);
  world.restore();
}
function drawArtworkLfx(lfx: CanvasRenderingContext2D) {
  lfx.save();
  zoomSample(lfx);
  lfx.translate(850, 544);
  drawIonBeamMark(lfx, ION_CANNON.range, ION_CANNON.range, false);
  lfx.restore();
}
function drawArtwork(
  world: CanvasRenderingContext2D,
  lfx: CanvasRenderingContext2D,
) {
  drawArtworkWorld(world);
  drawArtworkLfx(lfx);
}
function drawCircles(
  world: CanvasRenderingContext2D,
  lfx: CanvasRenderingContext2D,
) {
  drawSamples(world, COLORS.world, [700, 960]);
  drawSamples(lfx, COLORS.lfx, [960, 1220]);
}
function paintFx() {
  const fx = context("fx");
  if (!fx || !surface) return;
  clearLayer(fx);
  surface.draw(fx, presentationTime, stampFx);
}
function paint() {
  const world = context("world");
  const lfx = context("lfx");
  if (!world || !lfx || !surface) return;
  clearLayer(world);
  clearLayer(lfx);
  if (sample === "artwork") drawArtwork(world, lfx);
  else drawCircles(world, lfx);
  hasSample = true;
  presentationTime += 1 / 60;
  paintFx();
}
function chooseSample(next: "artwork" | "circles") {
  if (sample === next) return;
  sample = next;
  clear();
  paint();
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
        if (world) clearLayer(world);
        if (lfx) clearLayer(lfx);
        if (hasSample && world) {
          if (sample === "artwork") drawArtworkWorld(world);
          else drawSamples(world, COLORS.world, [700, 960]);
        } else if (world) clearLayer(world);
        if (hasSample && lfx && sample === "circles")
          drawSamples(lfx, COLORS.lfx, [960, 1220]);
        else if (hasSample && lfx) {
          clearLayer(lfx);
          drawArtworkLfx(lfx);
        } else if (lfx) clearLayer(lfx);
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
        {filters}
        visibility={visible}
        label="Production artwork across World, FX and LFX"
      />
    </div>

    <div class="layers">
      <section class="layer sample-controls">
        <h2>Picture sample</h2>
        <label class="blend"
          >Sample
          <select
            aria-label="Picture sample"
            value={sample}
            onchange={(event) =>
              chooseSample(event.currentTarget.value as "artwork" | "circles")}
          >
            <option value="artwork">Production artwork</option>
            <option value="circles">Colour circles</option>
          </select>
        </label>
      </section>
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
          {#if layer.id === "fx" || layer.id === "lfx"}
            {@const selectedFilter = layer.id === "fx" ? fxFilter : lfxFilter}
            {@const amount = layer.id === "fx" ? fxAmount : lfxAmount}
            <label class="blend"
              >Presentation filter
              <select
                aria-label={`${layer.name} filter`}
                value={selectedFilter}
                onchange={(event) =>
                  setFilter(
                    layer.id as "fx" | "lfx",
                    event.currentTarget.value,
                  )}
              >
                {#each FILTERS as filter (filter.value)}
                  <option value={filter.value}>{filter.label}</option>
                {/each}
              </select>
            </label>
            {#if selectedFilter !== "none"}
              <label class="blend"
                >{filterAmountLabel(selectedFilter)}
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  value={amount}
                  aria-label={`${layer.name} filter amount`}
                  oninput={(event) =>
                    setFilterAmount(
                      layer.id as "fx" | "lfx",
                      event.currentTarget.value,
                    )}
                >
                <output
                  >{selectedFilter === "brightness"
                    ? `${(1 + amount * 0.04).toFixed(2)}×`
                    : `${amount} px`}</output
                >
              </label>
            {/if}
          {/if}
          <fieldset class="swatches">
            {#if sample === "circles"}
              <legend>{layer.name} circle colours</legend>
              {#each COLORS[layer.id] as color}
                <span style={`--swatch:${color}`} title={color}></span>
              {/each}
            {:else}
              <legend>{layer.name} production artwork</legend>
              <span
                >{layer.id === "world"
                  ? "Fighter + shard"
                  : layer.id === "fx"
                    ? "Engine plume"
                    : "Ion cannon ray"}</span
              >
            {/if}
          </fieldset>
        </section>
      {/each}
    </div>
  </div>
  <svg
    class="filter-defs"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {#each [
      { id: "fx", amount: fxAmount },
      { id: "lfx", amount: lfxAmount },
    ] as target (target.id)}
      {#each VECTOR_FILTERS as kind (kind)}
        <filter
          id={`${FILTER_ID}-${target.id}-${kind}`}
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
          color-interpolation-filters="sRGB"
        >
          {#if kind === "noise"}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={target.amount}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          {:else if kind === "offset"}
            <feOffset
              in="SourceGraphic"
              dx={target.amount}
              dy={-target.amount / 2}
            />
          {:else if kind === "spread"}
            <feOffset
              in="SourceGraphic"
              dx={target.amount / 2}
              dy={-target.amount / 2}
              result="a"
            />
            <feOffset
              in="SourceGraphic"
              dx={-target.amount / 2}
              dy={target.amount / 2}
              result="b"
            />
            <feMerge>
              <feMergeNode in="a" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="b" />
            </feMerge>
          {:else}
            <feMorphology
              in="SourceGraphic"
              operator="dilate"
              radius={target.amount}
            />
          {/if}
        </filter>
      {/each}
    {/each}
  </svg>
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
  position: sticky;
  top: var(--spacing-lg);
  align-self: start;
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
.filter-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
.blend output {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.blend input[type="range"] {
  width: 100%;
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
.swatches span:not([style]) {
  width: auto;
  height: auto;
  color: var(--color-text-muted);
  background: none;
  border-radius: 0;
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
