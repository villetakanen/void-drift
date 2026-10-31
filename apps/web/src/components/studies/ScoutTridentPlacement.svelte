<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import { buildMounts, defaultBuilds } from "@void-drift/mode-a";
import { FIGHTER } from "../../../../../packages/mode-a/src/lib/fighter";
import {
	TRIDENT_STUDY as reference,
	TRIDENT_ACCEPTED_PLACEMENT,
} from "./scout-trident-reference";

let { title = "Integrated trident placement" }: { title?: string } = $props();

const initial = () => ({
	deck: Number(reference.deck),
	aft: Number(reference.aft),
	side: Number(reference.side),
	arm: Number(reference.arm),
	angle: Number(reference.angle),
	deckX: 0,
	aftX: 0,
});
let placement = $state({ ...TRIDENT_ACCEPTED_PLACEMENT });
let selected = $state<"side" | "hull" | "aft">("side");
let guides = $state(true);
let footprints = $state(true);
const dimensions = buildMounts(defaultBuilds().scout);
const mounts = $derived(
	dimensions.map((m) => ({
		...m,
		across:
			m.group === "side"
				? m.index === 0
					? -placement.arm
					: placement.arm
				: m.group === "hull"
					? placement.deckX
					: placement.aftX,
		aft:
			m.group === "side"
				? placement.side
				: m.group === "hull"
					? placement.deck
					: placement.aft,
		rotation:
			m.group === "side"
				? m.index === 0
					? placement.angle
					: -placement.angle
				: 0,
		short:
			m.group === "side"
				? m.index === 0
					? "Left E"
					: "Right E"
				: m.group === "hull"
					? "H"
					: "A",
	})),
);
const coordinates = $derived(
	JSON.stringify(
		{
			reference: "02.5 / 06 Integrated trident",
			coordinates: "across right; aft down; degrees clockwise from bow",
			mounts: mounts.map((m) => ({
				mount: m.short,
				across: m.across,
				aft: m.aft,
				angle: m.rotation,
			})),
		},
		null,
		2,
	),
);
</script>

