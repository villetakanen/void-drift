<script lang="ts">
import type { FlightScene } from "../../../lib/flight-scene/scene";
import FlightSceneInstrument from "./FlightSceneInstrument.svelte";

let {
  label,
  config,
  layers,
}: {
  label: string;
  config: unknown;
  layers: Record<"world" | "fx" | "lfx", boolean>;
} = $props();
let instrument: FlightSceneInstrument;
let hull = $state<{ current: number; maximum: number } | null>(null);
let events = $state.raw<FlightScene["fission"] | null>(null);

export function inspectTick(tick: number) {
  instrument?.inspectTick(tick);
}
</script>

<section aria-label={label}>
  <h3>{label}</h3>
  <div class="stage">
    <FlightSceneInstrument
      bind:this={instrument}
      {config}
      {label}
      {layers}
      fixedBurn
      onTargetHull={(value) => (hull = value)}
      onFission={(value) => (events = value)}
    />
  </div>
  <div class="readout">
    <p>Wreck hull: {hull ? `${hull.current} / ${hull.maximum}` : "—"} HP</p>
    <p>
      Last paid ignition{events?.ignitions.length
        ? ` · sim tick ${events.ignitions[0].tick}`
        : ": none"}
    </p>
    {#each events?.ignitions ?? [] as nozzle (nozzle.mountKey)}
      <p>
        {nozzle.mountKey}: ({nozzle.x.toFixed(1)}, {nozzle.y.toFixed(1)}) u ·
        exhaust {((nozzle.exhaustAngle * 180) / Math.PI).toFixed(1)}°
      </p>
    {/each}
    <p>Last contact step{events?.contacts.length ? ":" : ": none"}</p>
    {#each events?.contacts ?? [] as hit}
      <p>
        {hit.ignition.mountKey}
        · front {hit.front + 1} · {hit.time.toFixed(3)} s · −{hit.damage}
        HP
      </p>
    {/each}
  </div>
</section>

<style>
section {
  min-width: 0;
}
h3 {
  margin: 0 0 var(--spacing-sm);
}
.stage {
  aspect-ratio: 16 / 10;
}
.readout {
  padding-block: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  user-select: text;
}
.readout p {
  margin: 0;
}
</style>
