<script lang="ts">
/**
 * Logo Component
 * Renders the mathematical identity of Void Drift
 * Symbol: ∅ ⋅ Δ
 */
interface Props {
	size?: string;
	color?: string;
}

let { size = "1.5rem", color = "var(--color-neon-blue)" }: Props = $props();
</script>

<div class="logo" style="--size: {size}; --color: {color};">
	<span class="symbol" title="Void">&empty;</span>
	<span class="operator" title="Interaction">&sdot;</span>
	<span class="symbol" title="Drift">&Delta;</span>
</div>

<style>
.logo {
	/* Interim until S2 replaces the glyphs with SVG outlines (D1). */
	font-family: var(--font-family-display);
	font-size: var(--size);
	color: var(--color);
	display: inline-flex;
	align-items: center;
	gap: 0.2ch;
	user-select: none;
	font-weight: var(--font-weight-regular);
}

.operator {
	opacity: 0.7;
	margin: 0 0.1ch;
}
</style>
