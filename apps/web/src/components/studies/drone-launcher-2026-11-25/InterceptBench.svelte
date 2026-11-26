<script lang="ts">
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import { EncounterSettings, HullResponse } from "./armed-encounter";
import { AI_FLIGHT, DEFAULT_PILOT } from "./drone-pilot";
import { AI_SCENE, flightExperiment } from "./launch";

let range = $state(15);
let response = $state<(typeof HullResponse.options)[number]>(
  "Remove at detonation",
);
let measurements = $state("");
const config = {
  ...AI_SCENE,
  encounter: { restTicks: 0 },
  opening: { ...AI_SCENE.opening, burn: "weave", tick: 30 },
};
const experiment = $derived(
  flightExperiment(
    AI_FLIGHT,
    (v) => (measurements = v),
    { ...DEFAULT_PILOT, ranges: false },
    EncounterSettings.parse({ range, response }),
  ),
);
</script>
<FlightSceneInstrument
  {config}
  {experiment}
  {measurements}
  label="02.10 · powered intercept"
  fixedBurn
  summary={`Carrier view · Fighter and Scout under thrust · detonate ${range} u from hull`}
>
  {#snippet pane()}
    <h3>Detonation</h3>
    <RingSlider
      label="Distance from target hull"
      min={5}
      max={30}
      step={1}
      unit="u"
      bind:value={range}
    />
    <SegmentedControl
      label="Drone hull after detonation"
      options={HullResponse.options}
      bind:value={response}
    />
  {/snippet}
</FlightSceneInstrument>
