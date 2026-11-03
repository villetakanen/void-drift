<script lang="ts">
import Toggle from "../../inputs/Toggle.svelte";
import BladeDrawing from "./BladeDrawing.svelte";
import { type BladeStage, bladeAssembly, hullJoint } from "./blade-assembly";

let { label = "Blade assembly stage" }: { label?: string } = $props();
let stage = $state<BladeStage>("Root");
let view = $state("Top");
const models = $derived([
	{
		title: "One blade / copied side becomes a solid",
		pair: false,
		faces: bladeAssembly(stage),
	},
	{
		title: "Mirrored pair / an open catamaran stance",
		pair: true,
		faces: [
			...(stage === "Root" ? hullJoint() : []),
			...bladeAssembly(stage, false, -12),
			...bladeAssembly(stage, true, 12),
		],
	},
]);
</script>

<div class="controls">
	<div>
		<span>Construction</span>
		<Toggle {label} options={["Faces", "Wall", "Root"]} bind:value={stage} />
	</div>
	<div>
		<span>View</span>
		<Toggle
			label="Blade assembly view"
			options={["Top", "Angled"]}
			bind:value={view}
		/>
	</div>
</div>
<p class="stage-note" aria-live="polite">
	{stage === "Faces"
		? "Faces · Only the original nose and long-side polygons. Their inner and outer contours are unchanged."
		: stage === "Wall"
			? "Wall · A sloping return follows the cut edge down and inward, giving each blade thickness. The original contour becomes a visible crease."
			: "Root · A triangular upper surface joins the rear inner edge to a broader root. The copied faces remain intact; the pale hull section shows where the pair could attach."}
</p>
<div class="comparison">
	{#each models as model}
		<figure>
			<figcaption>{model.title}</figcaption>
			<BladeDrawing
				faces={model.faces}
				{view}
				pair={model.pair}
				cut={model.pair && stage === "Root"}
				label={`${model.pair ? "Paired blades" : "Single blade"}, ${stage.toLowerCase()} stage, ${view.toLowerCase()} view`}
			/>
			<p>
				{#if model.pair}
					The same blade is mirrored with the light still coming from the ship’s
					left.
					{#if stage === "Root"}
						The gap remains open ahead of the roots. The faded aft section shows
						a possible attachment, with its rear edge cut off.
					{:else}
						The two parts remain separate at this stage.
					{/if}
				{:else}
					The bright original polygons still have their cockpit-shaped inner
					edge.
					{#if stage === "Faces"}
						These exposed faces alone do not define a solid.
					{:else if stage === "Wall"}
						A return wall meets that edge and closes the blade underneath.
					{:else}
						New material meets that edge as a return wall and a local root
						surface.
					{/if}
				{/if}
			</p>
		</figure>
	{/each}
</div>
<p class="caption">
	The two views are enlarged independently. Thickness, root dimensions and blade
	spacing are study choices. This is a component assembly; the cockpit body,
	four stabilizers, equipment layout and complete heavy hull are still to
	follow.
</p>

<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-lg) var(--spacing-xl);
	margin-block: var(--spacing-lg);
}
.controls > div {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--spacing-sm);
}
.controls span,
.caption {
	color: var(--color-text-muted);
	font-size: var(--font-size-caption);
}
.stage-note {
	max-width: var(--measure-prose);
	min-height: 4.5em;
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
	min-height: 5em;
	border-top: 1px solid var(--color-border);
	padding-top: var(--spacing-md);
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
	figcaption {
		min-height: 6em;
		font-size: var(--font-size-caption);
	}
	figure p {
		font-size: var(--font-size-caption);
	}
}
</style>
