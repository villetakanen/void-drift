<script lang="ts">
import { DERELICT_INSTRUMENT_SCENE as config } from "../../lib/flight-scene/derelict-fixture";
import RingSlider from "../inputs/RingSlider.svelte";
import FlightSceneInstrument from "./flight-scene/FlightSceneInstrument.svelte";

let { label = "Staged derelict encounter" }: { label?: string } = $props();
let hull = $state<{ current: number; maximum: number } | null>(null);
let wreckSpin = $state(0.3);
</script>

<section class="stage" aria-label="Derelict encounter">
  <FlightSceneInstrument
    {config}
    {wreckSpin}
    fixedBurn
    onTargetHull={(value) => (hull = value)}
    {label}
  >
    {#snippet screenReadout()}
      <div class="hull">
        <label for="derelict-hull"
          >Derelict hull:
          {hull
            ? `${Math.max(0, hull.current).toFixed(0)} / ${hull.maximum.toFixed(0)}`
            : "Loading"}</label
        >
        <progress
          id="derelict-hull"
          value={hull ? Math.max(0, hull.current) : 0}
          max={hull?.maximum ?? 1}
        ></progress>
      </div>
    {/snippet}
    {#snippet pane(_document)}
      <h2>Test condition</h2>
      <p>
        A Wasp with one ion point defence and a derelict start with no linear
        velocity outside the gravity field. Thrusters are off during the
        encounter; the weapon fires in the shared simulation.
      </p>
      <RingSlider
        label="Rotational speed"
        bind:value={wreckSpin}
        min={0}
        max={2}
        step={0.1}
        digits={1}
        unit="rad/s"
      />
    {/snippet}
  </FlightSceneInstrument>
</section>

<style>
.stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.hull {
  width: 12rem;
  padding: var(--spacing-sm);
  color: var(--color-text);
  font: var(--font-size-caption) var(--font-family-ui);
}
progress {
  display: block;
  width: 100%;
}
</style>
