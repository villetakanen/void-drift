<script lang="ts">
import { onMount } from "svelte";
import { DURATION as ESCAPE_SECONDS, INPUT_SEQUENCE } from "./movement-bench";
import {
	ESCAPE_HZ,
	escapeVariants,
	LIGHT_FORCE,
	simulateEscapeSequence,
} from "./plasma-escape";

let { label = "Aft plasma escape comparison" }: { label?: string } = $props();
let strength = $state(2);
let applied = $state(2);
let runs = $state.raw(simulateEscapeSequence());
let pending: ReturnType<typeof setTimeout> | undefined;
let canvas: HTMLCanvasElement;
function apply() {
	clearTimeout(pending);
	runs = simulateEscapeSequence({ strength });
	applied = strength;
}
function schedule() {
	clearTimeout(pending);
	pending = setTimeout(apply, 80);
}
const charts = $derived([
	{
		field: "acceleration" as const,
		label: "Acceleration (units/s²)",
		min: 0,
		max: 2000,
	},
	{ field: "speed" as const, label: "Speed (units/s)", min: 0, max: 480 },
	{
		field: "distance" as const,
		label: "Traversed path length (units)",
		min: 0,
		max: 7000,
	},
]);
function points(
	index: number,
	field: "acceleration" | "speed" | "distance",
	min: number,
	max: number,
) {
	return runs[index].samples
		.filter((_, tick) => tick % 4 === 0)
		.map((sample, frame) => {
			const value = sample[field];
			return `${52 + (frame / (ESCAPE_SECONDS * 60)) * 580},${166 - ((value - min) / (max - min)) * 140}`;
		})
		.join(" ");
}
function draw() {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	ctx.clearRect(0, 0, 900, 600);
	const all = runs.flatMap((run) => run.samples);
	const minX = Math.min(...all.map((p) => p.x)),
		maxX = Math.max(...all.map((p) => p.x));
	const minY = Math.min(...all.map((p) => p.y)),
		maxY = Math.max(...all.map((p) => p.y));
	const scale = Math.min(
		800 / Math.max(1, maxX - minX),
		500 / Math.max(1, maxY - minY),
	);
	const x = (v: number) => 50 + (v - minX) * scale,
		y = (v: number) => 50 + (v - minY) * scale;
	ctx.font = "14px monospace";
	runs.forEach((run, index) => {
		ctx.strokeStyle = escapeVariants[index].color;
		ctx.fillStyle = escapeVariants[index].color;
		ctx.lineWidth = 2;
		ctx.beginPath();
		run.samples.forEach((p, t) => {
			if (t === 0) ctx.moveTo(x(p.x), y(p.y));
			else if (t % 4 === 0) ctx.lineTo(x(p.x), y(p.y));
		});
		ctx.stroke();
		for (let second = 0; second <= ESCAPE_SECONDS; second++) {
			const p = run.samples[second * ESCAPE_HZ];
			ctx.beginPath();
			ctx.arc(x(p.x), y(p.y), 3, 0, 2 * Math.PI);
			ctx.fill();
			ctx.fillText(`${second}s`, x(p.x) + 5, y(p.y) - 5 - index * 12);
		}
	});
	ctx.fillStyle = "#888888";
	ctx.fillText(
		"Shared origin and scale · dots mark each second · view fits all paths",
		14,
		590,
	);
}
$effect(() => {
	void runs;
	draw();
});
onMount(() => {
	draw();
	return () => clearTimeout(pending);
});
</script>
<div class="escape">
	<label
		>Adjustable plasma force: {strength.toFixed(1)}× Light
		<input
			aria-label="Aft plasma force"
			type="range"
			min="1"
			max="10"
			step="0.1"
			bind:value={strength}
			oninput={schedule}
			onchange={apply}
		>
	</label>
	<p>
		Drawn: {applied.toFixed(1)}× Light ({Math.round(
			applied * LIGHT_FORCE,
		).toLocaleString()}
		force units). All ships start at rest, facing right. Stabilizers on; no
		animation.
	</p>
	<ul>
		{#each escapeVariants as variant}
			<li style:color={variant.color}>{variant.label}</li>
		{/each}
	</ul>
	<h4>Four paths · same 14-second flight sequence</h4>
	<div class="timeline">
		{#each INPUT_SEQUENCE as input, second}
			<span>{second}–{second + 1}s<br><strong>{input}</strong></span>
		{/each}
	</div>
	<p>
		L / R fire a side engine; LR also fires the aft engine; – releases both.
		Plasma charges again after each release.
	</p>
	<canvas
		bind:this={canvas}
		width="900"
		height="600"
		aria-label="Four complete flight paths with one-second markers"
	></canvas>
	<div class="graphs">
		{#each charts as chart}
			<div>
				<h4>{chart.label}</h4>
				<svg
					viewBox="0 0 660 195"
					role="img"
					aria-label={`${label}: ${chart.label}`}
				>
					{#each [0, 2, 4, 6, 8, 10, 12, 14] as second}
						<line
							x1={52 + (second / ESCAPE_SECONDS) * 580}
							x2={52 + (second / ESCAPE_SECONDS) * 580}
							y1="26"
							y2="166"
							class="grid"
						/>
						<text
							x={52 + (second / ESCAPE_SECONDS) * 580}
							y="188"
							text-anchor="middle"
						>
							{second}s
						</text>
					{/each}
					<text x="2" y="28">{chart.max}</text>
					<text x="2" y="166">{chart.min}</text>
					{#if chart.min < 0}
						<line
							x1="52"
							x2="632"
							y1={166 + (chart.min / (chart.max - chart.min)) * 140}
							y2={166 + (chart.min / (chart.max - chart.min)) * 140}
							class="grid"
						/>
					{/if}
					{#each escapeVariants as variant, index}
						<polyline
							points={points(index, chart.field, chart.min, chart.max)}
							fill="none"
							stroke={variant.color}
							stroke-width="2"
						/>
					{/each}
				</svg>
			</div>
		{/each}
	</div>
	<div class="table">
		<table>
			<caption>
				Speed / extra traversed distance versus Light aft (not spatial
				separation)
			</caption>
			<thead>
				<tr>
					<th>Aft engine</th>
					<th>Mass</th>
					<th>Force × Light</th>
					{#each [2, 6, 14] as second}
						<th>{second} s</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each escapeVariants as variant, index}
					<tr>
						<th style:color={variant.color}>{variant.label}</th>
						<td>{runs[index].mass}</td>
						<td>{runs[index].strength.toFixed(2)}</td>
						{#each [2, 6, 14] as second}
							<td>
								{runs[index].samples[second * ESCAPE_HZ].speed.toFixed(1)}
								u/s /
								{(
									runs[index].samples[second * ESCAPE_HZ].distance -
									runs[0].samples[second * ESCAPE_HZ].distance
								).toFixed(1)}
								u
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
<style>
.timeline {
	display: grid;
	grid-template-columns: repeat(14, minmax(45px, 1fr));
	overflow-x: auto;
	gap: 4px;
}
.timeline span {
	text-align: center;
	font-size: 11px;
	padding: 6px 0;
	background: var(--color-bg-panel);
}
.escape {
	border: 1px solid var(--color-text-dim);
	padding: var(--spacing-md);
}
label {
	display: grid;
	gap: var(--spacing-sm);
}
input {
	width: 100%;
	min-height: 44px;
	accent-color: var(--color-acid-lime);
}
p {
	line-height: 1.65;
}
ul {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-md);
	list-style: none;
	padding: 0;
}
.graphs {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--spacing-md);
}
h4 {
	margin: 0;
}
svg,
canvas {
	width: 100%;
	display: block;
}
svg text {
	fill: var(--color-text-dim);
	font-size: 12px;
}
.grid {
	stroke: var(--color-text-dim);
	opacity: 0.25;
}
canvas {
	margin-block: var(--spacing-md);
}
.table {
	overflow-x: auto;
}
table {
	width: 100%;
	border-collapse: collapse;
	font-variant-numeric: tabular-nums;
}
caption {
	text-align: left;
}
th,
td {
	text-align: left;
	padding: var(--spacing-sm);
}
@media (max-width: 650px) {
	.graphs {
		grid-template-columns: 1fr;
	}
}
</style>
