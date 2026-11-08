<script lang="ts">
import type { BurnId } from "../../../lib/instrument";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import MotionInstrumentScreen from "../../lab/instrument/MotionInstrumentScreen.svelte";
import type { FieldProfile } from "./charging";
import { breakEven, chargingRuns, radius, reach } from "./charging";

let {
  label = "Sun charging: three approach offsets",
  compareShapes = false,
}: { label?: string; compareShapes?: boolean } = $props();
let shape = $state("10% edge");
const profile = $derived<FieldProfile>(
  !compareShapes || shape === "Reference"
    ? "reference"
    : shape === "10% edge"
      ? "edge"
      : "shoulder",
);
const selectedBudget = { peak: 7.5, lifeSupport: 0.8, ionDraw: 1.0 };
let peak = $state(selectedBudget.peak);
let lifeSupport = $state(selectedBudget.lifeSupport);
let ionDraw = $state(selectedBudget.ionDraw);
const poweredDrain = $derived(lifeSupport + ionDraw);
function resetBudget() {
  peak = selectedBudget.peak;
  lifeSupport = selectedBudget.lifeSupport;
  ionDraw = selectedBudget.ionDraw;
}
let burn = $state<BurnId>("course");
const tracks = $derived(
  chargingRuns(burn, peak, lifeSupport, ionDraw, profile),
);
const coast = $derived(breakEven(lifeSupport, peak, profile));
const powered = $derived(breakEven(poweredDrain, peak, profile));
</script>
<div class="instrument">
  <MotionInstrumentScreen
    {tracks}
    bind:burn
    measures={["collection", "consumption", "netPower", "batteryChange"]}
    bodies={[
      {
        kind: "sun",
        label: "Terra baseline",
        color: "#ffaa00",
        radius,
        reach,
        path: [{ x: 0, y: 0 }],
      },
    ]}
    {label}
  >
    {#if compareShapes}
      <h3>Collection profile</h3>
      <Toggle
        label="Collection profile"
        options={["Reference", "10% edge", "20 u shoulder"]}
        bind:value={shape}
      />
      <p>
        Reference: linear from surface peak to zero at the edge. 10% edge: same
        peak, falling to 0.75 E/s at the edge at the selected 7.5 E/s budget.
        Shoulder: maximum collection extends 20 u beyond the surface before
        falling to 10%. Outside the boundary, collection is zero in every case.
      </p>
    {/if}
    <div class="budget-controls">
      <RingSlider
        label="Life-support draw"
        unit="E/s"
        min={0}
        max={4}
        step={0.1}
        bind:value={lifeSupport}
        digits={1}
      />
      <RingSlider
        label="Ion power draw"
        unit="E/s"
        min={0}
        max={6}
        step={0.1}
        bind:value={ionDraw}
        digits={1}
      />
      <RingSlider
        label="Candidate peak collection"
        unit="E/s"
        min={0.5}
        max={12}
        step={0.5}
        bind:value={peak}
        digits={1}
      />
    </div>
    <button type="button" onclick={resetBudget}>
      Reset to selected budget
    </button>

    <div class="budget-summary">
      Net gain while coasting inside
      {coast === null ? "no radius" : `${coast.toFixed(0)} u`}; forward thrust
      inside {powered === null ? "no radius" : `${powered.toFixed(0)} u`}.
      Surface {radius} u · field edge {reach.toFixed(0)} u. Energy edits keep
      paths fixed.
    </div>

    <h3>Charging experiment</h3>
    <p>
      Same Wasp, inherent solar collection, one Light ion, stabilizers on, empty
      equipment slots; no aft mounts. Starting position: x −400 u; y 100, 220 or
      300 u. Initial velocity: +120 u/s along x. Same selected B1/B2/B3 input
      program for every path.
    </p>
    <p>
      Production propulsion and gravity, 14 seconds at 60 Hz with four motion
      substeps. No randomness, planets or wrapping. Contact stops a trace.
      Energy is a candidate calculation over these paths: battery limits and
      radiation damage do not change the motion.
    </p>
  </MotionInstrumentScreen>
</div>
<p>
  Battery change starts at zero and accumulates net charging. It is an unclamped
  change in stored energy, not a battery percentage: negative means energy spent
  from the starting reserve. Capacity, depletion and hull damage do not alter
  these paths.
</p>
<table>
  <caption>
    Whole-pass energy balance (integral of net charging)
  </caption>
  <thead>
    <tr>
      <th>Approach</th>
      <th>Duration</th>
      <th>Energy change</th>
      <th>End</th>
    </tr>
  </thead>
  <tbody>
    {#each tracks as t}
      <tr>
        <td>{t.label}</td>
        <td>{((t.samples.length - 1) / 60).toFixed(2)} s</td>
        <td>{(t.traces.batteryChange?.at(-1) ?? 0).toFixed(2)} E</td>
        <td>
          {t.contacts?.length ? "Contact — trace stopped" : "14 s completed"}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
<style>
.budget-controls {
  display: grid;
  grid-template-columns: 1fr;
  margin-block: 24px;
  gap: 32px;
}
button {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-action);
  color: var(--color-action);
  cursor: pointer;
  min-height: 44px;
}
button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 4px;
}
.budget-summary {
  margin-block: 24px;
  font: 15px var(--font-family-ui);
}
p {
  max-width: var(--measure-prose);
  margin-block: var(--spacing-md);
}
.instrument {
  width: 100vw;
  height: 100svh;
  min-height: 820px;
  margin-inline: calc(50% - 50vw);
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-block: var(--spacing-lg);
}
th,
td {
  text-align: left;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}
caption {
  text-align: left;
}
</style>
