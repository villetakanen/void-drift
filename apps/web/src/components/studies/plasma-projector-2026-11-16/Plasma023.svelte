<script lang="ts">
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import { config, makeExperiment, type Readout } from "./round023";

let { label = "02.3 · Plasma Projector" }: { label?: string } = $props();
let check = $state(65);
let timing = $state("Preparation");
let encounter = $state("Close pass");
let status = $state<Readout>({
  phase: "Approach",
  power: 100,
  spent: 0,
  contacts: 0,
  vents: 0,
});
function report(value: Readout) {
  status = value;
}
const experiment = $derived(makeExperiment({ check, timing }, report));
const start = $derived(
  encounter === "Missed pass"
    ? { ...config.start, rotation: -Math.PI / 2 - 0.34 }
    : config.start,
);
</script>
<div class="study">
  <FlightSceneInstrument {config} {experiment} {start} {label}>
    {#snippet pane()}
      <p>
        02.3 · Experimental weapon. One paid charge at 0.50 s; only close
        contact releases it.
      </p>
      <Toggle
        label="Approach"
        options={["Close pass", "Missed pass"]}
        bind:value={encounter}
      />
      <RingSlider
        label="Backward velocity change"
        unit="u/s"
        min={0}
        max={120}
        step={5}
        bind:value={check}
      />
      <Toggle
        label="Response timing"
        options={["Preparation", "Release"]}
        bind:value={timing}
      />
      <p>
        Default: 65 u/s over 0.40 s during preparation. Zero is the unchanged
        flight baseline. Release applies the same response only after a
        successful eruption.
      </p>
      <p>
        Charge: 0.50–1.40 s. Close acquisition: 1.40–1.85 s. Cooling vents:
        0.70, 1.15, 1.70 and 2.20 s. B1 continues to 14 s; other burns can meet
        the star.
      </p>
    {/snippet}
  </FlightSceneInstrument>

  <output class="status" aria-live="off">
    <strong>{status.phase}</strong>
    <span
      >Energy {status.power.toFixed(1)} · charge spent {status.spent} · vents
      {status.vents}/4 · damage contacts {status.contacts}</span
    >
  </output>
</div>
<style>
.study {
  position: relative;
  width: 100%;
  height: 100%;
}
.status {
  position: absolute;
  top: max(5rem, calc((100% - 62.5vw) / 2 + 5rem));
  left: var(--spacing-lg);
  display: grid;
  gap: var(--spacing-xs);
  pointer-events: none;
  color: var(--color-text);
  font-family: var(--font-family-ui);
  font-size: 14px;
}
.status span {
  color: var(--color-text-muted);
}
</style>
