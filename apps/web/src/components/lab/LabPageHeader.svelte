<script lang="ts">
import Switch from "../inputs/Switch.svelte";
import PageHeader from "../PageHeader.svelte";
import ComponentFrame from "./ComponentFrame.svelte";

let {
  variant = "site",
  controlLabel = "",
}: {
  variant?: "site" | "page" | "controls";
  controlLabel?: string;
} = $props();
let exampleMode = $state(false);
const exampleId = $props.id();
</script>

{#if variant === "controls"}
  <ComponentFrame>
    <PageHeader
      title="Hangar"
      navigationLabel="Example navigation"
      links={[{ href: "/settings?from=hangar", label: "Settings" }]}
    >
      {#snippet actions()}
        <label for={exampleId}>
          {controlLabel}
          <Switch id={exampleId} bind:checked={exampleMode} />
        </label>
      {/snippet}
    </PageHeader>
  </ComponentFrame>
{:else}
  <ComponentFrame>
    <PageHeader
      title="Design system"
      pageName={variant === "page" ? "Page header" : undefined}
      href="/lab/ds"
    />
  </ComponentFrame>
{/if}

<style>
label {
  font-size: var(--font-size-body);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
</style>
