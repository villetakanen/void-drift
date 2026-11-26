<script lang="ts">
import { onMount } from "svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  CHARGE_SCENE,
  chargeExperiment,
  FIRST_CHARGE,
  type HullTiming,
  HullTimingSchema,
} from "./fission-charge";
import {
  DEFAULT_LIGHT,
  FissionLightSchema,
  LIGHT_STORAGE_KEY,
} from "./fission-light";
import { drawDrone } from "./launch";

let scene: FlightSceneInstrument;
let light = $state(DEFAULT_LIGHT);
let timing = $state<HullTiming>("At detonation");
const config = {
  ...CHARGE_SCENE,
  opening: { ...CHARGE_SCENE.opening, tick: FIRST_CHARGE - 15 },
};
const experiment = $derived(
  chargeExperiment(light, { guides: false }, undefined, {
    timing,
    draw: drawDrone,
  }),
);

onMount(() => {
  // Keep a copy of the starting recipe for this bench independently of later tuning.
  const key = "void-drift:drone-launcher:02-8-accepted-light";
  try {
    const saved =
      localStorage.getItem(key) ?? localStorage.getItem(LIGHT_STORAGE_KEY);
    if (saved) {
      const recipe = FissionLightSchema.safeParse(JSON.parse(saved));
      if (recipe.success) light = recipe.data;
    }
    localStorage.setItem(key, JSON.stringify(light));
  } catch {
    /* The built-in recipe also works without browser storage. */
  }
});
</script>

<FlightSceneInstrument
  bind:this={scene}
  {config}
  {experiment}
  fixedBurn
  label="Drone detonation · hull under the flash"
>
  {#snippet pane()}
    <h3>Inspect the light</h3>
    <button
      class="btn"
      type="button"
      onclick={() =>
        scene.inspectTick(FIRST_CHARGE + Math.round(light.shell.ticks * 0.45))}
    >
      Sparks and pulse
    </button>
    <h3>Drone hull</h3>
    <SegmentedControl
      label="Remove drone hull"
      options={HullTimingSchema.options}
      bind:value={timing}
    />
    <p>
      Keep the hull visible to see how much of it the flash covers. Switch
      treatments at the same paused moment.
    </p>
    <button
      class="btn"
      type="button"
      onclick={() => scene.inspectTick(FIRST_CHARGE - 1)}
    >
      Before
    </button>
    <button
      class="btn"
      type="button"
      onclick={() => scene.inspectTick(FIRST_CHARGE)}
    >
      First flash frame
    </button>
    <button
      class="btn"
      type="button"
      onclick={() => scene.inspectTick(FIRST_CHARGE + light.flash.ticks)}
    >
      After the flash
    </button>
  {/snippet}
</FlightSceneInstrument>
