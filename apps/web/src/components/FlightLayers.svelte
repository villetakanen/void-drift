<script lang="ts">
import {
  FLIGHT_LAYERS,
  type FlightLayerCanvases,
  type FlightLayerId,
  presentFlightFx,
  type SkySightline,
} from "@void-drift/mode-a";
import { untrack } from "svelte";
import FlightSky from "./FlightSky.svelte";
import {
  DEFAULT_FX_GLOW,
  FX_GLOW_BLEND,
  FX_GLOW_OPACITY,
  type FxGlowTreatment,
} from "./fx-glow";
import TurbulentBloomFilter from "./TurbulentBloomFilter.svelte";
import type { TurbulentBloomSettings } from "./turbulent-bloom";

const instanceId = $props.id();
const bloomFilterId = `flight-layers-bloom-${instanceId}`;

// The flight stage's layers: one canvas per entry of FLIGHT_LAYERS, stacked in
// order and composited by the browser with each layer's blend mode.
let {
  canvases = $bindable({}),
  label,
  blends = {},
  filters = {},
  bloom,
  fxGlow,
  visibility = {},
  sky,
}: {
  canvases?: FlightLayerCanvases;
  /** Names the World canvas; the layers above it are decorative. */
  label: string;
  /** Presentation-only overrides; omitted layers retain production defaults. */
  blends?: Partial<Record<FlightLayerId, string>>;
  filters?: Partial<Record<FlightLayerId, string>>;
  /** Lab-only SVG comparison on the sharp FX canvas. */
  bloom?: TurbulentBloomSettings;
  /** A presentation override or false for a field without derived glow. */
  fxGlow?: FxGlowTreatment | false;
  visibility?: Partial<Record<FlightLayerId, boolean>>;
  sky?: {
    url: string;
    cameraX: number;
    cameraY: number;
    width: number;
    sightline?: Readonly<SkySightline>;
  };
} = $props();
const glow = $derived(
  bloom ? false : (fxGlow ?? (filters.fx === undefined && DEFAULT_FX_GLOW)),
);

// When a Lab selection adds glow to a held frame, paint its current FX image.
$effect(() => {
  const source = canvases.fx;
  const target = canvases.fxGlow;
  if (source && target && target.width === 0) {
    untrack(() => presentFlightFx(source, target));
  }
});
</script>

<div class="flight-layers">
  {#if sky}
    <FlightSky {...sky} />
  {/if}
  {#each FLIGHT_LAYERS as layer (layer.id)}
    <canvas
      bind:this={canvases[layer.id]}
      data-layer={layer.id}
      style:mix-blend-mode={blends[layer.id] ?? layer.blend}
      style:filter={filters[layer.id] ??
        (layer.id === "fx" && bloom ? `url(#${bloomFilterId})` : "none")}
      style:visibility={visibility[layer.id] === false ? "hidden" : "visible"}
      aria-label={layer.id === "world" ? label : undefined}
      aria-hidden={layer.id === "world" ? undefined : true}
    ></canvas>
    {#if layer.id === "fx" && glow}
      <canvas
        bind:this={canvases.fxGlow}
        width="0"
        height="0"
        data-fx-glow={glow.value}
        style:mix-blend-mode={FX_GLOW_BLEND}
        style:opacity={FX_GLOW_OPACITY}
        style:filter={glow.filter}
        style:visibility={visibility.fx === false ? "hidden" : "visible"}
        aria-hidden="true"
      ></canvas>
    {/if}
  {/each}
  {#if bloom}
    <svg
      class="filter-defs"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <TurbulentBloomFilter filterId={bloomFilterId} {...bloom} />
    </svg>
  {/if}
</div>

<style>
/* Its own blending group: layers blend with each other and nothing behind. */
.flight-layers {
  position: relative;
  isolation: isolate;
}
canvas {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
}
canvas:not([data-layer="world"]) {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.filter-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
