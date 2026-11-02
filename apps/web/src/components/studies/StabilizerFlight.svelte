<script lang="ts">
import { EnginePlume, Vec2 } from "@void-drift/core";
import {
	BUILD_FLIGHT_SCALE,
	buildPlumeEmitters,
	defaultLoadout,
	drawBuild,
	LoadoutSchema,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { DT, INPUT_SEQUENCE, TOTAL_TICKS } from "./movement-bench";
import { simulateRotation, stabilizerGeometry } from "./rotation-bench";
import { drawStabilizerSlits } from "./stabilizer-art";
import "@void-drift/core/styles/buttons.css";

let { label = "Fighter stabilizer flight replay" }: { label?: string } =
	$props();
const build = LoadoutSchema.parse({
	...defaultLoadout("fighter"),
	side: "heavy-ion",
	aft: ["heavy-ion", "heavy-ion"],
});
const geometry = stabilizerGeometry(77, 10, 37.7);
const samples = simulateRotation({
	acceleration: 220,
	maxSpeed: 340,
	bonus: 0.4,
	falloff: 0.8,
	maxTurn: 180,
	rotationMode: "free-stabilized",
	stabilizerBack: 77,
	stabilizerInset: 10,
	stabilizerAngle: 37.7,
	mainStrength: 1.75,
	stabilizerStrength: 0.22,
	brakeOnLR: true,
})[3];
const emitters = buildPlumeEmitters(build);
for (const side of [-1, 1]) {
	const angle = Math.atan2(-side * geometry.fy, geometry.fx);
	emitters.push({
		style: "ion-light",
		x: (geometry.x - Math.cos(angle)) * BUILD_FLIGHT_SCALE,
		y: (side * geometry.y - Math.sin(angle)) * BUILD_FLIGHT_SCALE,
		angle,
		output: 0,
	});
}
let canvas: HTMLCanvasElement;
let tick = $state(0),
	playing = $state(false);
let zoom = $state(2.4);
let plume = new EnginePlume();
function advance() {
	if (tick >= TOTAL_TICKS) {
		playing = false;
		return;
	}
	tick++;
	const s = samples[tick];
	plume.stepMounted(
		DT,
		{
			pos: new Vec2(s.x, s.y),
			vel: new Vec2(s.vx ?? 0, s.vy ?? 0),
			acc: new Vec2(0, 0),
			rotation: s.heading,
			radius: 1,
		},
		emitters.map((e, i) => ({ ...e, output: s.emissions?.[i] ?? 0 })),
	);
}
function seek(target: number) {
	playing = false;
	tick = 0;
	plume = new EnginePlume();
	while (tick < target) advance();
	draw();
}
function replay() {
	seek(0);
	playing = true;
}
function draw() {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	const s = samples[tick];
	ctx.clearRect(0, 0, 1000, 650);
	ctx.save();
	ctx.translate(500, 325);
	ctx.scale(zoom, zoom);
	ctx.translate(-s.x, -s.y);
	const reach = 600 / zoom;
	ctx.strokeStyle = "#202636";
	ctx.lineWidth = 1 / zoom;
	for (let x = Math.floor((s.x - reach) / 50) * 50; x < s.x + reach; x += 50) {
		ctx.beginPath();
		ctx.moveTo(x, s.y - reach);
		ctx.lineTo(x, s.y + reach);
		ctx.stroke();
	}
	for (let y = Math.floor((s.y - reach) / 50) * 50; y < s.y + reach; y += 50) {
		ctx.beginPath();
		ctx.moveTo(s.x - reach, y);
		ctx.lineTo(s.x + reach, y);
		ctx.stroke();
	}
	ctx.strokeStyle = "#40516a";
	ctx.beginPath();
	for (let i = Math.max(0, tick - 120); i <= tick; i++) {
		const p = samples[i];
		if (i === Math.max(0, tick - 120)) ctx.moveTo(p.x, p.y);
		else ctx.lineTo(p.x, p.y);
	}
	ctx.stroke();
	drawBuild(ctx, build, s.x, s.y, s.heading, BUILD_FLIGHT_SCALE);
	ctx.save();
	ctx.translate(s.x, s.y);
	ctx.rotate(s.heading);
	ctx.scale(BUILD_FLIGHT_SCALE, BUILD_FLIGHT_SCALE);
	drawStabilizerSlits(ctx, geometry);
	ctx.restore();
	plume.draw(ctx);
	ctx.restore();
}
$effect(() => {
	tick;
	zoom;
	draw();
});
onMount(() => {
	let last = performance.now(),
		carry = 0,
		frame = 0;
	const loop = (now: number) => {
		if (playing) {
			carry += Math.max(0, Math.min(0.1, (now - last) / 1000));
			while (carry >= DT && playing) {
				advance();
				carry -= DT;
			}
		} else carry = 0;
		last = now;
		draw();
		frame = requestAnimationFrame(loop);
	};
	frame = requestAnimationFrame(loop);
	return () => cancelAnimationFrame(frame);
});
</script>
<div class="flight" data-tick={tick}>
	<div class="controls">
		<button type="button" class="btn btn-ghost" onclick={() => seek(0)}>
			Rewind
		</button>
		<button
			type="button"
			class="btn btn-filled"
			onclick={() => {
				if (tick === TOTAL_TICKS) seek(0);
				playing = !playing;
			}}
		>
			{playing ? "Pause" : "Play"}
		</button>
		<button type="button" class="btn btn-ghost" onclick={replay}>Replay</button>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => seek(Math.max(0, tick - 1))}
		>
			−1 frame
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => seek(Math.min(TOTAL_TICKS, tick + 1))}
		>
			+1 frame
		</button>
		<label
			>View scale<select bind:value={zoom}>
				<option value={1}>Game scale · 1×</option>
				<option value={2.4}>Enlarged · 2.4×</option>
				<option value={4}>Detail · 4×</option>
			</select></label
		>
	</div>
	<canvas
		bind:this={canvas}
		width="1000"
		height="650"
		aria-label={label}
	></canvas>
	<output
		>{(tick * DT).toFixed(2)}
		/ 14.00 s ·
		{tick === TOTAL_TICKS ? "End" : INPUT_SEQUENCE[Math.floor(tick / 60)]}
		· Speed {samples[tick].speed.toFixed(1)} · Turn
		{samples[tick].spin?.toFixed(1)}°/s</output
	>
	<label
		>Flight timeline<input
			type="range"
			min="0"
			max={TOTAL_TICKS}
			step="1"
			value={tick}
			oninput={(e) => seek(Number(e.currentTarget.value))}
		></label
	>
	<div class="controls">
		{#each INPUT_SEQUENCE as command, i}
			<button type="button" class="btn btn-ghost" onclick={() => seek(i * 60)}>
				{i}s · {command}
			</button>
		{/each}
	</div>
	<p>
		Emission this tick: left main
		{(samples[tick].emissions?.[0] ?? 0).toFixed(2)}, right main
		{(samples[tick].emissions?.[1] ?? 0).toFixed(2)}, left stabilizer
		{(samples[tick].emissions?.[4] ?? 0).toFixed(2)}, right stabilizer
		{(samples[tick].emissions?.[5] ?? 0).toFixed(2)}. Fading marks remain after
		emission stops.
	</p>
</div>
<style>
.flight {
	border: 1px solid var(--color-text-dim);
	padding: var(--spacing-md);
}
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
	align-items: end;
}
canvas {
	width: 100%;
	display: block;
	margin-block: var(--spacing-md);
}
label {
	display: grid;
	gap: var(--spacing-sm);
	margin-block: var(--spacing-md);
}
input,
select {
	min-height: 44px;
	color: var(--color-text);
	background: var(--color-void);
}
input {
	width: 100%;
}
p {
	line-height: 1.6;
	margin-top: var(--spacing-md);
}
output {
	font-variant-numeric: tabular-nums;
}
</style>
