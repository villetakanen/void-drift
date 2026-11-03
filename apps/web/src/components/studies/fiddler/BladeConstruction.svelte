<script lang="ts">
import { FIGHTER, WASP } from "@void-drift/mode-a";
import Toggle from "../../inputs/Toggle.svelte";

type Point = readonly [number, number, number];
let { label = "Blade construction view" }: { label?: string } = $props();
let view = $state("Top");

// Use the production nose's outline and colours. Its first two faces meet the
// front of the glass nine units behind the tip; isolate that closed nose section.
const nose = WASP.facets.slice(0, 2);
const source = nose.flatMap((face) =>
	face.points.map(
		([forward, across]) => [across, WASP.length - forward] as const,
	),
);
const frontWidth = Math.max(
	...source.filter(([, y]) => y === 0).map(([x]) => Math.abs(x)),
);
const backY = Math.max(...source.map(([, y]) => y));
const backWidth = Math.max(...source.map(([x]) => Math.abs(x)));
const taper = (backWidth - frontWidth) / backY;
const noseLength = Math.min(
	...source.filter(([x, y]) => x === 0 && y > 0).map(([, y]) => y),
);
const bladeLength = 40;
const halfWidth = (y: number) => frontWidth + taper * y;
// A shared illustrative rise, not a recovered Wasp height. This construction
// keeps both faces planar: z = 0.6 * (halfWidth(y) ± x) for nose and extension.
const ridgeHeight = (y: number) => halfWidth(y) * 0.6;
function faces(length: number) {
	const w = halfWidth(length);
	const h = ridgeHeight(length);
	return [
		{
			color: nose[0].color,
			points: [
				[-frontWidth, 0, 0],
				[0, 0, ridgeHeight(0)],
				[0, length, h],
				[-w, length, 0],
			] as Point[],
		},
		{
			color: nose[1].color,
			points: [
				[0, 0, ridgeHeight(0)],
				[frontWidth, 0, 0],
				[w, length, 0],
				[0, length, h],
			] as Point[],
		},
		{
			color: FIGHTER.facets[3],
			points: [
				[-w, length, 0],
				[0, length, h],
				[w, length, 0],
			] as Point[],
		},
	];
}
function project([x, y, z]: Point): readonly [number, number] {
	if (view === "Top") return [x, y];
	const centred = y - 20;
	return [
		x * 0.866 + centred * 0.5,
		(centred * 0.866 - x * 0.5) * 0.62 - z * 0.785 + 24,
	];
}
const points = (list: readonly Point[]) =>
	list.map((point) => project(point).join(",")).join(" ");
const cut: Point[] = [
	[-halfWidth(noseLength), noseLength, 0],
	[0, noseLength, ridgeHeight(noseLength)],
	[halfWidth(noseLength), noseLength, 0],
];
const sectionWidth = halfWidth(noseLength) * 16;
const sectionRise = ridgeHeight(noseLength) * 16;
</script>

