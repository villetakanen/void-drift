<script lang="ts">
import type { Track } from "../../../lib/instrument";

// The legend (lab-instrument study, 02.11): one row naming two to six vehicles,
// each with a short line in its colour; in field mode, also how its path ended.
let { tracks }: { tracks: Track[] } = $props();
const OUTCOME = {
	star: "hit the sun",
	hull: "hull lost",
	power: "power lost",
	free: "free",
	bound: "bound",
} as const;
</script>

<ul class="legend" aria-label="Vehicles">
	{#each tracks as t}
		<li>
			<i style={`background:${t.color}`}></i>{t.label}
			{#if t.run}
				<span class="outcome">{OUTCOME[t.run.outcome]}</span>
			{/if}
		</li>
	{/each}
</ul>

<style>
.legend {
	display: flex;
	align-items: center;
	gap: 32px;
	height: 24px;
	margin: 0;
	padding: 0;
	list-style: none;
	font: 15px var(--font-family-ui);
	white-space: nowrap;
}
.outcome {
	margin-left: 8px;
	color: var(--color-text-muted);
}
i {
	display: inline-block;
	width: 24px;
	height: 3px;
	margin-right: 8px;
	vertical-align: middle;
}
</style>
