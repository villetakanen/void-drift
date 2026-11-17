<script lang="ts">
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import {
  consumption,
  encounters,
  readEncounter,
  shipRadius,
  stats,
} from "./fields";

let { label = "Stellar encounter field comparison" }: { label?: string } =
  $props();
let distance = $state(160);
let engine = $state("Coasting");
const powered = $derived(engine === "Main engine firing");
const readings = $derived(
  encounters.map((encounter) => ({
    ...encounter,
    ...readEncounter(encounter, distance, powered),
  })),
);
const x = (d: number) => 270 + (d / 600) * 730;
const ticks = [0, 100, 200, 300, 400, 500, 600];
</script>

<section class="comparison" aria-label={label}>
  <div class="controls">
    <RingSlider
      label="Distance from star centre"
      unit="u"
      min={0}
      max={600}
      step={1}
      bind:value={distance}
    />
    <Toggle
      label="Wasp engine state"
      options={["Coasting", "Main engine firing"]}
      bind:value={engine}
    />
  </div>
  <p class="caption">
    One radial section per star · every row uses the same world scale. The white
    marker is the Wasp’s centre, not a flight path.
  </p>
  <svg
    viewBox="0 0 1040 480"
    role="img"
    aria-label="Body, collection and exposure extents on a shared distance axis"
  >
    <defs>
      <pattern
        id="stellar-exposure"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <path d="M0 8L8 0" class="hatch" />
      </pattern>
    </defs>
    {#each ticks as tick}
      <line x1={x(tick)} x2={x(tick)} y1="40" y2="421" class="grid" />
      <text x={x(tick)} y="458" text-anchor="middle">{tick}</text>
    {/each}
    <text x="270" y="24">Distance from centre →</text>
    {#each encounters as encounter, index}
      {@const y = 66 + index * 128}
      <text x="16" y={y + 8} class="row-title">{encounter.name}</text>
      <text x="16" y={y + 32} class="muted">{encounter.character}</text>
      <rect
        x={x(encounter.radius)}
        {y}
        width={x(encounter.collection.reach) - x(encounter.radius)}
        height="36"
        class="collection-area"
      />
      <rect
        x={x(encounter.radius)}
        {y}
        width={x(encounter.exposure.reach) - x(encounter.radius)}
        height="36"
        fill="url(#stellar-exposure)"
      />
      <rect
        x={x(0)}
        {y}
        width={x(encounter.radius) - x(0)}
        height="36"
        fill={encounter.color}
      />
      <line
        x1={x(encounter.radius + shipRadius)}
        x2={x(encounter.radius + shipRadius)}
        y1={y - 6}
        y2={y + 42}
        class="contact"
      />
      <line
        x1={x(encounter.radius)}
        x2={x(encounter.collection.reach)}
        y1={y + 44}
        y2={y + 44}
        class="collection-edge"
      />
      <line
        x1={x(encounter.radius)}
        x2={x(encounter.exposure.reach)}
        y1={y + 52}
        y2={y + 52}
        class="exposure-edge"
      />
      <line
        x1={x(distance)}
        x2={x(distance)}
        y1={y - 10}
        y2={y + 62}
        class="cursor"
      />
      <path d={`M${x(distance) - 5} ${y - 16}h10l-5 7z`} class="cursor-tip" />
      <text x="270" y={y + 84} class="muted">
        Body {encounter.radius} u · exposure ends {encounter.exposure.reach} u ·
        collection ends {encounter.collection.reach.toFixed(0)} u
      </text>
    {/each}
  </svg>
  <p class="caption">
    Solid orange: luminous body · green: collection · red hatching: exposure ·
    dotted line: first contact including the Wasp’s hull width.
  </p>
  <table aria-label="Local energy and exposure at the selected distance">
    <caption>
      At {distance} u · {consumption(powered).toFixed(2)} E/s consumption
    </caption>
    <thead>
      <tr>
        <th>Encounter</th>
        <th>Collection</th>
        <th>Net energy</th>
        <th>Exposure</th>
        <th>Hull clearance</th>
      </tr>
    </thead>
    <tbody>
      {#each readings as reading}
        <tr data-encounter={reading.id}>
          <th scope="row">{reading.name}</th>
          {#if reading.contact}
            <td colspan="4" class="contact-state">
              Terminal contact — no usable collection here
            </td>
          {:else}
            <td>{reading.collection.toFixed(2)} E/s</td>
            <td>{reading.net > 0 ? "+" : ""}{reading.net.toFixed(2)} E/s</td>
            <td>{reading.exposure.toFixed(2)} hull/s</td>
            <td>{reading.clearance.toFixed(1)} u</td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="caption">
    Same Wasp: one Light ion main engine, stabilizers on, empty equipment slots;
    {stats.coils}
    inherent collector-equivalent. Local rates only, with zero spin. No gravity,
    motion, battery saturation or depletion is calculated. Positive net energy
    does not establish a safe orbit; zero exposure does not mean no pull.
  </p>
  <details>
    <summary>Working profiles and limits</summary>
    <table>
      <thead>
        <tr>
          <th>Encounter</th>
          <th>Collection shoulder / peak</th>
          <th>Exposure shoulder / peak</th>
        </tr>
      </thead>
      <tbody>
        {#each encounters as encounter}
          <tr>
            <th>{encounter.name}</th>
            <td>
              {encounter.collection.shoulder}
              u / {encounter.collection.peak} E/s
            </td>
            <td>
              {encounter.exposure.shoulder}
              u / {encounter.exposure.peak} hull/s
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p>
      The standard row reads production definitions. The other rows are explicit
      study hypotheses, not values derived from astrophysical units. All use the
      production plateau/linear field law: collection falls to 10% at its exact
      edge and is zero outside; exposure falls to zero at its edge. The markers
      use the production Wasp collision radius ({shipRadius.toFixed(1)}
      u). Both orange candidates deliberately share a hue; this is a schematic,
      not proposed star artwork or an in-game HUD.
    </p>
  </details>
</section>

<style>
.comparison {
  margin-block: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-elev-1);
}
.controls {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto;
  align-items: center;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}
p {
  max-width: var(--measure-prose);
  margin-block: var(--spacing-md);
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
svg {
  width: 100%;
  display: block;
  background: var(--color-elev-2);
}
text {
  fill: var(--color-text);
  font: 14px var(--font-family-ui);
}
.row-title {
  font-weight: 600;
}
.muted {
  fill: var(--color-text-muted);
  font-size: 12px;
}
.grid {
  stroke: var(--color-border);
}
.collection-area {
  fill: var(--color-android-green);
  fill-opacity: 0.12;
}
.collection-edge {
  stroke: var(--color-android-green);
  stroke-width: 2;
}
.exposure-edge,
.hatch {
  stroke: var(--color-resource-danger);
}
.exposure-edge {
  stroke-width: 2;
  stroke-dasharray: 2 3;
}
.hatch {
  stroke-opacity: 0.6;
}
.cursor,
.contact {
  stroke: var(--color-text);
}
.cursor-tip {
  fill: var(--color-text);
}
.contact {
  stroke-dasharray: 1 3;
  opacity: 0.7;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-block: var(--spacing-lg);
  font-size: var(--font-size-label);
}
caption {
  text-align: left;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-muted);
}
th,
td {
  text-align: left;
  vertical-align: top;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}
.contact-state {
  color: var(--color-resource-danger);
}
summary {
  cursor: pointer;
  color: var(--color-action);
  padding-block: var(--spacing-md);
}
</style>
