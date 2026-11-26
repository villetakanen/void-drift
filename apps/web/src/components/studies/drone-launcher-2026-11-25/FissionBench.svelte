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
import {
  DEFAULT_LIGHT,
  FissionLightSchema,
  InkSchema,
  LIGHT_STORAGE_KEY,
} from "./fission-light";

// Drone launcher 02.7: a bare fission charge, with one group of controls for
// each thing its light has to say. The values stay in this browser; Export
// keeps a record.
let {
  label = "Fission light · a bare charge beside three ships",
}: {
  label?: string;
} = $props();
const uid = $props.id();

let light = $state(structuredClone(DEFAULT_LIGHT));
let staging = $state({ ...DEFAULT_STAGING });
let shown = $state({ world: true, fx: true, lfx: true });
let measurements = $state("");
let restored = false;
let scene: FlightSceneInstrument;
let preview = $state("My settings");
const parts = [
  "Expanding circle",
  "Flash",
  "Ships",
  "Sparks",
  "Afterglow",
  "Scene",
] as const;
type Part = (typeof parts)[number];
let part = $state<Part>("Expanding circle");
function inspect(next: Part) {
  part = next;
  const moment = {
    "Expanding circle": 72,
    Flash: 60,
    Ships: 64,
    Sparks: 72,
    Afterglow: 88,
    Scene: 66,
  };
  scene.inspectTick(moment[next]);
}

const parsed = $derived(FissionLightSchema.safeParse($state.snapshot(light)));
const experiment = $derived(
  chargeExperiment(
    preview === "My settings" && parsed.success ? parsed.data : DEFAULT_LIGHT,
    StagingSchema.parse({ ...staging }),
    (value) => (measurements = value),
  ),
);

