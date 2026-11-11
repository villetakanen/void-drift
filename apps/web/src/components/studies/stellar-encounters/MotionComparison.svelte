<script lang="ts">
import type { BurnId, FieldBody } from "../../../lib/instrument";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import MotionInstrumentScreen from "../../lab/instrument/MotionInstrumentScreen.svelte";
import { encounters } from "./fields";
import { centre, flyEncounter, gravityReach, startingFlight } from "./flight";

let {
  label = "Stellar encounters under the same gravitational pull",
}: { label?: string } = $props();
const choices = ["Standard Sun", "Quiet dwarf", "Cool giant"];
let selected = $state("Quiet dwarf");
let burn = $state<BurnId>(startingFlight.burn);
let startSpeed = $state(startingFlight.startSpeed);
let tick = $state(90);
const encounter = $derived(encounters[choices.indexOf(selected)]);
const runs = $derived(flyEncounter(encounter, { burn, startSpeed }));
const tracks = $derived(runs.map((run) => run.track));
const bodies = $derived<FieldBody[]>([
  {
    kind: "sun",
    label: encounter.name,
    color: encounter.color,
    radius: encounter.radius,
    reach: gravityReach,
    path: [centre],
  },
  {
    kind: "energy",
    label: "Collection",
    color: encounter.color,
    radius: 0,
    reach: encounter.collection.reach,
    path: [centre],
  },
]);
</script>

<MotionInstrumentScreen
  {tracks}
  {bodies}
  bind:burn
  bind:tick
  measures={["distance", "gravity", "netPower", "batteryChange"]}
  {label}
>
  <h3>Encounter geometry</h3>
  <Toggle
    label="Stellar encounter"
    options={choices}
    bind:value={selected}
    stretch
  />
  <div class="speed">
    <RingSlider
      label="Starting speed"
      unit="u/s"
      min={0}
      max={300}
      step={10}
      bind:value={startSpeed}
    />
  </div>
  <p>
    {encounter.name}: body {encounter.radius} u; collection ends
    {encounter.collection.reach.toFixed(0)}
    u; exposure ends
    {encounter.exposure.reach}
    u. Every star uses the same unchanged production mass, cutoff and falloff;
    gravity ends at {gravityReach.toFixed(0)} u.
  </p>
  <h3>Whole-pass budgets</h3>
  {#each runs as run}
    <div class="result" data-offset={run.offset}>
      <h4>Offset {run.offset} u · {run.outcome}</h4>
      <p>
        {run.duration.toFixed(2)}
        s recorded · {run.collectionSeconds.toFixed(2)} s collecting ·
        {run.netGainWithoutExposureSeconds.toFixed(2)}
        s gaining energy without exposure.
      </p>
      <p>
        {run.energyChange > 0 ? "+" : ""}{run.energyChange.toFixed(2)}
        E analytical change · {run.exposureBudget.toFixed(2)} hull exposure
        budget · closest hull clearance
        {Math.max(0, run.minClearance).toFixed(1)}
        u.
      </p>
    </div>
  {/each}
  <h3>Fixed comparison conditions</h3>
  <p>
    Same Wasp and fitting as 02.1; x −400 u relative to the star, y +80, +160 or
    +260 u; heading and velocity along +x; no spin. Same selected production
    burn on every path, 14 s at 60 Hz with four motion substeps. Paths stop at
    the first observed hull contact. No randomness, planets, enemies or arena
    wrap.
  </p>
  <p>
    Dashed circle: gravity cutoff. Green circle: collection edge. Orange disc:
    luminous body. Exposure is counted in the budgets, with no exposure circle
    in this instrument. Graph scales fit the current tracks; read the axes when
    comparing encounters. Use Default scale for the same world scale in the path
    pane.
  </p>
  <p>
    These are unlimited-power analytical paths. Energy and exposure budgets
    never alter motion or end a path; battery change starts at zero, has no
    capacity clamp and is not remaining charge. Hull exposure is not a simulated
    hull reserve. Budgets sample at 60 Hz and omit the final contact interval.
    After contact, cursor readouts hold the last samples; no further budget
    accumulates. This is not continued flight.
  </p>
</MotionInstrumentScreen>

<style>
.speed {
  margin-block: var(--spacing-xl);
}
p {
  margin-block: var(--spacing-md);
  line-height: var(--line-height-prose);
}
h3 {
  font-weight: 500;
  margin-block: var(--spacing-lg) var(--spacing-md);
}
h4 {
  font-size: var(--font-size-label);
  margin: 0;
}
.result {
  padding-block: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}
.result p {
  font-size: var(--font-size-label);
}
</style>
