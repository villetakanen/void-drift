<script lang="ts">
import InstrumentScreen from "./InstrumentScreen.svelte";

let { label = "Path instrument in a container" }: { label?: string } = $props();
const presets = [
	{ label: "Full column", width: null },
	{ label: "900", width: 900 },
	{ label: "600", width: 600 },
];
let width = $state<number | null>(null);
</script>

<section aria-label={label}>
	<div class="controls">
		<span>Container width</span>
		{#each presets as preset}
			<button
				type="button"
				aria-pressed={width === preset.width}
				onclick={() => (width = preset.width)}
			>
				{preset.label}
			</button>
		{/each}
	</div>
	<div class="frame" style={width === null ? "" : `width:${width}px`}>
		<InstrumentScreen />
	</div>
</section>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--spacing-xs);
	margin-bottom: var(--spacing-sm);
	font: var(--font-small) var(--font-flight);
	color: var(--color-text-dim);
}
.controls span {
	margin-right: var(--spacing-xs);
}
button {
	padding: var(--spacing-xs) var(--spacing-md);
	min-height: 32px;
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
	cursor: pointer;
}
button[aria-pressed="true"] {
	background: var(--color-acid-lime);
	color: var(--color-void);
	border-color: var(--color-acid-lime);
}
button:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
.frame {
	max-width: 100%;
}
:global(html:has(.frame)) {
	scroll-snap-type: y proximity;
}
</style>
