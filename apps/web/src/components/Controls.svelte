<script lang="ts">
import type { Snippet } from "svelte";

let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div class="controls-panel">
	<h3>{title}</h3>
	<div class="controls-content">
		{@render children?.()}
	</div>
</div>

<style>
.controls-panel {
	background: transparent;
	padding: 1rem;
	height: 100%;
	color: var(--color-text);
	font-family: var(--font-family-ui);
	overflow-y: auto;
}

h3 {
	margin-top: 0;
	font-size: var(--font-size-label);
	color: var(--color-text);
	text-transform: uppercase;
	border-bottom: 2px solid var(--color-text-muted);
	padding-bottom: 0.5rem;
	margin-bottom: 1rem;
	font-weight: var(--font-weight-bold);
}
</style>
