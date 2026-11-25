<script lang="ts">
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import Switch from "../../inputs/Switch.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import { DEFAULT_PILOT, EncounterSchema } from "./drone-pilot";
import { AI_SCENE, pilotExperiment } from "./launch";

let { label = "Drone launcher · 02.5 autonomous flight" }: { label?: string } =
  $props();
const rangeId = $props.id();
let options = $state({ ...DEFAULT_PILOT });
let measurements = $state("");
const experiment = $derived(
  pilotExperiment({ ...options }, (value) => (measurements = value)),
);
</script>

<FlightSceneInstrument
  config={AI_SCENE}
  {label}
  {experiment}
  {measurements}
  fixedBurn
  summary={`${options.encounter} · one drone · Fighter response\nLaunch ≤${options.launchRange} u from carrier · pursue <${options.pursuitRange} u · return <${options.returnRange} u from drone\n60 u/s² · 271 u/s engine envelope · 50% ion plume`}
>
  {#snippet pane()}
    <h3>Encounter</h3>
    <SegmentedControl
      label="Target course"
      options={EncounterSchema.options}
      bind:value={options.encounter}
      stretch
    />
    <h3>Experimental ranges</h3>
    <RingSlider
      label="Launch · from carrier"
      min={50}
      max={800}
      step={25}
      unit="u"
      bind:value={options.launchRange}
    />
    <RingSlider
      label="Pursuit · from drone"
      min={50}
      max={800}
      step={25}
      unit="u"
      bind:value={options.pursuitRange}
    />
    <RingSlider
      label="Return · from drone"
      min={50}
      max={800}
      step={25}
      unit="u"
      bind:value={options.returnRange}
    />
    <p>
      One Scout follows a staged flyby. The carrier coasts at 40 u/s while the
      drone chooses its destination every tick. Distances are centre to centre,
      measured from the carrier for launch and from the drone in flight. Launch
      includes its boundary; pursuit and return exclude theirs. These ranges are
      provisional.
    </p>
    <label for={rangeId} class="field-label"
      >Show airborne ranges
      <Switch id={rangeId} bind:checked={options.ranges} /></label
    >
    <p>
      The blue dashed circle shows pursuit range; a separate yellow circle shows
      return range when they differ. An enemy inside takes priority over the
      carrier. Outside both ranges the main drive switches off while stabilizers
      settle the remaining rotation.
    </p>
    <p>
      Launch waits for an enemy inside its range, with a 0.10 s seated preview
      and a final range check. Use 1× to inspect the encounter, or zoom in for a
      turn. Pause and seek to compare moments. The launcher and 50% Service →
      Light Ion plume retain the accepted settings.
    </p>
    <p>
      Return means approach and settle near the carrier. No recovery, energy
      conversion, collision or detonation is simulated. Target motion is staged;
      drone steering is autonomous.
    </p>
    <button
      type="button"
      class="btn"
      onclick={() => (options = { ...DEFAULT_PILOT })}
    >
      Reset encounter values
    </button>
  {/snippet}
</FlightSceneInstrument>
