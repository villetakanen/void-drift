<script lang="ts">
import PathInstrument from "./PathInstrument.svelte";
import { speedCeilingStudy, thrustStudy } from "./path-fixtures";

const studies = [
  { name: "Study A · varies thrust", series: thrustStudy },
  { name: "Study B · varies speed ceiling", series: speedCeilingStudy },
];
const rows = [
  { title: "Each study chooses its own axes", scale: "fit" as const },
  { title: "One fixed instrument", scale: "fixed" as const },
];
</script>

<div class="rows">
  {#each rows as row}
    <section>
      <h4>{row.title}</h4>
      <div class="pair">
        {#each studies as study}
          <div>
            <p class="name">{study.name}</p>
            <PathInstrument
              series={study.series}
              scale={row.scale}
              label={`${study.name}, ${row.title}`}
            />
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
.rows {
  display: grid;
  gap: var(--spacing-lg);
}
h4 {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-acid-lime);
  font: var(--font-small) var(--font-flight);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr));
  gap: var(--spacing-md);
}
.name {
  margin: 0 0 var(--spacing-xs);
  font: var(--font-small) var(--font-flight);
  color: var(--color-text-dim);
}
</style>
