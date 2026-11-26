<script lang="ts">
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import Switch from "../../inputs/Switch.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  CHARGE_SCENE,
  chargeExperiment,
  DEFAULT_STAGING,
  StagingSchema,
} from "./fission-charge";
import { DEFAULT_LIGHT, FissionLightSchema, InkSchema } from "./fission-light";

// Drone launcher 02.7: a bare fission charge, with one group of controls for
// each thing its light has to say. The values stay in this browser; Export
// keeps a record.
let {
  label = "Fission light · a bare charge beside three ships",
}: {
  label?: string;
} = $props();
const uid = $props.id();
const storageKey = "void-drift:drone-launcher:02-7-fission-light";

let light = $state(structuredClone(DEFAULT_LIGHT));
let staging = $state({ ...DEFAULT_STAGING });
let shown = $state({ world: true, fx: true, lfx: true });
let measurements = $state("");
let restored = false;

const parsed = $derived(FissionLightSchema.safeParse($state.snapshot(light)));
const experiment = $derived(
  chargeExperiment(
    parsed.success ? parsed.data : DEFAULT_LIGHT,
    StagingSchema.parse({ ...staging }),
    (value) => (measurements = value),
  ),
);

onMount(() => {
  try {
    const saved = localStorage.getItem(storageKey);
    const stored = saved
      ? FissionLightSchema.safeParse(JSON.parse(saved))
      : null;
    if (stored?.success) light = stored.data;
  } catch {
    /* Storage can be unavailable; the bench still works. */
  }
  restored = true;
});
$effect(() => {
  const value = JSON.stringify($state.snapshot(light));
  if (!restored) return;
  try {
    // Untouched values are not stored, so a changed default still arrives.
    if (value === JSON.stringify(DEFAULT_LIGHT))
      localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, value);
  } catch {
    /* As above. */
  }
});

function exportLight() {
  const result = FissionLightSchema.parse($state.snapshot(light));
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "drone-launcher-02-7-fission-light.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<FlightSceneInstrument
  config={CHARGE_SCENE}
  {label}
  {experiment}
  {measurements}
  layers={shown}
  fixedBurn
  summary={`A bare charge every 2.5 s · ${light.ink} ink · three ships at rest\nFull flash inside ${light.reach.fatal} u · nothing beyond ${light.reach.limit} u · no damage simulated`}
>
  {#snippet pane()}
    <h3>Layers shown</h3>
    <div class="row">
      <label for={`${uid}-world`}
        >World <Switch id={`${uid}-world`} bind:checked={shown.world} /></label
      >
      <label for={`${uid}-fx`}
        >FX <Switch id={`${uid}-fx`} bind:checked={shown.fx} /></label
      >
      <label for={`${uid}-lfx`}
        >LFX <Switch id={`${uid}-lfx`} bind:checked={shown.lfx} /></label
      >
    </div>
    <p>
      LFX carries what is lit at this instant: the flash, the flash frame and
      the faces of the ships. FX carries what stays: the afterglow, the shell’s
      wake and the sparks’ trails.
    </p>
    <SegmentedControl
      label="Ink"
      options={InkSchema.options}
      bind:value={light.ink}
      stretch
    />

    <h3>Nothing, then everything</h3>
    <p>The flash at the source. It has no build-up.</p>
    <RingSlider
      label="Source size"
      min={4}
      max={40}
      step={1}
      unit="u"
      bind:value={light.flash.size}
    />
    <RingSlider
      label="Flash lasts"
      min={1}
      max={6}
      step={1}
      unit="ticks"
      bind:value={light.flash.ticks}
    />
    <RingSlider
      label="Flash strength"
      min={0}
      max={1.5}
      step={0.05}
      digits={2}
      bind:value={light.flash.strength}
    />

    <h3>What it reaches</h3>
    <p>
      A ship inside the fatal radius takes the whole flash. Farther out it takes
      less, by the square of the distance, down to nothing at the limit.
    </p>
    <RingSlider
      label="Fatal radius"
      min={10}
      max={120}
      step={2}
      unit="u"
      bind:value={light.reach.fatal}
    />
    <RingSlider
      label="Reach limit"
      min={60}
      max={400}
      step={5}
      unit="u"
      bind:value={light.reach.limit}
    />
    <label for={`${uid}-guides`} class="toggle"
      >Show both radii
      <Switch id={`${uid}-guides`} bind:checked={staging.guides} /></label
    >
    <RingSlider
      label="Flash frame over the space"
      min={0}
      max={1}
      step={0.05}
      digits={2}
      bind:value={light.frame.strength}
    />

    <h3>Matter answers</h3>
    <p>The side of each ship that faced the flash keeps glowing and sheds.</p>
    <RingSlider
      label="Glow strength"
      min={0}
      max={1.5}
      step={0.05}
      digits={2}
      bind:value={light.answer.strength}
    />
    <RingSlider
      label="Glow lasts"
      min={4}
      max={90}
      step={1}
      unit="ticks"
      bind:value={light.answer.ticks}
    />
    <RingSlider
      label="Sparks thrown back"
      min={0}
      max={24}
      step={1}
      bind:value={light.answer.spall}
    />

    <h3>The remains leave</h3>
    <p>
      The shell is the only part that travels. A ship answers again as it
      passes.
    </p>
    <RingSlider
      label="Shell reaches the limit in"
      min={10}
      max={120}
      step={1}
      unit="ticks"
      bind:value={light.shell.ticks}
    />
    <RingSlider
      label="Shell strength"
      min={0}
      max={2}
      step={0.05}
      digits={2}
      bind:value={light.shell.strength}
    />
    <RingSlider
      label="Sparks leaving with it"
      min={0}
      max={64}
      step={1}
      bind:value={light.shell.fragments}
    />
    <label for={`${uid}-split`} class="toggle"
      >Sparks divide once
      <Switch id={`${uid}-split`} bind:checked={light.shell.split} /></label
    >

    <h3>The place stays wrong</h3>
    <p>How long the source keeps feeding light into the surface.</p>
    <RingSlider
      label="Afterglow fed for"
      min={0}
      max={180}
      step={2}
      unit="ticks"
      bind:value={light.residue.ticks}
    />
    <RingSlider
      label="Afterglow strength"
      min={0}
      max={2}
      step={0.05}
      digits={2}
      bind:value={light.residue.strength}
    />

    <div class="row">
      <button
        type="button"
        class="btn"
        onclick={() => {
          light = structuredClone(DEFAULT_LIGHT);
          staging = { ...DEFAULT_STAGING };
        }}
      >
        Reset values
      </button>
      <button type="button" class="btn" onclick={exportLight}>
        Export values
      </button>
    </div>
    <p>The values stay in this browser. Export keeps a record for the study.</p>
  {/snippet}
</FlightSceneInstrument>

<style>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: center;
}
label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.toggle {
  justify-content: space-between;
}
</style>
