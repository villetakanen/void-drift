<script lang="ts">
import { FLIGHT_LAYERS, type FlightLayerId } from "@void-drift/mode-a";

// The flight stage's layers: one canvas per entry of FLIGHT_LAYERS, stacked in
// order and composited by the browser with each layer's blend mode.
let {
  canvases = $bindable({}),
  label,
}: {
  canvases?: Partial<Record<FlightLayerId, HTMLCanvasElement>>;
  /** Names the World canvas; the layers above it are decorative. */
  label: string;
} = $props();
</script>

<div class="flight-layers">
  {#each FLIGHT_LAYERS as layer (layer.id)}
    <canvas
      bind:this={canvases[layer.id]}
      data-layer={layer.id}
      style:mix-blend-mode={layer.blend}
      aria-label={layer.id === "world" ? label : undefined}
      aria-hidden={layer.id === "world" ? undefined : true}
    ></canvas>
  {/each}
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
</style>
