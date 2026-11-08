<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import CapacityDrawing from "./CapacityDrawing.svelte";
import { CAPACITY_VIEW } from "./connected-form";
import {
  type EnginePlacement,
  EnginePlacementSchema,
  REAR_PAIR,
  ROOT_PAIR,
} from "./engine-placement";
import { WINDOW_DEFAULT } from "./window-placement";

let { label = "Fiddler main-engine placement" }: { label?: string } = $props();
const storageKey = "void-drift:study:lhi-fiddler-engines:v1";
const { width, height, zoom } = CAPACITY_VIEW;
let placement = $state<EnginePlacement>({ ...REAR_PAIR });
let view = $state("Engines");
let ready = $state(false);
let saved = $state(false);
const mounts = $derived([
  [-placement.halfSpan, placement.y],
  [placement.halfSpan, placement.y],
] as const);
onMount(() => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = EnginePlacementSchema.safeParse(JSON.parse(raw));
      if (parsed.success) placement = parsed.data;
    }
  } catch {
    /* Browser storage is optional for the tool. */
  }
  ready = true;
});
$effect(() => {
  if (!ready) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(placement));
    saved = true;
  } catch {
    saved = false;
  }
});
</script>

<p>
  Two straight-ahead heavy ions, firing together. Try either starting position,
  then adjust their spacing and fore–aft position.
</p>
<div class="toolbar">
  <fieldset class="starts" aria-label="Engine placement starting points">
    <button
      type="button"
      class="btn btn-ghost"
      onclick={() => (placement = { ...REAR_PAIR })}
    >
      Rear pair
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      onclick={() => (placement = { ...ROOT_PAIR })}
    >
      Blade roots
    </button>
  </fieldset>
  <Toggle
    label="Engine placement view"
    compact
    options={["Engines", "Fitted"]}
    bind:value={view}
  />
</div>
<fieldset class="workbench" aria-label={label}>
  <div class="drawing">
    <CapacityDrawing
      ship="fiddler"
      hullScale={1.35}
      {view}
      windowDraft={WINDOW_DEFAULT}
      engineMounts={mounts}
      label={`Fiddler with two main engines, ${view.toLowerCase()} view`}
    />
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <g transform={`translate(${width / 2} ${height / 2}) scale(${zoom})`}>
        {#each mounts as [x, y]}
          <path d={`M ${x} ${y + 13} v 12 m -1.4 -1.8 l 1.4 1.8 l 1.4 -1.8`} />
        {/each}
      </g>
    </svg>
  </div>
  <div class="adjustments">
    <RingSlider
      label="Engine spacing"
      min={12}
      max={56}
      step={0.2}
      digits={1}
      unit="u"
      bind:value={
        () => placement.halfSpan * 2,
        (value) => (placement.halfSpan = value / 2)
      }
    />
    <RingSlider
      label="Fore–aft position"
      min={-12}
      max={50}
      step={0.1}
      digits={1}
      unit="u"
      bind:value={placement.y}
    />
    <p class="caption">
      Lower fore–aft values move toward the nose. Dashed arrows show exhaust
      direction, not plume length.
    </p>
    <p class="caption">
      +35% hull · exact Wasp-sized black glass · fixed equipment positions. The
      four stabilizers come next.
    </p>
    <p class="caption" role="status">
      {saved
        ? "Your engine positions are saved in this browser."
        : "Positions stay in this page while you edit."}
    </p>
  </div>
</fieldset>
<p class="caption">
  The rear pair uses the rear fins and keeps propulsion close to the centre
  body. The blade-root pair makes each forward hull read as a drive-bearing
  body, but crowds the shoulder equipment. Moving the pair changes the layout;
  it does not add thrust or prove mounting support and exhaust clearance.
</p>

<style>
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
p {
  max-width: var(--measure-prose);
}
.toolbar,
.starts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
}
.toolbar {
  justify-content: space-between;
  margin-block: var(--spacing-lg);
}
.workbench {
  display: grid;
  gap: var(--spacing-lg);
}
.drawing {
  width: min(100%, 320px);
  margin-inline: auto;
  position: relative;
}
svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
path {
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 0.35;
  stroke-dasharray: 1.1 1;
}
.adjustments {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md) var(--spacing-lg);
  align-content: center;
}
.adjustments p {
  grid-column: 1 / -1;
  margin: 0;
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
@media (min-width: 850px) {
  .workbench {
    grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
  }
}
</style>
