<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import OptionToggle from "./OptionToggle.svelte";

let {
	label = "Hover treatments for the two-option toggle",
}: { label?: string } = $props();

const variants = [
	{
		id: "lift",
		name: "A · Lift",
		note: "The faint fill brightens; the label stays white.",
	},
	{
		id: "tint",
		name: "D · Brand tint",
		note: "The faint white fill turns to a faint lime fill of the same strength.",
	},
	{
		id: "edge",
		name: "B · Ghost edge",
		note: "The half previews a ghost button: lime border and label.",
	},
	{
		id: "bar",
		name: "C · Indicator bar",
		note: "The shared selected indicator appears along the bottom edge.",
	},
] as const;

// Each variant keeps its own choice, so live and previewed states stay apart.
let scale = $state<Record<string, string>>({
	lift: "Fit all",
	tint: "Fit all",
	edge: "Fit all",
	bar: "Fit all",
});
</script>

<section class="comparison" aria-label={label}>
	{#each variants as v}
		<div>
			<h3>{v.name}</h3>
			<p>{v.note}</p>
			<div class="surface">
				<span class="caption">Resting · point at Default scale</span>
				<OptionToggle
					hover={v.id}
					label="Plan scale"
					options={["Fit all", "Default scale"]}
					bind:value={scale[v.id]}
				/>
				<span class="caption">Hover state, shown without a pointer</span>
				<OptionToggle
					hover={v.id}
					preview
					label="Plan scale, hover preview"
					options={["Fit all", "Default scale"]}
					value="Fit all"
				/>
				<span class="caption">Shared buttons, for reference</span>
				<div class="row">
					<button type="button" class="btn btn-filled">Filled</button>
					<button type="button" class="btn btn-ghost">Ghost</button>
				</div>
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
	justify-items: start;
	gap: var(--spacing-sm);
	padding: var(--spacing-md);
	background: var(--color-void-light);
	border: var(--flight-border);
}
.row {
	display: flex;
	gap: var(--spacing-sm);
}
.caption {
	color: var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
}
</style>
