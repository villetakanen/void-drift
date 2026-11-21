<script lang="ts">
import {
  type BurnId,
  calculate,
  InstrumentConfig,
  SECONDS,
  TICK_RATE,
  TRACK_COLORS,
  type Track,
  traces,
} from "../../lib/instrument";
import { STARTER_DOCUMENT } from "../../lib/instrument/starter";
import RingSlider from "../inputs/RingSlider.svelte";
import BurnRow from "./instrument/BurnRow.svelte";
import Legend from "./instrument/Legend.svelte";
import PathPane from "./instrument/PathPane.svelte";
import SideSheet from "./instrument/SideSheet.svelte";
import TimeGraph from "./instrument/TimeGraph.svelte";

let {
  part,
}: {
  part: "side-sheet" | "burn-row" | "path-pane" | "time-graph" | "legend";
} = $props();

const doc = InstrumentConfig.parse(STARTER_DOCUMENT);
const tracks = doc.vehicles.map((vehicle, i) => {
  const samples = calculate(vehicle, doc.burn, {}, doc.properties);
  return {
    label: vehicle.label,
    color: TRACK_COLORS[i],
    samples,
    traces: traces(samples),
  };
});
const legendTracks = (labels: string[]): Track[] =>
  labels.map((label, i) => ({
    label,
    color: TRACK_COLORS[i],
    samples: [],
    traces: { speed: [], acceleration: [], turn: [] },
  }));
const threeTracks = legendTracks(["Scout", "Fighter", "Corvette"]);
const sixTracks = legendTracks([
  "Scout",
  "Fighter",
  "Corvette",
  "Ion",
  "Fusion",
  "Plasma",
]);
let burn = $state<BurnId>("course");
let time = $state(7);
const tick = $derived(Math.round(time * TICK_RATE));
</script>

{#if part === "side-sheet"}
  <div class="demo side-sheet-host">
    <p class="caption">The host supplies the sheet's contents.</p>
    <SideSheet title="Parameters" label="Instrument parameters">
      <p>Experiment values, controls and readouts.</p>
    </SideSheet>
  </div>
{:else if part === "burn-row"}
  <div class="demo timeline-demo">
    <BurnRow bind:burn {tick} />
    <RingSlider
      label="Time for the example"
      unit="s"
      digits={2}
      min={0}
      max={SECONDS}
      step={1 / TICK_RATE}
      bind:value={time}
    />
  </div>
{:else if part === "path-pane"}
  <div class="demo display-demo">
    <PathPane {tracks} {tick} size={672} />
  </div>
{:else if part === "time-graph"}
  <div class="demo display-demo">
    <RingSlider
      label="Time for the examples"
      unit="s"
      digits={2}
      min={0}
      max={SECONDS}
      step={1 / TICK_RATE}
      bind:value={time}
    />
    <div class="graph-stack">
      <div>
        <p class="caption">Speed</p>
        <TimeGraph measure="speed" {tracks} {tick} />
      </div>
      <div>
        <p class="caption">Turn acceleration</p>
        <TimeGraph measure="turn" {tracks} {tick} />
      </div>
    </div>
  </div>
{:else}
  <div class="demo display-demo">
    <div class="legend-stack">
      <Legend tracks={threeTracks} />
      <Legend tracks={sixTracks} />
    </div>
  </div>
{/if}

<style>
.demo {
  display: grid;
  justify-items: start;
  gap: var(--spacing-md);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: var(--spacing-md);
  background: var(--color-elev-1);
  font-family: var(--font-family-ui);
}
.side-sheet-host {
  position: relative;
  justify-self: center;
  height: 360px;
  max-width: 840px;
  overflow: hidden;
  background: var(--surface-display);
}
.timeline-demo {
  max-width: 900px;
}
.display-demo {
  overflow-x: auto;
}
.graph-stack {
  display: grid;
  gap: var(--spacing-lg);
}
.legend-stack {
  display: grid;
  gap: var(--spacing-md);
}
.caption {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
</style>