onMount(() => {
  try {
    const saved = localStorage.getItem(LIGHT_STORAGE_KEY);
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
      localStorage.removeItem(LIGHT_STORAGE_KEY);
    else localStorage.setItem(LIGHT_STORAGE_KEY, value);
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
  bind:this={scene}
  config={CHARGE_SCENE}
  {label}
  {experiment}
  layers={shown}
  fixedBurn
>
  {#snippet pane()}
    <h3>Compare the explosion</h3>
    <SegmentedControl
      label="Preview"
      options={["Starting values", "My settings"]}
      bind:value={preview}
      stretch
    />
    <p>
      Pick a part to pause where it is visible. Switch previews to compare the
      same moment.
    </p>
    <fieldset class="parts" aria-label="Part to inspect">
      {#each parts as item}
        <button
          type="button"
          class="btn"
          aria-pressed={part === item}
          onclick={() => inspect(item)}
        >
          {item}
        </button>
      {/each}
    </fieldset>
    <h3>{part}</h3>
    <fieldset disabled={preview === "Starting values" && part !== "Scene"}>
      {#if part === "Expanding circle"}
        <p>
          One pale line travels out from the flash and fades as it reaches the
          outer radius.
        </p>
        <label for={`${uid}-ring`} class="toggle"
          >Show radiation pulse
          <Switch id={`${uid}-ring`} bind:checked={light.shell.ring} /></label
        >
        {#if light.shell.ring}
          <RingSlider
            label="Outline width"
            min={0.5}
            max={8}
            step={0.5}
            digits={1}
            unit="u"
            bind:value={light.shell.outlineWidth}
          />
        {/if}
        <RingSlider
          label="Pulse and impact brightness"
          min={0}
          max={2}
          step={0.05}
          digits={2}
          bind:value={light.shell.strength}
        />
        <RingSlider
          label="Time to reach the outer edge"
          min={10}
          max={120}
          step={1}
          unit="ticks"
          bind:value={light.shell.ticks}
        />
        <RingSlider
          label="Outer radius"
          min={60}
          max={400}
          step={5}
          unit="u"
          bind:value={light.reach.limit}
        />
      {:else if part === "Flash"}
        <p>
          At detonation, a bright spot lights up at the centre and a much larger
          disc lights the space around it.
        </p>
        <RingSlider
          label="Bright spot radius"
          min={4}
          max={40}
          step={1}
          unit="u"
          bind:value={light.flash.size}
        />
        <RingSlider
          label="Bright spot brightness"
          min={0}
          max={1.5}
          step={0.05}
          digits={2}
          bind:value={light.flash.strength}
        />
        <RingSlider
          label="Bright spot duration"
          min={1}
          max={6}
          step={1}
          unit="ticks"
          bind:value={light.flash.ticks}
        />
        <RingSlider
          label="Filled disc brightness"
          min={0}
          max={1}
          step={0.05}
          digits={2}
          bind:value={light.frame.strength}
        />
      {:else if part === "Ships"}
        <p>
          The side facing the explosion lights up. Nearby ships catch more
          light.
        </p>
        <RingSlider
          label="Distance that receives full light"
          min={10}
          max={120}
          step={2}
          unit="u"
          bind:value={light.reach.fatal}
        />
        <RingSlider
          label="Ship glow brightness"
          min={0}
          max={1.5}
          step={0.05}
          digits={2}
          bind:value={light.answer.strength}
        />
        <RingSlider
          label="Ship glow duration"
          min={4}
          max={90}
          step={1}
          unit="ticks"
          bind:value={light.answer.ticks}
        />
      {:else if part === "Sparks"}
        <p>
          Sparks fly out from the centre. Lit ships also throw sparks back
          towards it.
        </p>
        <RingSlider
          label="Sparks from the centre"
          min={0}
          max={64}
          step={1}
          bind:value={light.shell.fragments}
        />
        <RingSlider
          label="Sparks from a fully lit ship"
          min={0}
          max={24}
          step={1}
          bind:value={light.answer.spall}
        />
        <label for={`${uid}-split`} class="toggle"
          >Sparks divide once
          <Switch id={`${uid}-split`} bind:checked={light.shell.split} /></label
        >
      {:else if part === "Afterglow"}
        <p>A patch of light stays at the centre after the flash.</p>
        <RingSlider
          label="Centre glow brightness"
          min={0}
          max={2}
          step={0.05}
          digits={2}
          bind:value={light.residue.strength}
        />
        <RingSlider
          label="Centre glow duration"
          min={0}
          max={180}
          step={2}
          unit="ticks"
          bind:value={light.residue.ticks}
        />
      {:else}
        <p>
          The dashed circles are distance guides. Hide them to see just the
          explosion.
        </p>
        <label for={`${uid}-guides`} class="toggle"
          >Show distance guides
          <Switch id={`${uid}-guides`} bind:checked={staging.guides} /></label
        >
        <p>Visible layers</p>
        <div class="row">
          <label for={`${uid}-world`}
            >World
            <Switch id={`${uid}-world`} bind:checked={shown.world} /></label
          >
          <label for={`${uid}-fx`}
            >FX <Switch id={`${uid}-fx`} bind:checked={shown.fx} /></label
          >
          <label for={`${uid}-lfx`}
            >LFX <Switch id={`${uid}-lfx`} bind:checked={shown.lfx} /></label
          >
        </div>

        <p>{measurements}</p>
      {/if}
    </fieldset>
    <details>
      <summary>Colour and saved settings</summary>
      <fieldset disabled={preview === "Starting values"}>
        <SegmentedControl
          label="Colour"
          options={InkSchema.options}
          bind:value={light.ink}
          stretch
        />
      </fieldset>
      <p>Your settings are saved in this browser.</p>
      <button type="button" class="btn" onclick={exportLight}>
        Export my settings
      </button>
      <button
        type="button"
        class="btn"
        onclick={() => {
          light = structuredClone(DEFAULT_LIGHT);
          preview = "My settings";
        }}
      >
        Reset my settings
      </button>
    </details>
  {/snippet}
</FlightSceneInstrument>

<style>
.parts,
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
button[aria-pressed="true"] {
  color: var(--color-elev-1);
  background: var(--color-accent, #cbef57);
}
fieldset {
  display: grid;
  gap: var(--spacing-md);
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}
fieldset:disabled {
  opacity: 0.6;
}
fieldset p {
  margin: 0;
}
label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}
details {
  margin-top: var(--spacing-lg);
}
summary {
  cursor: pointer;
  margin-bottom: var(--spacing-md);
}
</style>
