<script lang="ts">
import { untrack } from "svelte";
import RingSlider from "../inputs/RingSlider.svelte";
import FlightSceneInstrument from "../lab/flight-scene/FlightSceneInstrument.svelte";
import {
  PLASMA_ACCEPTED_027,
  PLASMA_SCENE_027,
  plasmaLight027,
} from "./plasma-light-027";

// Plasma light 02.7 in the Flight scene instrument. The menu holds this
// example's own controls: how long plasma charges, and how large and how
// strong the light that shows the charge is.
/** The charge the scene opens with, in seconds; the accepted one by default. */
let { opening = PLASMA_ACCEPTED_027.chargeSeconds }: { opening?: number } =
  $props();
let delay = $state(untrack(() => opening));
let size = $state<number>(PLASMA_ACCEPTED_027.size);
let intensity = $state<number>(PLASMA_ACCEPTED_027.intensity);
const light = $derived(plasmaLight027({ size, intensity }));
const tuning = $derived({ plasma: { chargeSeconds: delay } });
</script>

<FlightSceneInstrument
  config={PLASMA_SCENE_027}
  label="Plasma light 02.7: an adjustable charge"
  {light}
  {tuning}
>
  {#snippet pane()}
    <RingSlider
      label="Charge delay"
      unit="s"
      digits={2}
      min={0.05}
      max={1.2}
      step={0.05}
      bind:value={delay}
    />
    <RingSlider
      label="Indicator size"
      unit="×"
      digits={2}
      min={0.25}
      max={4}
      step={0.25}
      bind:value={size}
    />
    <RingSlider
      label="Indicator intensity"
      unit="×"
      digits={2}
      min={0}
      max={3}
      step={0.25}
      bind:value={intensity}
    />
    <p class="values" data-values>
      delay {delay.toFixed(2)} s · size {size.toFixed(2)} · intensity
      {intensity.toFixed(2)}
    </p>
  {/snippet}
</FlightSceneInstrument>

<style>
.values {
  color: var(--color-text-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
</style>