<div class="workbench">
	<div class="drawing">
		<svg
			viewBox="-35 -34 70 85"
			role="img"
			aria-label="Accepted Integrated trident hull with adjustable four-slot layout, nose up. Use the controls to select mounts and change their positions."
		>
			<title>{title}</title>
			{#each reference.planes as [points, color]}
				<polygon {points} fill={FIGHTER.facets[color]} />
			{/each}
			<circle cx="0" cy={reference.cockpit} r="6.8" fill={FIGHTER.facets[2]} />
			<circle cx="0" cy={reference.cockpit} r="6" fill="#000000" />
			{#each mounts as m}
				<g transform={`translate(${m.across} ${m.aft}) rotate(${m.rotation})`}>
					{#if guides && m.group !== "hull"}
						<path class="guide" d={`M0 ${m.width / 2} v20`} />
						<path
							class="nozzle"
							d={`M-3 ${m.width / 2} L-4 ${m.width / 2 + 3} H4 L3 ${m.width / 2}`}
						/>
					{/if}
					{#if footprints}
						<rect
							class:chosen={selected === m.group}
							x={-m.height / 2}
							y={-m.width / 2}
							width={m.height}
							height={m.width}
						/>
						<text text-anchor="middle" y="1">{m.short}</text>
					{/if}
				</g>
			{/each}
		</svg>
		<p>Bow ↑ · accepted hull fixed · top-view drawing units</p>
	</div>
	<div class="controls">
		<h4>Adjust placement</h4>
		<fieldset class="choices">
			<legend>Mount selection</legend>
			<button
				type="button"
				class="btn btn-ghost"
				aria-pressed={selected === "side"}
				onclick={() => (selected = "side")}
			>
				Side pair E
			</button>
			<button
				type="button"
				class="btn btn-ghost"
				aria-pressed={selected === "hull"}
				onclick={() => (selected = "hull")}
			>
				Deck H
			</button>
			<button
				type="button"
				class="btn btn-ghost"
				aria-pressed={selected === "aft"}
				onclick={() => (selected = "aft")}
			>
				Aft A
			</button>
		</fieldset>
		{#if selected === "side"}
			<p>
				The side pair stays mirrored. Positive angle points rearward guides
				outward.
			</p>
			<label
				>Fore–aft position <output>{placement.side}</output>
				<input
					aria-label="Side fore–aft position"
					type="range"
					min="-18"
					max="20"
					step="0.5"
					bind:value={placement.side}
				></label
			>
			<label
				>Distance from center <output>{placement.arm}</output>
				<input
					aria-label="Side distance from center"
					type="range"
					min="5"
					max="24"
					step="0.5"
					bind:value={placement.arm}
				></label
			>
			<label
				>Side angle <output>{placement.angle}°</output>
				<input
					aria-label="Side angle"
					type="range"
					min="0"
					max="70"
					step="1"
					bind:value={placement.angle}
				></label
			>
		{:else if selected === "hull"}
			<p>
				H accepts a gun or utility. The footprint does not include a gun barrel.
			</p>
			<label
				>Fore–aft position <output>{placement.deck}</output>
				<input
					aria-label="Deck fore–aft position"
					type="range"
					min="-25"
					max="16"
					step="0.5"
					bind:value={placement.deck}
				></label
			>
			<label
				>Across position <output>{placement.deckX}</output>
				<input
					aria-label="Deck across position"
					type="range"
					min="-12"
					max="12"
					step="0.5"
					bind:value={placement.deckX}
				></label
			>
		{:else}
			<p>
				A accepts an engine, gun or utility. Its engine axis stays straight aft.
			</p>
			<label
				>Fore–aft position <output>{placement.aft}</output>
				<input
					aria-label="Aft fore–aft position"
					type="range"
					min="-5"
					max="29"
					step="0.5"
					bind:value={placement.aft}
				></label
			>
			<label
				>Across position <output>{placement.aftX}</output>
				<input
					aria-label="Aft across position"
					type="range"
					min="-12"
					max="12"
					step="0.5"
					bind:value={placement.aftX}
				></label
			>
		{/if}
		<label class="check"
			><input type="checkbox" bind:checked={footprints}>
			Show footprints</label
		>
		<label class="check"
			><input type="checkbox" bind:checked={guides}>
			Show nozzle and rearward-axis guides</label
		>
		<button
			class="btn btn-ghost"
			type="button"
			onclick={() => (placement = initial())}
		>
			Reset to 02.5 / 06 placement
		</button>
		<button
			class="btn btn-ghost"
			type="button"
			onclick={() => {
				placement = { ...TRIDENT_ACCEPTED_PLACEMENT };
				selected = "side";
			}}
		>
			Load accepted screenshot layout
		</button>
		<p>
			Accepted screenshot layout: side settings are exact; H −1 and A 11.5
			remain reconstructed starting values. Reset preserves the original 02.5
			comparison.
		</p>
		<p>
			Negative fore–aft values move toward the bow. All footprints are 8 across
			× 10 fore–aft. Nozzle guides use the production three-unit rear extension.
			Guides are not plume widths or force calculations. Hull overhang and
			overlap are allowed for inspection.
		</p>
	</div>
</div>
<div class="coordinates">
	<table>
		<caption>
			Current placement · top-view coordinates, not production +x-forward
			coordinates
		</caption>
		<thead>
			<tr>
				<th>Mount</th>
				<th>Across</th>
				<th>Fore–aft</th>
				<th>Angle</th>
			</tr>
		</thead>
		<tbody>
			{#each mounts as m}
				<tr>
					<th>{m.short}</th>
					<td>{m.across}</td>
					<td>{m.aft}</td>
					<td>{m.rotation}°</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<details>
	<summary>Copy current coordinates for review</summary>
	<label
		>Placement JSON<textarea
			readonly
			value={coordinates}
			rows="12"
		></textarea></label
	>
	<p>
		Changes are temporary; copy these coordinates before reloading. Nothing is
		saved to a game build.
	</p>
</details>

<style>
.workbench {
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(260px, 1fr);
	gap: var(--spacing-lg);
}
.drawing {
	border: var(--flight-border);
	padding: var(--spacing-md);
}
svg {
	display: block;
	width: 100%;
	height: 580px;
}
.drawing p {
	color: var(--color-text-dim);
}
rect {
	fill: #071015;
	fill-opacity: 0.65;
	stroke: #e0ffff;
	stroke-width: 0.4;
}
rect.chosen {
	stroke: var(--color-acid-lime);
	stroke-width: 0.7;
}
text {
	fill: #e0ffff;
	font: 2.3px var(--font-flight);
}
.guide {
	fill: none;
	stroke: var(--color-neon-orange);
	stroke-width: 0.35;
	stroke-dasharray: 1 1;
}
.nozzle {
	fill: none;
	stroke: var(--color-neon-orange);
	stroke-width: 0.4;
}
.controls {
	min-width: 0;
}
h4 {
	margin-bottom: var(--spacing-md);
}
.choices {
	border: 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
	margin-bottom: var(--spacing-md);
}
input:focus-visible,
textarea:focus-visible,
summary:focus-visible {
	outline: 2px solid var(--color-acid-lime);
	outline-offset: 3px;
}
label {
	display: block;
	margin-block: var(--spacing-md);
}
output {
	float: right;
	font-family: var(--font-flight);
}
input[type="range"] {
	display: block;
	width: 100%;
	min-height: 44px;
	accent-color: var(--color-acid-lime);
}
.check {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	min-height: 44px;
}
input[type="checkbox"] {
	width: 20px;
	height: 20px;
	accent-color: var(--color-acid-lime);
}
.coordinates {
	overflow-x: auto;
	margin-block: var(--spacing-lg);
}
table {
	width: 100%;
	border-collapse: collapse;
}
caption {
	text-align: left;
	margin-bottom: var(--spacing-sm);
}
th,
td {
	text-align: left;
	padding: var(--spacing-sm);
	border-bottom: var(--flight-border);
}
summary {
	cursor: pointer;
	min-height: 44px;
}
textarea {
	display: block;
	width: 100%;
	box-sizing: border-box;
	background: var(--color-void);
	color: var(--color-text);
	font-family: var(--font-flight);
}
@media (max-width: 720px) {
	.workbench {
		grid-template-columns: 1fr;
	}
	svg {
		height: 420px;
	}
}
</style>
