<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import { PARTS } from "@void-drift/mode-a";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import {
  FOUR_ENGINE_FIT,
  type FourEngineFit,
  FourEngineFitSchema,
} from "./engine-placement";
import PincerSlotEditor from "./PincerSlotEditor.svelte";
import {
  adjustPincerPosition,
  decidedPincerPlacement,
  fitPincerPart,
  LegacyPincerSlotsSchema,
  PINCER_SLOTS,
  PINCER_START,
  PINCER_SUPPORT,
  PINCER_WEAPONS,
  type PincerPosition,
  type PincerSlot,
  type PincerSlots,
  PincerSlotsSchema,
} from "./pincer-slots";

let { label = "Pincer slot editor" }: { label?: string } = $props();
const storageKey = "void-drift:study:lhi-fiddler-pincer-slots:v2";

let draft = $state<PincerSlots>(PincerSlotsSchema.parse(PINCER_START));
let fit = $state<FourEngineFit>({ ...FOUR_ENGINE_FIT });
let selected = $state<PincerSlot>("Q1");
let mode = $state("Slot editor");
let ready = $state(false);
let saved = $state(false);
const descriptor = $derived(
  PINCER_SLOTS.find((slot) => slot.id === selected) ?? PINCER_SLOTS[0],
);
const pair = $derived(descriptor.pair);
const fittings = $derived(
  pair === "forward"
    ? [...PINCER_SUPPORT, ...PINCER_WEAPONS]
    : [...PINCER_SUPPORT],
);
const pairLabel = $derived(pair === "forward" ? "Forward" : "Aft");
function changePosition(values: Partial<PincerPosition>) {
  draft.positions[pair] = adjustPincerPosition(draft.positions[pair], values);
}
function move(id: PincerSlot, x: number, y: number) {
  const slot = PINCER_SLOTS.find((item) => item.id === id);
  if (!slot) return;
  selected = id;
  draft.positions[slot.pair] = adjustPincerPosition(
    draft.positions[slot.pair],
    { halfSpan: slot.side * x, y },
  );
}
function partName(id: PincerSlot) {
  const part = draft.slots[id].part;
  return part ? PARTS[part].name : "Empty";
}
function readEngineFit() {
  try {
    const raw = localStorage.getItem(
      "void-drift:study:lhi-fiddler-four-engines:v1",
    );
    if (raw) {
      const parsed = FourEngineFitSchema.safeParse(JSON.parse(raw));
      if (parsed.success) fit = parsed.data;
    }
  } catch {
    /* Keep the current engine reference if storage is unavailable. */
  }
}
onMount(() => {
  readEngineFit();
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = PincerSlotsSchema.safeParse(JSON.parse(raw));
      if (parsed.success) draft = parsed.data;
    } else {
      const legacy = localStorage.getItem(
        "void-drift:study:lhi-fiddler-pincer-slots:v1",
      );
      if (legacy) {
        const parsed = LegacyPincerSlotsSchema.safeParse(JSON.parse(legacy));
        if (parsed.success)
          draft = decidedPincerPlacement({ ...parsed.data, version: 2 });
      }
    }
  } catch {
    /* Editing remains available without browser storage. */
  }
  ready = true;
});
$effect(() => {
  if (!ready) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(draft));
    saved = true;
  } catch {
    saved = false;
  }
});
</script>

<p>
  Drag a slot to move its mirrored position on the opposite pincer too. Choose
  each slot’s fitting independently. The decided positions and under-ship
  mounting are the starting point; further placement edits are experiments.
</p>
<div class="toolbar">
  <Toggle
    label="Pincer view"
    compact
    options={["Slot editor", "Fitted view"]}
    bind:value={mode}
  />
  <button
    class="btn btn-ghost"
    type="button"
    onclick={() => (draft = decidedPincerPlacement(draft))}
  >
    Reset to decided slots
  </button>