<div class="reference-key">
	<svg
		viewBox="-23 -29 46 58"
		role="img"
		aria-label="Production Wasp with the nose faces highlighted"
	>
		{#each WASP.facets as face, i}
			<polygon
				points={face.points.map(([x, y]) => `${y},${-x}`).join(" ")}
				fill={face.color}
				opacity={i < 2 || face.color === "#000000" ? 1 : 0.3}
			/>
		{/each}
	</svg>
	<p>
		<strong>The source: Wasp 06.9.</strong>
		Its two nose faces are highlighted here. The piece below stops at the front
		of the glass, where the ridge is still continuous.
	</p>
</div>

<div class="controls">
	<Toggle {label} options={["Top", "Angled"]} bind:value={view} />
	<p class="caption" aria-live="polite">
		{view === "Top"
			? "Top view · original nose outline and colours · same drawing scale"
			: "Angled view · one shared, illustrative depth · same faces and colours"}
	</p>
</div>

<div class="comparison">
	{#each [
		{ name: "Wasp / nose before the glass", length: noseLength },
		{ name: "Blade / the same two planes continued", length: bladeLength },
	] as part, index}
		<figure>
			<figcaption>{part.name}</figcaption>
			<svg
				class="form"
				viewBox="-22 -8 44 62"
				role="img"
				aria-label={`${part.name}, ${view.toLowerCase()} view`}
			>
				{#if index === 0 && view === "Top"}
					{#each WASP.facets as face}
						<polygon
							points={face.points
								.map(([x, y]) => `${y},${WASP.length - x}`)
								.join(" ")}
							fill={face.color}
							opacity="0.15"
						/>
					{/each}
				{/if}
				{#each faces(part.length) as face, i}
					{#if i < 2 || view === "Angled"}
						<polygon points={points(face.points)} fill={face.color} />
					{/if}
				{/each}
				<polyline class="cut" points={points(cut)} />
				<text x={project(cut[2])[0] + 3} y={project(cut[2])[1] + 1}>S</text>
			</svg>
			<p>
				{index === 0
					? "The familiar nose is isolated from the body. S marks its section immediately ahead of the canopy."
					: "The ridge and both sloping faces continue through S without a seam or an extra upper deck. Continuing the taper also widens the blade toward its root."}
			</p>
		</figure>
	{/each}
</div>

<div class="section-reading">
	<figure>
		<figcaption>Section S / identical in both pieces</figcaption>
		<svg
			class="section"
			viewBox="0 0 300 170"
			role="img"
			aria-label="Shared triangular section: two sloping faces meet at one ridge, with no flat upper deck"
		>
			<path
				d={`M ${150 - sectionWidth},112 L 150,${112 - sectionRise} L ${150 + sectionWidth},112 Z`}
				fill={FIGHTER.facets[3]}
			/>
			<path
				d={`M ${150 - sectionWidth},112 L 150,${112 - sectionRise}`}
				stroke={nose[0].color}
				stroke-width="5"
				fill="none"
			/>
			<path
				d={`M 150,${112 - sectionRise} L ${150 + sectionWidth},112`}
				stroke={nose[1].color}
				stroke-width="5"
				fill="none"
			/>
			<text x="150" y="44" text-anchor="middle">ridge</text>
			<text x="65" y="145" text-anchor="middle">lit face</text>
			<text x="230" y="145" text-anchor="middle">turned-away face</text>
			<path class="light" d="M 35,35 L 84,78 M 73,75 L 84,78 L 80,67" />
		</svg>
	</figure>
	<div>
		<h4>One ridge, two continuous faces</h4>
		<p>
			The section makes the proposed construction explicit. The bright face
			turns toward the light; the other turns away. A longer face keeps its
			shade because its angle stays the same.
		</p>
		<p class="caption">
			The dashed S mark and this section are explanatory guides. The dark end in
			Angled view closes the cut for inspection; it is not a proposed blade
			root.
		</p>
	</div>
</div>

<style>
.reference-key {
	display: grid;
	grid-template-columns: 90px minmax(0, 1fr);
	gap: var(--spacing-lg);
	align-items: center;
	max-width: var(--measure-prose);
	margin-block: var(--spacing-lg);
}
.reference-key svg {
	width: 90px;
}
figure p,
.reference-key p,
.section-reading p {
	margin-block: var(--spacing-sm);
}
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-md) var(--spacing-lg);
	align-items: center;
	margin-block: var(--spacing-lg);
}
.caption {
	color: var(--color-text-muted);
	font-size: var(--font-size-caption);
	max-width: var(--measure-prose);
}
.comparison {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--spacing-xl);
}
figure {
	margin: 0;
	min-width: 0;
}
figcaption {
	font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
}
.comparison figcaption {
	min-height: 5em;
	border-top: 1px solid var(--color-border);
	padding-top: var(--spacing-md);
}
.form {
	width: 100%;
	height: auto;
	max-height: 360px;
	display: block;
}
svg text {
	fill: var(--color-text-muted);
	font-family: var(--font-family-ui);
}
.form text {
	font-size: 2.4px;
}
.cut {
	stroke: var(--color-text);
	stroke-width: 0.2;
	stroke-dasharray: 0.8 0.8;
	fill: none;
}
.section-reading {
	display: grid;
	grid-template-columns: minmax(240px, 1fr) minmax(0, 1.2fr);
	gap: var(--spacing-xl);
	align-items: center;
	border-top: 1px solid var(--color-border);
	margin-top: var(--spacing-xl);
	padding-top: var(--spacing-lg);
}
.section {
	display: block;
	width: 100%;
	max-width: 340px;
}
.section text {
	font-size: 11px;
}
.light {
	stroke: var(--color-text-muted);
	stroke-width: 1;
	fill: none;
}
h4 {
	margin-block: 0 var(--spacing-sm);
	font-size: var(--font-size-body);
}
@media (max-width: 600px) {
	.comparison {
		gap: var(--spacing-md);
	}
	.comparison figcaption {
		min-height: 6em;
		font-size: var(--font-size-caption);
	}
	.comparison p {
		font-size: var(--font-size-caption);
	}
	.section-reading {
		grid-template-columns: 1fr;
		gap: var(--spacing-md);
	}
}
</style>
