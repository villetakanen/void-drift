<script lang="ts">
import { onMount, untrack } from "svelte";
import { ceilingVariants, simulateCeilings } from "./ceiling-rules-reference";
import {
	BenchSettings,
	DT,
	DURATION,
	INPUT_SEQUENCE,
	variants as originalVariants,
	sequence,
	simulateBench,
	TOTAL_TICKS,
} from "./movement-bench";
import "@void-drift/core/styles/buttons.css";

let {
	label = "Movement test bench",
	comparison = false,
}: { label?: string; comparison?: boolean } = $props();
// Each study section fixes its comparison mode for this component instance.
const ceilingMode = untrack(() => comparison);
const variants = ceilingMode ? ceilingVariants : originalVariants;
const simulate = ceilingMode ? simulateCeilings : simulateBench;
let acceleration = $state(ceilingMode ? 400 : 100);
let maxSpeed = $state(ceilingMode ? 300 : 500);
let data = $state(
	simulate({
		acceleration: ceilingMode ? 400 : 100,
		maxSpeed: ceilingMode ? 300 : 500,
	}),
);
let tick = $state(0);
let playing = $state(false);
let error = $state("");
let canvas: HTMLCanvasElement;
const time = $derived(tick * DT);
const input = $derived(sequence(Math.min(tick, TOTAL_TICKS - 1)));
const speedPeak = $derived(
	Math.max(
		1,
		...data.flatMap((path) =>
			path.map((p) => Math.max(p.speed, p.ceiling ?? 0)),
		),
	),
);
const distancePeak = $derived(
	Math.max(1, ...data.map((path) => path[TOTAL_TICKS].distance)),
);
function graph(
	index: number,
	field: "speed" | "distance" | "ceiling",
	peak: number,
) {
	return data[index]
		.slice(0, tick + 1)
		.map(
			(p, i) =>
				`${40 + (i / TOTAL_TICKS) * 600},${160 - ((p[field] ?? 0) / peak) * 140}`,
		)
		.join(" ");
}
function seek(value: number) {
	playing = false;
	tick = Math.max(0, Math.min(TOTAL_TICKS, value));
}
function restart() {
	tick = 0;
	playing = true;
}
function apply() {
	const parsed = BenchSettings.safeParse({ acceleration, maxSpeed });
	if (!parsed.success) {
		error = "Use acceleration 1–2000 and max speed 10–3000.";
		return;
	}
	error = "";
	data = simulate(parsed.data);
	restart();
}
function draw() {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	const width = 1000,
		height = 440;
	ctx.clearRect(0, 0, width, height);
	const points = data.flat();
	const minX = Math.min(0, ...points.map((p) => p.x)),
		maxX = Math.max(1, ...points.map((p) => p.x));
	const minY = Math.min(0, ...points.map((p) => p.y)),
		maxY = Math.max(1, ...points.map((p) => p.y));
	const scale = Math.min(880 / (maxX - minX), 320 / (maxY - minY));
	const ox = 60 + (880 - (maxX - minX) * scale) / 2 - minX * scale;
	const oy = 60 + (320 - (maxY - minY) * scale) / 2 - minY * scale;
	ctx.strokeStyle = "#272a38";
	ctx.lineWidth = 1;
	const grid = 10 ** Math.floor(Math.log10(100 / scale));
	for (let x = Math.floor(minX / grid) * grid; x <= maxX; x += grid) {
		ctx.beginPath();
		ctx.moveTo(ox + x * scale, 35);
		ctx.lineTo(ox + x * scale, 405);
		ctx.stroke();
	}
	for (let y = Math.floor(minY / grid) * grid; y <= maxY; y += grid) {
		ctx.beginPath();
		ctx.moveTo(35, oy + y * scale);
		ctx.lineTo(965, oy + y * scale);
		ctx.stroke();
	}
	ctx.fillStyle = "#b4b9c6";
	ctx.font = "14px monospace";
	ctx.fillText(
		`Grid: ${grid} units · fixed framing for this run · all start at origin →`,
		25,
		425,
	);
	variants.forEach((variant, index) => {
		const path = data[index];
		ctx.strokeStyle = variant.color;
		ctx.lineWidth = 2;
		ctx.setLineDash(index === 3 ? [8, 6] : []);
		ctx.beginPath();
		for (let i = 0; i <= tick; i++) {
			const p = path[i];
			if (i === 0) ctx.moveTo(ox + p.x * scale, oy + p.y * scale);
			else ctx.lineTo(ox + p.x * scale, oy + p.y * scale);
		}
		ctx.stroke();
		ctx.setLineDash([]);
		const p = path[tick];
		ctx.save();
		ctx.translate(ox + p.x * scale, oy + p.y * scale);
		ctx.rotate(p.heading);
		ctx.beginPath();
		ctx.moveTo(10, 0);
		ctx.lineTo(-7, -6);
		ctx.lineTo(-7, 6);
		ctx.closePath();
		ctx.fillStyle = variant.color;
		ctx.fill();
		ctx.restore();
	});
}
$effect(() => {
	tick;
	data;
	draw();
});
onMount(() => {
	let last = performance.now(),
		elapsed = 0,
		frame = 0;
	const animate = (now: number) => {
		if (playing) {
			elapsed += Math.max(0, Math.min((now - last) / 1000, 0.1));
			const steps = Math.floor(elapsed / DT);
			if (steps > 0) {
				tick = Math.min(TOTAL_TICKS, tick + steps);
				elapsed -= steps * DT;
			}
			if (tick === TOTAL_TICKS) playing = false;
		} else elapsed = 0;
		last = now;
		frame = requestAnimationFrame(animate);
	};
	draw();
	frame = requestAnimationFrame(animate);
	return () => cancelAnimationFrame(frame);
});
</script>