</div>
<fieldset class="workbench" aria-label={label} onfocusin={readEngineFit}>
  <div class="drawing">
    <PincerSlotEditor
      {draft}
      {fit}
      editing={mode === "Slot editor"}
      {selected}
      onmove={move}
      onselect={(id) => (selected = id)}
    />
  </div>
  <div class="adjustments">
    <Toggle
      label="Selected pincer slot"
      compact
      options={PINCER_SLOTS.map((slot) => slot.short)}
      bind:value={
        () => descriptor.short,
        (id) => {
	const slot = PINCER_SLOTS.find((item) => item.short === id);
	if (slot) selected = slot.id;
}
      }
    />
    <strong>{descriptor.label}</strong>
    <p class="caption">
      {pair === "forward"
        ? "+ · Weapons or support; no engines."
        : "S · Support only; no weapons or engines."}
    </p>
    <p class="caption">
      {pairLabel}
      pair position · {pair === "forward" ? "+1 and +2" : "S3 and S4"}
    </p>
    <RingSlider
      label={`${pairLabel} slot pair spacing`}
      min={2}
      max={64}
      step={0.2}
      digits={1}
      unit="u"
      bind:value={
        () => draft.positions[pair].halfSpan * 2,
        (value) => changePosition({ halfSpan: value / 2 })
      }
    />
    <RingSlider
      label={`${pairLabel} slot fore–aft position`}
      min={-62}
      max={0}
      step={0.1}
      digits={1}
      unit="u"
      bind:value={
        () => draft.positions[pair].y,
        (value) => changePosition({ y: value })
      }
    />
    <p class="caption">
      Negative fore–aft values move toward the nose. Arrow keys move a focused
      slot; Shift makes larger moves.
    </p>
    <div class="mounting">
      <p>{descriptor.short} mounting</p>
      <Toggle
        label={`${descriptor.short} mounting layer`}
        compact
        options={["Above", "Below"]}
        bind:value={
          () => draft.slots[selected].layer,
          (layer) => {
	if (layer === "Above" || layer === "Below")
		draft.slots[selected].layer = layer;
}
        }
      />
    </div>
    <div class="utility">
      <p>{descriptor.short} fitting</p>
      <fieldset class="choices" aria-label={`${descriptor.short} fitting`}>
        <button
          type="button"
          class="btn"
          class:btn-filled={draft.slots[selected].part === null}
          class:btn-ghost={draft.slots[selected].part !== null}
          aria-pressed={draft.slots[selected].part === null}
          onclick={() => (draft = fitPincerPart(draft, selected, null))}
        >
          Empty
        </button>
        {#each fittings as id}
          <button
            type="button"
            class="btn"
            class:btn-filled={draft.slots[selected].part === id}
            class:btn-ghost={draft.slots[selected].part !== id}
            aria-pressed={draft.slots[selected].part === id}
            onclick={() => (draft = fitPincerPart(draft, selected, id))}
          >
            {PARTS[id].name}
          </button>
        {/each}
      </fieldset>
    </div>
    <p class="caption">
      Above sits on the pincer. Below is covered by the pincer wherever they
      overlap. Fitted view removes the slot guides.
    </p>
    <p class="caption" role="status">
      {saved
        ? "Slot positions, layers and fittings are saved in this browser."
        : "Edits stay in this page while you work."}
    </p>
  </div>
</fieldset>
<div class="readout">
  {#each PINCER_SLOTS as slot}
    <p>
      <strong>{slot.label}</strong><br>
      {draft.slots[slot.id].layer}
      · {partName(slot.id)}<br>
      x {(slot.side * draft.positions[slot.pair].halfSpan).toFixed(1)} · y
      {draft.positions[slot.pair].y.toFixed(1)}
    </p>
  {/each}
</div>

<style>
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-block: var(--spacing-lg);
}
.workbench {
  display: grid;
  gap: var(--spacing-lg);
}
.drawing {
  width: min(100%, 340px);
  margin-inline: auto;
}
.adjustments {
  display: grid;
  align-content: center;
  gap: var(--spacing-md);
  min-width: 0;
}
.adjustments p {
  margin: 0;
}
.mounting,
.utility {
  display: grid;
  gap: var(--spacing-sm);
  justify-items: start;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.readout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);
  font-size: var(--font-size-caption);
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
@media (min-width: 850px) {
  .workbench {
    grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  }
}
</style>
