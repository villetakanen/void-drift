<script lang="ts">
import {
	forceComposition,
	forceConfigurations,
	forwardAcceleration,
	LIGHT_FORCE,
	REFERENCE_MASS,
} from "./force-composition";

let { label = "Force composition" }: { label?: string } = $props();
let fitted = $state(false);
let ready = $state(true);
let speed = $state(300);
const rows = $derived(
	forceConfigurations.map((_, index) => forceComposition(index, fitted, ready)),
);
const maxAcceleration = 700;
function points(row: ReturnType<typeof forceComposition>) {
	return Array.from({ length: 101 }, (_, i) => {
		const v = i * 5;
		const a = forwardAcceleration(row.force, row.mass, row.ceiling, v);
		return `${45 + (v / 500) * 480},${180 - (a / maxAcceleration) * 155}`;
	}).join(" ");
}
</script>
<div class="bench">
	<div class="controls">
		<label
			><input type="checkbox" bind:checked={fitted}>
			Use fitted mass (otherwise every row is {REFERENCE_MASS})</label
		>
		<label
			><input type="checkbox" bind:checked={ready}>
			Plasma charged and producing force</label
		>
		<label
			>Inspect speed: {speed} units/s
			<input
				aria-label="Force bench speed"
				type="range"
				min="0"
				max="500"
				step="5"
				bind:value={speed}
			></label
		>
	</div>
	<p>
		Each row uses the same axes: speed 0–500 horizontally; forward acceleration
		0–700 vertically. The dashed line marks that row’s provisional speed
		ceiling. The white dot shows the selected speed.
	</p>
	{#each rows as row}
		<article>
			<h4 style:color={row.color}>{row.label}</h4>
			<div
				class="forcebar"
				role="img"
				aria-label={`Combined forward force: ${row.force.toLocaleString()} force units`}
			>
				{#each row.contributions as contribution}
					<span
						style:width={`${(contribution.force / (3 * LIGHT_FORCE)) * 100}%`}
						style:background={row.color}
						>{contribution.id === "heavy-ion"
							? "Heavy"
							: contribution.id === "plasma"
								? "Plasma"
								: "Light"}</span
					>
				{/each}
			</div>
			<p class="equation">
				({row.contributions.map((c) => c.force.toLocaleString()).join(" + ")})
				force ÷ {row.mass} mass =
				<strong>{row.acceleration.toFixed(1)} units/s² from rest</strong>
			</p>
			<dl>
				<div>
					<dt>At {speed} units/s</dt>
					<dd>
						{forwardAcceleration(
							row.force,
							row.mass,
							row.ceiling,
							speed,
						).toFixed(1)}
						units/s²
					</dd>
				</div>
				<div>
					<dt>Provisional ceiling</dt>
					<dd>{row.ceiling.toFixed(1)} units/s</dd>
				</div>
				<div>
					<dt>Mass used</dt>
					<dd>{row.mass} {fitted ? "fitted" : "fixed"}</dd>
				</div>
			</dl>
			<svg
				viewBox="0 0 550 215"
				role="img"
				aria-label={`${label}: ${row.label}, acceleration versus speed`}
			>
				{#each [0, 100, 200, 300, 400, 500] as v}
					<line
						class="grid"
						x1={45 + (v / 500) * 480}
						x2={45 + (v / 500) * 480}
						y1="25"
						y2="180"
					/>
					<text x={45 + (v / 500) * 480} y="202" text-anchor="middle">{v}</text>
				{/each}
				{#each [0, 350, 700] as a}
					<text x="2" y={184 - (a / 700) * 155}>{a}</text>
					<line
						class="grid"
						x1="45"
						x2="525"
						y1={180 - (a / 700) * 155}
						y2={180 - (a / 700) * 155}
					/>
				{/each}
				<line
					x1={45 + (row.ceiling / 500) * 480}
					x2={45 + (row.ceiling / 500) * 480}
					y1="25"
					y2="180"
					stroke={row.color}
					stroke-dasharray="5 5"
					opacity="0.6"
				/>
				<polyline
					points={points(row)}
					fill="none"
					stroke={row.color}
					stroke-width="2.5"
				/>
				<circle
					cx={45 + (speed / 500) * 480}
					cy={180 -
						(forwardAcceleration(row.force, row.mass, row.ceiling, speed) /
							700) *
							155}
					r="4"
					fill="white"
				/>
			</svg>
		</article>
	{/each}
	<p>
		Force bars share a 75,900-unit scale. During plasma charging, its force is
		zero but its mass remains aboard. Above the current ceiling, forward thrust
		adds no speed; it does not automatically brake existing momentum.
	</p>
</div>
<style>
.bench {
	border: 1px solid var(--color-text-dim);
	padding: var(--spacing-md);
}
.controls {
	display: grid;
	gap: var(--spacing-md);
}
label {
	display: block;
	line-height: 1.6;
}
input[type="range"] {
	width: 100%;
	min-height: 44px;
	accent-color: var(--color-acid-lime);
}
input[type="checkbox"] {
	width: 20px;
	height: 20px;
	vertical-align: middle;
}
article {
	border-top: 1px solid var(--color-text-dim);
	margin-top: var(--spacing-lg);
	padding-top: var(--spacing-md);
}
h4 {
	margin: 0 0 var(--spacing-sm);
}
p {
	line-height: 1.65;
}
.forcebar {
	display: flex;
	width: 100%;
	height: 26px;
	background: #191923;
	gap: 2px;
}
.forcebar span {
	overflow: hidden;
	color: #080810;
	text-align: center;
	font-size: 12px;
	line-height: 26px;
}
.equation {
	font-variant-numeric: tabular-nums;
}
dl {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-md);
	font-size: 13px;
}
dt {
	color: var(--color-text-dim);
}
dd {
	margin: 4px 0;
}
svg {
	display: block;
	width: 100%;
}
svg text {
	fill: var(--color-text-dim);
	font-size: 11px;
}
.grid {
	stroke: var(--color-text-dim);
	opacity: 0.2;
}
</style>
