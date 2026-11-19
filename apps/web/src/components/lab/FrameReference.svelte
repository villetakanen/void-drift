<script lang="ts">
import {
  FLIGHT_LAYERS,
  FLIGHT_PASSES,
  FLIGHT_SKY_LAYER,
} from "@void-drift/mode-a";

// Every row is read from the production frame; this page holds no copy of it.
const layers = FLIGHT_LAYERS.map((layer) => ({
  ...layer,
  passes: FLIGHT_PASSES.filter((pass) => pass.layer === layer.id),
}));
</script>

<section class="frame-reference" aria-labelledby="frame-reference-title">
  <p class="eyebrow">Frame reference</p>
  <h2 id="frame-reference-title">What the game's frame draws</h2>
  <p class="intro">
    The game draws each frame as an ordered list of passes on these three
    layers. Layers are listed bottom to top and passes in draw order, read from
    the production pass list.
  </p>
  <section class="layer">
    <h3>{FLIGHT_SKY_LAYER.name}</h3>
    <p class="holds">
      {FLIGHT_SKY_LAYER.holds}
      · blend {FLIGHT_SKY_LAYER.blend} · {FLIGHT_SKY_LAYER.memory}
    </p>
  </section>
  {#each layers as layer}
    <section class="layer" data-layer={layer.id}>
      <h3>{layer.name}</h3>
      <p class="holds">{layer.holds} · blend {layer.blend} · {layer.memory}</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Pass</th>
            <th scope="col">Space</th>
            <th scope="col">Draws</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {#each layer.passes as pass}
            <tr data-pass={pass.id}>
              <th scope="row">{pass.name}</th>
              <td>{pass.space}</td>
              <td>
                {pass.draws}
                {#if pass.composition}
                  ({pass.composition})
                {/if}
              </td>
              <td><code>{pass.source}</code></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/each}
</section>

<style>
.frame-reference {
  box-sizing: border-box;
  width: 100%;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border-subtle);
}
.eyebrow {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
}
h2 {
  margin: 0;
  font-size: var(--font-size-heading);
}
.intro {
  max-width: var(--measure-prose);
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.layer {
  margin-top: var(--spacing-lg);
}
h3 {
  margin: 0;
  font-size: var(--font-size-label);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
}
.holds {
  margin: var(--spacing-xs) 0 var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-family-ui);
  font-size: var(--font-size-label);
}
th,
td {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 0;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border);
  font-weight: var(--font-weight-regular);
}
thead th {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
tbody th {
  white-space: nowrap;
}
code {
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
</style>
