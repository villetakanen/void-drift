<script lang="ts">
import type { Snippet } from "svelte";

let { children, fit = false }: { children: Snippet; fit?: boolean } = $props();
</script>

<div class={["component-frame", { fit }]}>
  {@render children()}
</div>

<style>
/* flow-root keeps the content's margins inside the line; the outline takes no layout space. */
.component-frame {
  display: flow-root;
  outline: 1px dashed var(--color-border);
}
.component-frame:not(.fit) {
  container: component-frame / inline-size;
  width: 100%;
  min-width: 0;
}
.component-frame.fit {
  width: fit-content;
  max-width: 100%;
}
</style>
