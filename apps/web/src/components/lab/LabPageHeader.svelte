<script lang="ts">
import RingSlider from "../inputs/RingSlider.svelte";
import Switch from "../inputs/Switch.svelte";
import PageHeader from "../PageHeader.svelte";

let width = $state(48);
let playground = $state(false);
const switchId = $props.id();
</script>

<div class="catalog">
  <p>
    The shared header owns the home link, page title and layout. Each page
    supplies its controls and destinations.
  </p>
  <div class="width-control">
    <RingSlider
      label="Example width"
      unit="rem"
      min={22}
      max={48}
      step={1}
      bind:value={width}
    />
  </div>
  <div class="example" style:max-width={`${width}rem`}>
    <PageHeader
      title="Hangar"
      level={2}
      navigationLabel="Example navigation"
      links={[{ href: "/settings?from=hangar", label: "Settings" }]}
    >
      {#snippet actions()}
        <label for={switchId}>
          Playground
          <Switch id={switchId} bind:checked={playground} />
        </label>
      {/snippet}
    </PageHeader>
  </div>
</div>

<style>
.catalog {
  display: grid;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}
.width-control {
  max-width: 24rem;
}
.example {
  padding-inline: var(--spacing-md);
  border: 1px solid var(--color-border-subtle);
}
label {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
</style>
