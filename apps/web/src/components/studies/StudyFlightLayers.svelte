<script lang="ts">
import type { FlightLayerId } from "@void-drift/mode-a";
import FlightLayers from "../FlightLayers.svelte";

let {
  canvases = $bindable({}),
  label,
  displayScale,
}: {
  canvases?: Partial<Record<FlightLayerId, HTMLCanvasElement>>;
  label: string;
  displayScale: number;
} = $props();

const instanceId = $props.id();
const fxFilterId = `${instanceId}-study-fx-expand`;
// The whole instrument screen is fitted with a CSS transform. Counter that
// fit so the trial remains four displayed CSS pixels at every host size.
const radius = $derived(4 / (displayScale > 0 ? displayScale : 1));
</script>

<FlightLayers
  bind:canvases
  {label}
  blends={{ fx: "screen", lfx: "hard-light" }}
  filters={{
    fx: `url(#${fxFilterId})`,
  }}
/>
<svg class="filter-defs" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter
      id={fxFilterId}
      x="-35%"
      y="-35%"
      width="170%"
      height="170%"
      color-interpolation-filters="sRGB"
    >
      <feMorphology in="SourceGraphic" operator="dilate" {radius} />
    </filter>
  </defs>
</svg>

<style>
.filter-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
