<script lang="ts">
import type { BurnId } from "../../../lib/instrument/burns";
import RingSlider from "../../inputs/RingSlider.svelte";
import MotionInstrumentScreen from "../../lab/instrument/MotionInstrumentScreen.svelte";
import { FittingTuning, fittingTracks } from "./fitting-flight";

let tune = $state(FittingTuning.parse({}));
let burn = $state<BurnId>("turn");
let tracks = $derived(fittingTracks(burn, tune));
</script>
<MotionInstrumentScreen
  {tracks}
  bind:burn
  measures={["speed", "acceleration", "turn", "battery"]}
  label="Fission fitting comparison"
>
  <div class="controls">
    <RingSlider
      label="Push on reference Wasp"
      unit="u/s"
      min={10}
      max={250}
      step={1}
      bind:value={tune.push}
    />
    <RingSlider
      label="Kick interval"
      unit="s"
      min={0.05}
      max={1}
      step={1 / 60}
      digits={3}
      bind:value={
        () => tune.interval / 60,
        (s) => (tune.interval = Math.round(s * 60))
      }
    />
    <RingSlider
      label="Maximum-speed gain"
      unit="u/s"
      min={12}
      max={60}
      step={1}
      bind:value={tune.speedGain}
    />
    <RingSlider
      label="Fission engine mass"
      min={1}
      max={48}
      step={1}
      bind:value={tune.mass}
    />
    <RingSlider
      label="Energy per ignition"
      unit="E"
      min={0}
      max={50}
      step={0.5}
      digits={1}
      bind:value={tune.cost}
    />
    <table>
      <thead>
        <tr>
          <th>Fitting</th>
          <th>Mass</th>
          <th>Ceiling (u/s)</th>
        </tr>
      </thead>
      <tbody>
        {#each tracks as t}
          <tr>
            <td>{t.label}</td>
            <td>{t.mass}</td>
            <td>{t.ceiling}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</MotionInstrumentScreen>
<style>
.controls {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}
table {
  text-align: left;
  font-variant-numeric: tabular-nums;
}
</style>