<div class="bench">
	<form
		onsubmit={(event) => {
			event.preventDefault();
			apply();
		}}
	>
		<label
			>Acceleration per engine (units/s²)<input
				type="number"
				min="1"
				max="2000"
				step="1"
				bind:value={acceleration}
				required
			></label
		>
		<label
			>{comparison
				? "One-Light ceiling (units/s)"
				: "Max powered speed (units/s)"}<input
				type="number"
				min="10"
				max="3000"
				step="1"
				bind:value={maxSpeed}
				required
			></label
		>
		<button class="btn btn-ghost" type="submit">Apply & restart</button>
	</form>
	{#if error}
		<p role="alert">{error}</p>
	{/if}
	<ul class="legend">
		{#each variants as variant}
			<li><span style:background={variant.color}></span>{variant.label}</li>
		{/each}
	</ul>
	<div class="graphs">
		{#each [
			{ field: "speed" as const, label: "Speed (units/s)", peak: speedPeak },
			{
				field: "distance" as const,
				label: "Traversed length (units)",
				peak: distancePeak,
			},
		] as chart}
			<div>
				<h4>{chart.label}</h4>
				<svg
					viewBox="0 0 660 190"
					role="img"
					aria-label={`${chart.label} over ${DURATION} seconds`}
				>
					{#each Array.from(
						{ length: DURATION / 2 + 1 },
						(_, i) => i * 2,
					) as second}
						<line
							x1={40 + (second / DURATION) * 600}
							x2={40 + (second / DURATION) * 600}
							y1="20"
							y2="160"
							class="grid"
						/>
						<text
							x={40 + (second / DURATION) * 600}
							y="182"
							text-anchor="middle"
						>
							{second}s
						</text>
					{/each}
					<text x="3" y="20">{Math.round(chart.peak)}</text>
					<text x="14" y="160">0</text>
					{#each variants as variant, index}
						<polyline
							points={graph(index, chart.field, chart.peak)}
							fill="none"
							stroke={variant.color}
							stroke-width="2"
							stroke-dasharray={index === 3 ? "7 5" : undefined}
						/>

						{#if comparison && chart.field === "speed"}
							<polyline
								points={graph(index, "ceiling", chart.peak)}
								fill="none"
								stroke={variant.color}
								stroke-width="1.5"
								stroke-dasharray="5 5"
								opacity="0.7"
							/>
						{/if}
					{/each}
					<line
						x1={40 + (time / DURATION) * 600}
						x2={40 + (time / DURATION) * 600}
						y1="20"
						y2="160"
						stroke="white"
						opacity="0.6"
					/>
				</svg>
			</div>
		{/each}
	</div>
	<canvas
		bind:this={canvas}
		width="1000"
		height="440"
		aria-label={`${label}: four flight paths; numeric positions and distances below`}
	></canvas>
	<div class="transport">
		<button type="button" class="btn btn-ghost" onclick={() => seek(0)}>
			Rewind
		</button>
		<button
			type="button"
			class="btn btn-filled"
			onclick={() => {
				if (tick === TOTAL_TICKS) tick = 0;
				playing = !playing;
			}}
		>
			{playing ? "Pause" : "Play"}
		</button>
		<button type="button" class="btn btn-ghost" onclick={() => seek(tick - 1)}>
			−1 frame
		</button>
		<button type="button" class="btn btn-ghost" onclick={() => seek(tick + 1)}>
			+1 frame
		</button>
		<button type="button" class="btn btn-ghost" onclick={restart}>
			Replay
		</button>
		<output
			>{time.toFixed(2)}
			/ {DURATION.toFixed(2)} s ·
			{tick === TOTAL_TICKS
				? "End"
				: input.left && input.right
					? "L + R"
					: input.left
						? "L"
						: input.right
							? "R"
							: "No thrust"}</output
		>
	</div>
	<label class="scrub"
		>Timeline<input
			aria-label="Timeline"
			type="range"
			min="0"
			max={TOTAL_TICKS}
			step="1"
			value={tick}
			oninput={(event) => seek(Number(event.currentTarget.value))}
		></label
	>
	<div class="phases">
		{#each INPUT_SEQUENCE as phase, index}
			<button type="button" onclick={() => seek(index * 60)}>
				{index}–{index + 1}s · {phase}
			</button>
		{/each}
	</div>
	<div class="readouts">
		<table>
			<thead>
				<tr>
					<th>Ship</th>
					<th>Speed</th>
					{#if comparison}
						<th>Ceiling</th>
					{/if}
					<th>Length</th>
					<th>X</th>
					<th>Y</th>
				</tr>
			</thead>
			<tbody>
				{#each variants as variant, index}
					<tr>
						<th style:color={variant.color}>{variant.label}</th>
						<td>{data[index][tick].speed.toFixed(1)}</td>
						{#if comparison}
							<td>{data[index][tick].ceiling?.toFixed(1)}</td>
						{/if}
						<td>{data[index][tick].distance.toFixed(1)}</td>
						<td>{data[index][tick].x.toFixed(1)}</td>
						<td>{data[index][tick].y.toFixed(1)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
<style>
.bench {
	border: 1px solid var(--color-text-dim);
	padding: var(--spacing-md);
}
form,
.transport,
.legend {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-md);
	align-items: end;
}
label {
	display: grid;
	gap: var(--spacing-sm);
}
input {
	padding: var(--spacing-sm);
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
}
.legend {
	list-style: none;
	padding: 0;
	margin-block: var(--spacing-md);
}
.legend li {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}
.legend span {
	width: 14px;
	height: 3px;
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
canvas {
	background: var(--color-void);
	margin-block: var(--spacing-md);
}
svg text {
	fill: var(--color-text-dim);
	font-size: 12px;
}
.grid {
	stroke: var(--color-text-dim);
	opacity: 0.2;
}
.scrub {
	margin-block: var(--spacing-md);
}
.scrub input {
	width: 100%;
	min-height: 44px;
}
.phases {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
}
.phases button {
	padding: var(--spacing-sm);
	min-height: 44px;
	color: var(--color-text);
	background: var(--color-void);
	border: 1px solid var(--color-text-dim);
	cursor: pointer;
}
.readouts {
	overflow-x: auto;
}
table {
	width: 100%;
	margin-top: var(--spacing-md);
	border-collapse: collapse;
	font-variant-numeric: tabular-nums;
}
th,
td {
	padding: var(--spacing-sm);
	text-align: right;
}
th:first-child {
	text-align: left;
}
@media (max-width: 650px) {
	.graphs {
		grid-template-columns: 1fr;
	}
	form label {
		width: 100%;
	}
}
</style>
