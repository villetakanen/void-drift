<script lang="ts">
import { drawPlanet } from "@void-drift/core";
import "@void-drift/core/styles/buttons.css";
import {
	planetDuration,
	planetEncounter,
	planetRadius,
	planetRate,
} from "./planet-encounter";

let { label = "Planet encounter comparison" }: { label?: string } = $props();
let speed = $state(325),
	aim = $state(45),
	reach = $state(240),
	pull = $state(300),
	motion = $state(60),
	time = $state(12);
let canvas: HTMLCanvasElement;
const flights = $derived([
	planetEncounter({ speed, aim, reach, pull, motion }, false),
	planetEncounter({ speed, aim, reach, pull, motion }, true),
]);
function reset() {
	speed = 325;
	aim = 45;
	reach = 240;
	pull = 300;
	motion = 60;
	time = 12;
}
$effect(() => {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	const styles = getComputedStyle(canvas);
	const lime = styles.getPropertyValue("--color-acid-lime").trim();
	const dim = styles.getPropertyValue("--color-text-dim").trim();
	ctx.clearRect(0, 0, 1000, 500);
	flights.forEach((flight, index) => {
		ctx.save();
		ctx.translate(index * 500 + 250, 250);
		ctx.scale(210 / reach, 210 / reach);
		ctx.strokeStyle = dim;
		ctx.setLineDash([5, 5]);
		ctx.beginPath();
		ctx.arc(0, 0, reach, 0, Math.PI * 2);
		ctx.stroke();
		ctx.setLineDash([]);
		drawPlanet(ctx, { x: 0, y: 0, radius: planetRadius, color: "#8B7355" });
		ctx.strokeStyle = lime;
		ctx.lineWidth = (2 * reach) / 210;
		ctx.beginPath();
		const last = Math.min(
			Math.round(time * planetRate),
			flight.samples.length - 1,
		);
		for (let i = 0; i <= last; i++) {
			const p = flight.samples[i];
			if (i === 0) ctx.moveTo(p.x, p.y);
			else ctx.lineTo(p.x, p.y);
		}
		ctx.stroke();
		const p = flight.samples[last];
		ctx.fillStyle = lime;
		ctx.beginPath();
		ctx.arc(p.x, p.y, (4 * reach) / 210, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	});
});
</script>
<section class="experiment" aria-label={label}>
	<div class="controls">
		<label
			>Entry speed: {speed} units/s<input
				aria-label="Planet trial entry speed"
				type="range"
				min="150"
				max="900"
				step="25"
				bind:value={speed}
			></label
		>
		<label
			>Aim: {aim}% of reach<input
				aria-label="Planet trial aim"
				type="range"
				min="-90"
				max="90"
				step="5"
				bind:value={aim}
			></label
		>
		<label
			>Gravity at half reach: {pull} units/s²<input
				aria-label="Planet gravity strength"
				type="range"
				min="100"
				max="2400"
				step="100"
				bind:value={pull}
			></label
		>
		<label
			>Well reach: {reach} units<input
				aria-label="Planet well reach"
				type="range"
				min="160"
				max="400"
				step="20"
				bind:value={reach}
			></label
		>
		<label
			>Planet orbital speed: {motion} units/s<input
				aria-label="Planet orbital speed"
				type="range"
				min="-120"
				max="120"
				step="10"
				bind:value={motion}
			></label
		>
		<label
			>Replay: {time.toFixed(1)} s<input
				aria-label="Planet replay time"
				type="range"
				min="0"
				max={planetDuration}
				step="0.05"
				bind:value={time}
			></label
		>
		<button type="button" class="btn btn-ghost" onclick={reset}>
			Reset planet trial
		</button>
	</div>
	<p>
		Left: stationary. Right: orbiting. Both views follow the planet; trails show
		motion relative to it. Positive orbital speed initially moves the planet
		downward. Change the sign of aim or orbital speed to compare encounter
		sides.
	</p>
	<canvas
		bind:this={canvas}
		width="1000"
		height="500"
		aria-label="Stationary and orbiting planet trajectories, with numerical results below"
	></canvas>
	<div class="results">
		{#each flights as flight, index}
			<article>
				<h3>{index === 0 ? "Stationary planet" : "Orbiting planet"}</h3>
				<p>
					<strong>{flight.outcome}</strong>
					· {flight.end.time.toFixed(2)} s
				</p>
				<p>
					Entry → peak →
					{flight.outcome === "Exited" ? "exit" : "final"}
					speed:<br>{speed}
					→ {flight.peak.toFixed(0)} → {flight.end.speed.toFixed(0)} units/s
				</p>
				<p>
					Speed change:
					{(flight.end.speed - speed).toFixed(0)}
					units/s<br>Closest center distance: {flight.closest.toFixed(0)} units
				</p>
			</article>
		{/each}
	</div>
	<p class="limits">
		Fixed small rock planet: radius 20; ship radius 16. Contact stops the trial
		at a center distance of 36; no bounce or damage model is being assessed.
		Gravity uses the shared bounded inverse-square law, reaching zero at the
		independent well boundary. Midpoint strength is independent of physical
		radius. Shared orbit motion follows a prescribed 600-unit orbit; no central
		sun force is included. These are isolated study fixtures, not the current
		planetary game rules. Engines off, no drag or speed cap. Speeds are measured
		in the arena frame; the orbiting planet can exchange energy with the ship.
		Both trials start with the same ship position and velocity at the well
		boundary. Integration uses 240 steps/s, up to 12 seconds; a non-exit is not
		proof of permanent capture. Changing reach also changes the initial launch
		position.
	</p>
</section>
<style>
.experiment {
	border: var(--flight-border);
	padding: var(--spacing-md);
}
.controls {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: var(--spacing-md);
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
canvas {
	width: 100%;
	height: auto;
}
.results {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--spacing-md);
}
h3 {
	color: var(--color-acid-lime);
}
p {
	margin-block: var(--spacing-md);
}
.limits {
	color: var(--color-text-dim);
	font-size: var(--font-small);
}
@media (max-width: 500px) {
	.results {
		grid-template-columns: 1fr;
	}
}
</style>
