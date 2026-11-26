<script lang="ts">
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import Switch from "../../inputs/Switch.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  CHARGE_SCENE,
  chargeExperiment,
  FIRST_CHARGE,
  SparkTreatment,
} from "./fission-charge";
import {
  ACCEPTED_SPARKS,
  DEFAULT_LIGHT,
  SparkSettingsSchema,
  TipShape,
} from "./fission-light";

const uid = $props.id();
let scene: FlightSceneInstrument;
let treatment = $state<(typeof SparkTreatment.options)[number]>("Green tracks");
const config = {
  ...CHARGE_SCENE,
  opening: { ...CHARGE_SCENE.opening, view: "1x", tick: FIRST_CHARGE - 12 },
};
const light = {
  ...DEFAULT_LIGHT,
  shell: { ...DEFAULT_LIGHT.shell, ring: true },
};
let settings = $state({ ...ACCEPTED_SPARKS });
let ready = $state(false);
const key = "void-drift:drone-launcher:02-9-sparks";
onMount(() => {
  try {
    const saved = SparkSettingsSchema.safeParse(
      JSON.parse(localStorage.getItem(key) ?? "null"),
    );
    if (saved.success) settings = saved.data;
  } catch {
    /* Browser storage is optional. */
  }
  ready = true;
});
$effect(() => {
  if (ready) {
    try {
      localStorage.setItem(key, JSON.stringify(settings));
    } catch {
      /* Optional storage. */
    }
  }
});
const summary = $derived.by(() => {
  if (treatment === "02.7 strokes") return "02.7 strokes · reference settings";
  const s = settings;
  const tip =
    s.shape === "No tip"
      ? "No tip"
      : `${s.shape} tip ${s.tipSize}× · ${s.softEdge ? "soft" : "sharp"} edge · tip light ${s.tipLight}×`;
  const fork =
    s.forkAt === 100
      ? "No fork"
      : `Fork at ${s.forkAt}% · opening ${s.forkSpread}× · branches ${s.firstSpeed}× / ${s.secondSpeed}×`;
  return [
    `Green track ${s.width} u · light ${s.trackLight}× · emission fade ${s.fade}%`,
    tip,
    `Speed ${s.speed}× · ${fork}`,
  ].join("\n");
});
const experiment = $derived(
  chargeExperiment(light, {
    guides: false,
    sparkTreatment: treatment,
    sparkSettings: settings,
  }),
);
</script>

<FlightSceneInstrument
  bind:this={scene}
  {config}
  {experiment}
  {summary}
  fixedBurn
  label="02.9 · outgoing sparks"
>
  {#snippet pane()}
    <h3>Outgoing sparks</h3>
    <SegmentedControl
      label="Spark treatment"
      options={SparkTreatment.options}
      bind:value={treatment}
      stretch
    />
    <button
      type="button"
      class="btn"
      onclick={() => scene.inspectTick(FIRST_CHARGE + 20)}
    >
      Pause on a fork
    </button>
    {#if treatment === "Green tracks"}
      <details open>
        <summary>Shape</summary>
        <SegmentedControl
          label="Tip shape"
          options={TipShape.options}
          bind:value={settings.shape}
          stretch
        />
        <RingSlider
          label="Track width"
          min={0.5}
          max={10}
          step={0.25}
          digits={2}
          unit="u"
          bind:value={settings.width}
        />
        <label for={`${uid}-soft`}
          >Soft tip edge
          <Switch
            id={`${uid}-soft`}
            bind:checked={settings.softEdge}
            disabled={settings.shape === "No tip"}
          /></label
        >
        <RingSlider
          label="Tip size"
          min={0.25}
          max={3}
          step={0.05}
          digits={2}
          unit="×"
          bind:value={settings.tipSize}
        />
      </details>
      <details>
        <summary>Travel and fork</summary>
        <p>
          100% keeps one track. Branch speeds are multiples of the incoming
          speed.
        </p>
        <RingSlider
          label="Speed before fork"
          min={0.25}
          max={3}
          step={0.05}
          digits={2}
          unit="×"
          bind:value={settings.speed}
        />
        <RingSlider
          label="Fork along original path"
          min={5}
          max={100}
          step={1}
          digits={0}
          unit="%"
          bind:value={settings.forkAt}
        />
        <RingSlider
          label="Fork opening"
          min={0}
          max={3}
          step={0.05}
          digits={2}
          unit="×"
          bind:value={settings.forkSpread}
        />
        <RingSlider
          label="First branch speed"
          min={0.1}
          max={3}
          step={0.05}
          digits={2}
          unit="×"
          bind:value={settings.firstSpeed}
        />
        <RingSlider
          label="Second branch speed"
          min={0.1}
          max={3}
          step={0.05}
          digits={2}
          unit="×"
          bind:value={settings.secondSpeed}
        />
      </details>
      <details>
        <summary>Brightness and fade</summary>
        <p>
          Fade reduces the fresh green light each spark deposits as it ages.
          Earlier marks fade with the shared FX layer.
        </p>
        <RingSlider
          label="Green track brightness"
          min={0}
          max={2}
          step={0.05}
          digits={2}
          unit="×"
          bind:value={settings.trackLight}
        />
        <RingSlider
          label="Pale tip brightness"
          min={0}
          max={2}
          step={0.05}
          digits={2}
          unit="×"
          bind:value={settings.tipLight}
        />
        <RingSlider
          label="Track emission lost by end of life"
          min={0}
          max={100}
          step={5}
          digits={0}
          unit="%"
          bind:value={settings.fade}
        />
      </details>
      <button
        type="button"
        class="btn"
        onclick={() => (settings = { ...ACCEPTED_SPARKS })}
      >
        Reset spark settings
      </button>
    {/if}
  {/snippet}
</FlightSceneInstrument>

<style>
summary {
  cursor: pointer;
  margin-block: var(--spacing-md);
}
</style>
