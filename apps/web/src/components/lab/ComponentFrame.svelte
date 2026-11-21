<script lang="ts">
import type { Snippet } from "svelte";

let { children }: { children: Snippet } = $props();
</script>

<div class="component-frame">
  {@render children()}
</div>

<style>
.component-frame {
  container: component-frame / inline-size;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px dashed var(--color-border);
}
</style>
