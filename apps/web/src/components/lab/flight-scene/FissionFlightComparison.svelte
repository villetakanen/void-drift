<script lang="ts">
import {
  FISSION_CONTACT_TICK,
  FISSION_REST_TICKS,
  FISSION_SCENES,
} from "../../../lib/flight-scene/fission-fixture";
import Switch from "../../inputs/Switch.svelte";
import FissionFlightSpecimen from "./FissionFlightSpecimen.svelte";

let { onBack }: { onBack: () => void } = $props();
let specimens: FissionFlightSpecimen[] = [];
let layers = $state({ world: true, fx: true, lfx: true });
const id = $props.id();
const phases = [
  { label: "Before", tick: FISSION_REST_TICKS },
  { label: "Flash", tick: FISSION_REST_TICKS + 1 },
  { label: "Lance", tick: FISSION_REST_TICKS + 4 },
  { label: "Split", tick: FISSION_REST_TICKS + 10 },
  { label: "Contact", tick: FISSION_CONTACT_TICK },
];
</script>

<div class="comparison">
  <div class="actions">
    <h2>Fission flight comparison</h2>
    <button class="btn btn-normal" type="button" onclick={onBack}>
      Back to scene controls
    </button>
  </div>
  <p>
    Two Fighters fly B1 from rest with weapons off. Both use the same side
    engines and face away from an identical wreck. Only the second aft nozzle
    changes. Jump both scenes to a phase, or play and scrub each scene
    independently.
  </p>
  <div class="actions">
    {#each phases as phase (phase.tick)}
      <button
        class="btn btn-normal"
        type="button"
        onclick={() => {
          for (const specimen of specimens) specimen?.inspectTick(phase.tick);
        }}
      >
        {phase.label}
      </button>
    {/each}
    <div class="actions">
      <label for={`${id}-fx`}>FX</label>
      <Switch id={`${id}-fx`} bind:checked={layers.fx} />
      <label for={`${id}-lfx`}>LFX</label>
      <Switch id={`${id}-lfx`} bind:checked={layers.lfx} />
    </div>
  </div>
  <div class="specimens">
    {#each FISSION_SCENES as scene, index (scene.label)}
      <FissionFlightSpecimen
        bind:this={specimens[index]}
        label={scene.label}
        config={scene.document}
        {layers}
      />
    {/each}
  </div>
</div>

<style>
.comparison {
  height: 100%;
  overflow: auto;
  padding: var(--spacing-md);
  box-sizing: border-box;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}
h2 {
  margin: 0 auto 0 0;
}
p {
  max-width: 90ch;
  margin-block: var(--spacing-sm);
  color: var(--color-text-muted);
}
.specimens {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}
</style>
