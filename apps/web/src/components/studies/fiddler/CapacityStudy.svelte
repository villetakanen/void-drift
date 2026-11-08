<script lang="ts">
import { buildMounts, defaultLoadout } from "@void-drift/mode-a";
import Toggle from "../../inputs/Toggle.svelte";
import CapacityDrawing from "./CapacityDrawing.svelte";

let { label = "Capacity comparison view" }: { label?: string } = $props();
let view = $state("Fitted");
let size = $state("Draft");
const scale = $derived(size === "Draft" ? 1 : 1.35);
const cruiserMounts = buildMounts(defaultLoadout("corvette"));
</script>

<div class="controls">
  <Toggle
    {label}
    compact
    options={["Fitted", "Footprints", "Hull"]}
    bind:value={view}
  />
  <Toggle
    label="Fiddler hull size"
    compact
    options={["Draft", "Hull +35%"]}
    bind:value={size}
  />
</div>
<p class="caption">
  Same drawing scale · equipment stays the same size in both ships
</p>
<div class="comparison">
  <figure>
    <figcaption>Existing cruiser · {cruiserMounts.length} mounts</figcaption>
    <CapacityDrawing
      ship="cruiser"
      hullScale={1}
      {view}
      label={`Existing cruiser, ${view.toLowerCase()}, same equipment scale as Fiddler`}
    />
    <p>3 equipment + 3 universal positions, with 2 side engines.</p>
  </figure>
  <figure>
    <figcaption>Fiddler · 10 trial positions</figcaption>
    <CapacityDrawing
      ship="fiddler"
      hullScale={scale}
      {view}
      label={`Fiddler, ${size.toLowerCase()}, ${view.toLowerCase()}, ten trial positions`}
    />
    <p>
      4 items on the blades, 2 on the shoulders, 2 on the rear body, and 2
      engines.
    </p>
  </figure>
</div>
<details class="detail">
  <summary>Inspect Fiddler at larger size</summary>
  <div class="enlarged">
    <CapacityDrawing
      ship="fiddler"
      hullScale={scale}
      {view}
      label={`Enlarged Fiddler, ${size.toLowerCase()}, ${view.toLowerCase()}`}
    />
  </div>
  <p class="caption">
    Inspection enlargement: hull and equipment are magnified together.
  </p>
</details>
<p class="caption" aria-live="polite">
  {size === "Draft"
    ? "Draft uses Wasp’s canopy length as the scale reference: about 91 units from blade tips to tail, close to the cruiser’s 92-unit hull."
    : "Hull +35% enlarges the whole sketch to about 123 units long. Equipment stays fixed; the cockpit grows with the hull in this first size trial."}
</p>
<p>
  Fitted uses current gravity coils, potential wells and heavy ion engines.
  Footprints shows the current mount bounds; artwork can extend beyond them.
  Positions are provisional: overhang, surface support and exhaust clearance are
  visible for review, with no automatic fit check or flight claim.
</p>

<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md) var(--spacing-lg);
  margin-block: var(--spacing-lg);
}
.comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}
figure {
  min-width: 0;
  margin: 0;
}
figcaption {
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
  border-top: 1px solid var(--color-border);
  padding-block: var(--spacing-md);
  min-height: 6em;
}
figure p {
  margin-block: var(--spacing-md);
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.detail {
  margin-block: var(--spacing-lg);
}
.detail summary {
  cursor: pointer;
  font-weight: var(--font-weight-bold);
}
.enlarged {
  width: min(100%, 420px);
  margin-inline: auto;
}
@media (max-width: 600px) {
  .comparison {
    gap: var(--spacing-sm);
  }
  figcaption,
  figure p {
    font-size: var(--font-size-caption);
  }
}
</style>
