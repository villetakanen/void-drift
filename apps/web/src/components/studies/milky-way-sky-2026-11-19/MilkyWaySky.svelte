<script lang="ts">
import { onMount } from "svelte";
import { PRACTICE_FLIGHT_SCENE } from "../../../lib/flight-scene";
import RingSlider from "../../inputs/RingSlider.svelte";
import Switch from "../../inputs/Switch.svelte";
import "@void-drift/core/styles/buttons.css";
import Toggle from "../../inputs/Toggle.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import { prepareSky, skyExperiment } from "./sky";

let { label }: { label: string } = $props();
let art = $state<ReturnType<typeof prepareSky>>();
let sky = $state("Milky Way");
let pan = $state(65);
let brightness = $state(45);
let showStars = $state(true);
const starsId = $props.id();
const config = {
  ...PRACTICE_FLIGHT_SCENE,
  opening: { burn: "course", view: "follow", tick: 150 },
};
const experiment = $derived(
  art && sky === "Milky Way"
    ? skyExperiment(art, pan, brightness, showStars)
    : undefined,
);
onMount(() => {
  art = prepareSky();
});
</script>
<FlightSceneInstrument
  {config}
  {label}
  {experiment}
  summary={sky === "Milky Way"
    ? `Milky Way · pan ${pan} stage px / 100 world u · stream ${brightness}% · stars ${showStars ? "on" : "off"} · fixed scale · seed 191126`
    : "Production sky · world anchored"}
>
  {#snippet pane()}
    <div class="choices">
      <h3>Sky</h3>
      <Toggle
        label="Sky"
        options={["Milky Way", "Production"]}
        bind:value={sky}
        stretch
      />
      <RingSlider
        label="Sky travel"
        unit="px / 100 u"
        min={0}
        max={100}
        step={5}
        bind:value={pan}
      />
      <RingSlider
        label="Stream brightness"
        unit="%"
        min={0}
        max={100}
        step={5}
        bind:value={brightness}
      />
      <div class="star-switch">
        <label for={starsId}>Identifiable stars</label>
        <Switch id={starsId} bind:checked={showStars} />
      </div>
      <p>
        The same sky texture and flight throughout. Travel is measured in
        logical stage pixels per 100 world units of camera movement.
      </p>
      <button
        type="button"
        class="btn btn-normal"
        onclick={() => {
          sky = "Milky Way";
          pan = 65;
          brightness = 45;
          showStars = true;
        }}
      >
        Reset sky
      </button>
    </div>
  {/snippet}
</FlightSceneInstrument>
<style>
.star-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}
.choices {
  --button-ground: var(--color-elev-3);
  display: grid;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}
h3,
p {
  margin: 0;
}
p {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  line-height: var(--line-height-prose);
}
</style>
