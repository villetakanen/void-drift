<script lang="ts">
import BrandSlider from "./BrandSlider.svelte";

let { label = "Slider treatments" }: { label?: string } = $props();

const variants = [
  {
    id: "solid",
    name: "A · Solid",
    note: "A lime fill up to a solid lime knob; label and value stay neutral.",
  },
  {
    id: "ring",
    name: "B · Ring",
    note: "A thinner lime fill up to a lime ring; lighter on the surface.",
  },
] as const;

// Each variant keeps its own values, so the two can be set independently.
let time = $state<Record<string, number>>({ solid: 4.2, ring: 4.2 });
let thrust = $state<Record<string, number>>({ solid: 38000, ring: 38000 });
</script>

<section class="comparison" aria-label={label}>
  {#each variants as v}
    <div>
      <h3>{v.name}</h3>
      <p>{v.note}</p>
      <div class="surface">
        <BrandSlider
          knob={v.id}
          label="Time"
          unit="s"
          digits={2}
          min={0}
          max={14}
          step={1 / 60}
          bind:value={time[v.id]}
        />
        <BrandSlider
          knob={v.id}
          label="Plasma thrust"
          unit="force"
          min={20000}
          max={60000}
          step={500}
          bind:value={thrust[v.id]}
        />
        <BrandSlider
          knob={v.id}
          preview
          label="Hover, previewed"
          unit="force"
          min={20000}
          max={60000}
          step={500}
          value={38000}
        />
      </div>
    </div>
  {/each}
</section>

<style>
.comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg);
}
h3 {
  margin: 0 0 var(--spacing-xs);
}
p {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-dim);
}
.surface {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-void-light);
  border: var(--flight-border);
}
</style>
