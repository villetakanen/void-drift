<script lang="ts">
import Toggle from "../../inputs/Toggle.svelte";
import BladeDrawing from "./BladeDrawing.svelte";
import { bladeAssembly } from "./blade-assembly";

let { label = "Root pair view" }: { label?: string } = $props();
let view = $state("Top");
const models = (["Faces", "Root"] as const).map((stage) => ({
	stage,
	title: stage === "Faces" ? "Copied faces" : "Root added",
	faces: [
		...bladeAssembly(stage, false, -12, { walls: false }),
		...bladeAssembly(stage, true, 12, { walls: false }),
	],
}));
</script>

<div class="controls">
	<Toggle {label} options={["Top", "Angled"]} bind:value={view} />
	<span>Same scale · same spacing · light from ship-left</span>
</div>
<div class="comparison">
	{#each models as model}
		<figure>
			<figcaption>{model.title}</figcaption>
			<BladeDrawing
				faces={model.faces}
				{view}
				pair
				label={`${model.title}, mirrored pair without walls, ${view.toLowerCase()} view`}
			/>
			<p>
				{model.stage === "Faces"
					? "Each blade carries the original nose and long side. The complex inner edge stays exposed."
					: "Only the triangular roots are added. The nose and bend stay intact, with a broader rear attachment and an open middle."}
			</p>
		</figure>
	{/each}
</div>
<p class="caption">
	These are exposed surfaces with illustrative height. The angled view shows
	their relationship; the underside and hull connection remain unresolved.
</p>

<style>
.controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: var(--spacing-md) var(--spacing-lg);
	margin-block: var(--spacing-lg);
}
.controls span,
.caption {
	color: var(--color-text-muted);
	font-size: var(--font-size-caption);
}
.comparison {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--spacing-xl);
}
figure {
	min-width: 0;
	margin: 0;
}
figcaption {
	font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
	border-top: 1px solid var(--color-border);
	padding-block: var(--spacing-md);
}
figure p {
	margin-block: var(--spacing-md);
}
.caption {
	max-width: var(--measure-prose);
}
@media (max-width: 600px) {
	.comparison {
		gap: var(--spacing-md);
	}
	figcaption,
	figure p {
		font-size: var(--font-size-caption);
	}
}
</style>
