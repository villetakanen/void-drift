<script lang="ts">
import RingSlider from "../inputs/RingSlider.svelte";
import Switch from "../inputs/Switch.svelte";
import FlightSceneInstrument from "../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  FISSION_PERIOD_021,
  FISSION_SCENE_021,
  fissionLight021,
} from "./fission-light-021";

// Fission light 02.1 in the Flight scene instrument. The menu holds this
// example's own controls: the detonation against the game's light, and how
// often the engine pushes.
const detonation = fissionLight021();
let lit = $state(true);
let period = $state<number>(FISSION_PERIOD_021.opening);
const tuning = $derived({ fusion: { pulsePeriod: period } });
const id = $props.id();
const _props: { "client:visible"?: boolean } = $props();
</script>

<FlightSceneInstrument
  config={FISSION_SCENE_021}
  label="Fission light 02.1: a detonation left behind"
  light={lit ? detonation : undefined}
  {tuning}
>
  {#snippet pane()}
    <div class="rows">
      <label for={`${id}-light`}>Detonation</label>
      <Switch id={`${id}-light`} bind:checked={lit} />
    </div>
    <RingSlider
      label="A push every"
      unit="s"
      digits={2}
      min={0.3}
      max={1.2}
      step={0.05}
      bind:value={period}
    />
    <p class="values" data-values>
      a push every {period.toFixed(2)} s · the game’s is
      {FISSION_PERIOD_021.game.toFixed(2)}
      s
    </p>
  {/snippet}
</FlightSceneInstrument>

<style>
.rows {
  display: grid;
  grid-template-columns: max-content max-content;
  align-items: center;
  gap: var(--spacing-sm) var(--spacing-md);
}
.values {
  color: var(--color-text-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
</style>
