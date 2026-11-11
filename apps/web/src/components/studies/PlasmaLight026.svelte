<script lang="ts">
import { untrack } from "svelte";
import Switch from "../inputs/Switch.svelte";
import FlightSceneInstrument from "../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  PLASMA_LIGHT_026,
  PLASMA_SCENE_026,
  PLASMA_TUNING_026,
} from "./plasma-light-026";

// Plasma light 02.6 in the Flight scene instrument. The menu holds this
// example's own controls: the ball against the game's light, and the layers.
/** Whether the scene opens with the study’s light. */
let { ball = true }: { ball?: boolean } = $props();
let lit = $state(untrack(() => ball));
let layers = $state({ world: true, fx: true, lfx: true });
const id = $props.id();
</script>

<FlightSceneInstrument
  config={PLASMA_SCENE_026}
  label="Plasma light 02.6: a smooth luminous ball"
  light={lit ? PLASMA_LIGHT_026 : undefined}
  {layers}
  tuning={PLASMA_TUNING_026}
>
  {#snippet pane()}
    <p>Plasma’s light</p>
    <div class="rows">
      <label for={`${id}-light`}>Luminous ball</label>
      <Switch id={`${id}-light`} bind:checked={lit} />
    </div>
    <p>Layers</p>
    <div class="rows">
      <label for={`${id}-world`}>World</label>
      <Switch id={`${id}-world`} bind:checked={layers.world} />
      <label for={`${id}-fx`}>FX</label>
      <Switch id={`${id}-fx`} bind:checked={layers.fx} />
      <label for={`${id}-lfx`}>LFX</label>
      <Switch id={`${id}-lfx`} bind:checked={layers.lfx} />
    </div>
  {/snippet}
</FlightSceneInstrument>

<style>
.rows {
  display: grid;
  grid-template-columns: max-content max-content;
  align-items: center;
  gap: var(--spacing-sm) var(--spacing-md);
}
</style>
