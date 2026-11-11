<script lang="ts">
import { FLIGHT_LAYERS, type FlightLayerId } from "@void-drift/mode-a";
import TurbulentBloomFilter from "./TurbulentBloomFilter.svelte";
import {
  TURBULENT_BLOOM_DEFAULTS,
  type TurbulentBloomSettings,
} from "./turbulent-bloom";

const instanceId = $props.id();
const bloomFilterId = `flight-layers-bloom-${instanceId}`;

// The flight stage's layers: one canvas per entry of FLIGHT_LAYERS, stacked in
// order and composited by the browser with each layer's blend mode.
let {
  canvases = $bindable({}),
  label,
  blends = {},
  filters = {},
  bloom = TURBULENT_BLOOM_DEFAULTS,
  visibility = {},
}: {
  canvases?: Partial<Record<FlightLayerId, HTMLCanvasElement>>;
  /** Names the World canvas; the layers above it are decorative. */
  label: string;
  /** Presentation-only overrides; omitted layers retain production defaults. */
  blends?: Partial<Record<FlightLayerId, string>>;
  filters?: Partial<Record<FlightLayerId, string>>;
  bloom?: TurbulentBloomSettings;
  visibility?: Partial<Record<FlightLayerId, boolean>>;
} = $props();
</script>

<div class="flight-layers">
  {#each FLIGHT_LAYERS as layer (layer.id)}
    <canvas
      bind:this={canvases[layer.id]}
      data-layer={layer.id}
      style:mix-blend-mode={blends[layer.id] ?? layer.blend}
      style:filter={filters[layer.id] ??
        (layer.id === "fx" ? `url(#${bloomFilterId})` : "none")}
      style:visibility={visibility[layer.id] === false ? "hidden" : "visible"}
      aria-label={layer.id === "world" ? label : undefined}
      aria-hidden={layer.id === "world" ? undefined : true}
    ></canvas>
  {/each}
  <svg
    class="filter-defs"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <TurbulentBloomFilter
      filterId={bloomFilterId}
      glowSize={bloom.glowSize}
      distortion={bloom.distortion}
      strength={bloom.strength}
    />
  </svg>
</div>

<style>
/* Its own blending group: layers blend with each other and nothing behind. */
.flight-layers {
  position: relative;
  isolation: isolate;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
canvas + canvas {
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
