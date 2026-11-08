<script lang="ts">
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import { drawSlot } from "@void-drift/mode-a";
import { onMount } from "svelte";
import CapacityDrawing from "./CapacityDrawing.svelte";
import { CAPACITY_VIEW } from "./connected-form";
import {
  FOUR_ENGINE_LAYOUT,
  type FourEngineFit,
  pairMounts,
} from "./engine-placement";
import PlacementHandles from "./PlacementHandles.svelte";
import {
  PINCER_SLOTS,
  type PincerSlot,
  type PincerSlots,
  pincerMounts,
} from "./pincer-slots";
import { STABILIZER_DECIDED } from "./stabilizer-placement";
import { WINDOW_DEFAULT } from "./window-placement";

let {
  draft,
  fit,
  editing,
  selected,
  onmove,
  onselect,
}: {
  draft: PincerSlots;
  fit: FourEngineFit;
  editing: boolean;
  selected: PincerSlot;
  onmove: (id: PincerSlot, x: number, y: number) => void;
  onselect: (id: PincerSlot) => void;
} = $props();
const { width, height, zoom } = CAPACITY_VIEW;
const roots = pairMounts(FOUR_ENGINE_LAYOUT.roots);
const rear = pairMounts(FOUR_ENGINE_LAYOUT.rear);
const mounts = $derived(pincerMounts(draft));
const handles = $derived(
  mounts.map((mount) => ({
    id: mount.key,
    x: mount.y,
    y: -mount.x,
    label: `${mount.label}: drag or use arrow keys`,
  })),
);
let guides = $state<HTMLCanvasElement>();
let fontsReady = $state(false);
onMount(() => {
  void loadCanvasFonts().then(() => {
    fontsReady = true;
  });
});
$effect(() => {
  void fontsReady;
  if (!guides) return;
  const dpr = window.devicePixelRatio || 1;
  guides.width = width * dpr;
  guides.height = height * dpr;
  const ctx = guides.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.rotate(-Math.PI / 2);
  for (const [index, mount] of mounts.entries()) {
    ctx.save();
    ctx.translate(mount.x, mount.y);
    drawSlot(
      ctx,
      mount,
      PINCER_SLOTS[index].short,
      mount.key === selected,
      {
        dark: COLOR.void,
        lime: COLOR.action,
        ivory: COLOR.text,
      },
      false,
      mount.language,
    );
    ctx.restore();
  }
});
function knownSlot(id: string) {
  return PINCER_SLOTS.find((slot) => slot.id === id)?.id;
}
</script>

<div class="editor">
  <CapacityDrawing
    ship="fiddler"
    hullScale={1.35}
    view="Engines"
    windowDraft={WINDOW_DEFAULT}
    engineMounts={rear}
    underwingEngineMounts={roots}
    engineType={fit.rear}
    underwingEngineType={fit.roots}
    pincerSlots={draft}
    stabilizers={STABILIZER_DECIDED}
    label={`Fiddler pincer slots, ${editing ? "slot editor" : "fitted"} view`}
  />
  {#if editing}
    <canvas
      class="guides"
      bind:this={guides}
      {width}
      {height}
      aria-hidden="true"
    ></canvas>
    <PlacementHandles
      {handles}
      label="Pincer slot drag controls"
      onselect={(id) => {
        const slot = knownSlot(id);
        if (slot) onselect(slot);
      }}
      onmove={(id, x, y) => {
        const slot = knownSlot(id);
        if (slot) onmove(slot, x, y);
      }}
    />
  {/if}
</div>

<style>
.editor {
  position: relative;
}
.guides {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
