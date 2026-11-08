<script lang="ts">
import type { Action } from "svelte/action";
import {
  drawSizingShip,
  type EquipmentLayer,
  type SizingShip,
  type SizingView,
  sizingFleet,
  sizingViews,
} from "./fleet-sizing";

let { label = "Gravity coil fleet sizing" }: { label?: string } = $props();
let percent = $state(100);
let layer = $state<EquipmentLayer>("production");
const coilScale = $derived(percent / 200);
interface Paint {
  ship: SizingShip;
  view: SizingView;
  coilScale: number;
  layer: EquipmentLayer;
}
const paint: Action<HTMLCanvasElement, Paint> = (canvas, initial) => {
  let settings = initial;
  const draw = () => {
    const { ship, view, coilScale, layer } = settings;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(view.width * ratio);
    canvas.height = Math.round(view.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    drawSizingShip(ctx, ship, view, coilScale, layer);
  };
  draw();
  window.addEventListener("resize", draw);
  return {
    update(next) {
      settings = next;
      draw();
    },
    destroy() {
      window.removeEventListener("resize", draw);
    },
  };
};
function reset() {
  percent = 100;
  layer = "production";
}
</script>

<section class="sizing-tool" aria-label={label}>
  <div class="controls">
    <label class="size">
      <span
        >Coil size
        <output for="coil-fleet-size">{percent}% · selected</output></span
      >
      <input
        id="coil-fleet-size"
        aria-label="Coil size"
        type="range"
        min="25"
        max="200"
        step="5"
        bind:value={percent}
        disabled
      >
    </label>
    <label
      >Equipment layer
      <select aria-label="Equipment layer" bind:value={layer}>
        <option value="production">Ship’s normal layer</option>
        <option value="above">Above hull · comparison</option>
      </select>
    </label>
    <button type="button" onclick={reset}>Reset view</button>
  </div>
  <p class="current">
    One size across the fleet · {percent}% of the selected reference. The ship
    views stay at their labelled scales; 1× is one ship drawing unit per CSS
    pixel at 100% browser zoom.
  </p>
  <div class="fleet">
    {#each sizingFleet as ship}
      <article
        data-sizing-ship={ship.chassis}
        data-engine-count={ship.engines.length}
        data-coil-count={ship.coils.length}
      >
        <h4>{ship.chassis}</h4>
        <p class="fit-count">
          {ship.engines.length}
          Light {ship.engines.length === 1 ? "ion" : "ions"} ·
          {ship.coils.length}
          {ship.coils.length === 1 ? "coil" : "coils"}<br>
          {layer === "production" && ship.belowHull
            ? "Equipment below hull"
            : "Equipment above hull"}
        </p>
        <div class="views">
          {#each sizingViews as view}
            <figure
              class:enlarged={view.scale === 3}
              role="img"
              aria-label={`${ship.chassis}: ${ship.engines.length} Light ${ship.engines.length === 1 ? "ion" : "ions"} and ${ship.coils.length} M ${ship.coils.length === 1 ? "coil" : "coils"}, ${view.label}, coil size ${percent}%`}
            >
              <figcaption>{view.label}</figcaption>
              <div class="canvas-scroll">
                <canvas
                  use:paint={{ ship, view, coilScale, layer }}
                  width={view.width}
                  height={view.height}
                  style:width={`${view.width}px`}
                  style:height={`${view.height}px`}
                  data-view-scale={view.scale}
                  data-coil-scale={coilScale}
                  data-layer={layer}
                  aria-hidden="true"
                ></canvas>
              </div>
            </figure>
          {/each}
        </div>
      </article>
    {/each}
  </div>
  <p class="current">
    Engine-compatible slots, including universal aft slots, receive Light ions.
    Every remaining equipment-compatible slot receives M. Wasp and Scout
    normally carry equipment below the hull; use the comparison layer to inspect
    concealed parts. Mount positions stay fixed in this preserved sizing view.
  </p>
</section>

<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 16px;
  background: var(--color-void);
  border: 1px solid var(--color-border);
}
label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font: 14px var(--font-family-ui);
}
.size {
  flex: 1 1 260px;
}
.size span {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
output {
  font-variant-numeric: tabular-nums;
}
input {
  width: 100%;
  min-height: 32px;
  accent-color: var(--color-action);
}
select,
button {
  font: 14px var(--font-family-ui);
  padding: 10px 12px;
  background: var(--color-elev-1);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  min-height: 44px;
}
button {
  cursor: pointer;
}
:where(input, select, button):focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 3px;
}
.current {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-muted);
  margin-block: 16px;
}
.fleet {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
article {
  min-width: 0;
  border: 1px solid var(--color-border);
  padding-block: 16px;
}
h4 {
  margin: 0;
  text-transform: capitalize;
  text-align: center;
  font-size: 18px;
}
.fit-count {
  margin: 8px 0 16px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
}
.views {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
figure {
  margin: 0;
  min-width: 0;
}
.enlarged {
  grid-column: 1 / -1;
}
figcaption {
  text-align: center;
  font: 12px var(--font-family-ui);
  color: var(--color-text-muted);
}
.canvas-scroll {
  overflow-x: auto;
}
canvas {
  display: block;
  max-width: none;
  margin-inline: auto;
}
@media (max-width: 1050px) {
  .fleet {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .fleet {
    grid-template-columns: 1fr;
  }
  .controls {
    gap: 12px;
    padding: 12px;
  }
}
</style>
