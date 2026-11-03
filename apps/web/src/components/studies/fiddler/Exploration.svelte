<script lang="ts">
import { BUILD_FLIGHT_SCALE, CHASSIS } from "@void-drift/mode-a";
import Toggle from "../../inputs/Toggle.svelte";
import Drawing from "./Drawing.svelte";
import { variants } from "./geometry";

let { label = "Fiddler drawing layer" }: { label?: string } = $props();
let view = $state("Hull");
</script>

<div class="controls">
	<Toggle {label} options={["Hull", "Mounts", "Fitted"]} bind:value={view} />
	<p class="caption">All three at 2.35× · nose up · light from upper left</p>
</div>
<div class="concepts">
	{#each variants as variant}
		<article>
			<p class="eyebrow">02.1 / {variant.id}</p>
			<h4>{variant.name}</h4>
			<Drawing
				ship={variant.id}
				{view}
				label={`Fiddler ${variant.id}, ${variant.name}, ${view.toLowerCase()} study`}
			/>
			<p class="character">{variant.character}</p>
			<p>{variant.reason}</p>
			<p class="tension">{variant.tension}</p>
		</article>
	{/each}
</div>
<p class="caption layer-note" aria-live="polite">
	{#if view === "Hull"}
		Bare hulls. Four recessed stabilizers per ship: a pair near the bows, a pair
		near the stern. The shoulder fins are thin; the blades and bridge have
		height.
	{:else if view === "Mounts"}
		Ten proposed mounts: Q = equipment (six), + = universal (two), E = engines
		(two). Each forward blade carries two Q mounts. Footprints use the shared
		slot dimensions; compatibility and clearances remain provisional.
	{:else}
		Crowding fixture: two Heavy ion engines, six solar units and two Potential
		Wells, drawn from current game artwork. This tests visual occupancy, not a
		recommended or flight-tested loadout.
	{/if}
</p>

<h3>One scale, one family</h3>
<p class="measure">
	Wasp and the current Corvette use their production drawings. The same 2×
	enlargement exposes the extra span and open space of Fiddler. Each small
	drawing below is at the game’s 0.65× flight scale, without camera zoom.
</p>
<div class="fleet">
	{#each [
		{
			id: "wasp" as const,
			name: "Wasp",
			mass: `${CHASSIS.wasp.mass} hull mass`,
		},
		{
			id: "corvette" as const,
			name: "Corvette",
			mass: `${CHASSIS.corvette.mass} hull mass`,
		},
		...variants.map((v) => ({
			id: v.id,
			name: `Fiddler ${v.id}`,
			mass: "180–210 proposed",
		})),
	] as item}
		<figure>
			<figcaption>
				<strong>{item.name}</strong><span>{item.mass}</span>
			</figcaption>
			<Drawing
				ship={item.id}
				scale={2}
				width={205}
				height={270}
				label={`${item.name} bare hull at common 2× scale`}
			/>
			<Drawing
				ship={item.id}
				scale={BUILD_FLIGHT_SCALE}
				width={130}
				height={95}
				label={`${item.name} bare hull at 0.65× flight scale`}
			/>
		</figure>
	{/each}
</div>

<style>
.controls {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: var(--spacing-md);
	margin-block: var(--spacing-lg);
}
.concepts {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: var(--spacing-lg);
}
article {
	border-top: 1px solid var(--color-border);
	padding-top: var(--spacing-md);
}
.eyebrow,
.caption,
figcaption span {
	font: var(--font-size-caption) / var(--line-height-ui) var(--font-family-ui);
	color: var(--color-text-muted);
}
.eyebrow {
	letter-spacing: var(--tracking-eyebrow);
}
h4 {
	margin-block: var(--spacing-sm);
	font-size: var(--font-size-lead);
}
article p {
	font-size: var(--font-size-body);
	margin-block: var(--spacing-md);
}
.character {
	font-weight: var(--font-weight-bold);
}
.tension {
	color: var(--color-text-muted);
}
.layer-note {
	min-height: 3em;
	margin-block: var(--spacing-lg);
	max-width: var(--measure-prose);
}
.measure {
	max-width: var(--measure-prose);
}
.fleet {
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	margin-block: var(--spacing-lg);
	border-top: 1px solid var(--color-border);
}
figure {
	margin: 0;
	padding-block: var(--spacing-md);
}
figcaption {
	text-align: center;
}
figcaption span {
	display: block;
	margin-top: var(--spacing-sm);
}
@media (max-width: 800px) {
	.concepts {
		grid-template-columns: 1fr;
	}
	.fleet {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
@media (max-width: 440px) {
	.fleet {
		grid-template-columns: 1fr;
	}
}
</style>
