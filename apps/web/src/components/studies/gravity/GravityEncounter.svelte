<script lang="ts">
import { drawStar, type WellCurve, wellAcceleration } from "@void-drift/core";
import "@void-drift/core/styles/buttons.css";
import { duration, encounter, rate, star } from "./encounter";

let {
	label = "Solar close-pass comparison",
	curveStudy = false,
}: { label?: string; curveStudy?: boolean } = $props();
let curve = $state<WellCurve>("inverse-square");
let strengthMultiplier = $state(1);
let speed = $state(500);
let aim = $state(180);
let time = $state(duration);
let legacy = $state(false);
let canvas: HTMLCanvasElement;
const flights = $derived([
	{
		title: "Solar well",
		flight: encounter(
			{
				speed,
				aim,
				legacy,
				curve: curveStudy ? curve : "linear",
				strengthMultiplier: curveStudy ? strengthMultiplier : 1,
			},
			true,
		),
	},
	{
		title: "Same launch, no sun",
		flight: encounter(
			{
				speed,
				aim,
				legacy,
				curve: curveStudy ? curve : "linear",
				strengthMultiplier: curveStudy ? strengthMultiplier : 1,
			},
			false,
		),
	},
]);
function reset() {
	strengthMultiplier = 1;
	speed = 500;
	aim = 180;
	time = duration;
}
$effect(() => {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	const styles = getComputedStyle(canvas);
	const text = styles.getPropertyValue("--color-text").trim();
	const dim = styles.getPropertyValue("--color-text-dim").trim();
	const accent = styles.getPropertyValue("--color-acid-lime").trim();
	ctx.clearRect(0, 0, 800, 800);
	ctx.save();
	ctx.translate(400, 400);
	ctx.strokeStyle = dim;
	ctx.setLineDash([6, 8]);
	ctx.beginPath();
	ctx.arc(0, 0, star.influenceRadius, 0, Math.PI * 2);
	ctx.stroke();
	ctx.setLineDash([]);
	drawStar(ctx, {
		x: 0,
		y: 0,
		radius: star.radius,
		color: star.color,
		glowColor: star.glowColor,
		time: time * 1000,
	});
	for (const [index, { flight }] of flights.entries()) {
		const last = Math.min(Math.round(time * rate), flight.samples.length - 1);
		ctx.strokeStyle = index === 0 ? accent : text;
		ctx.lineWidth = 3;
		ctx.setLineDash(index === 0 ? [] : [8, 6]);
		ctx.beginPath();
		for (let i = 0; i <= last; i++) {
			const point = flight.samples[i];
			if (i === 0) ctx.moveTo(point.x, point.y);
			else ctx.lineTo(point.x, point.y);
		}
		ctx.stroke();
		const point = flight.samples[last];
		ctx.fillStyle = index === 0 ? accent : text;
		ctx.beginPath();
		ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
});
</script>

<section class="experiment" aria-label={label}>
	<p>
		<strong
			>{legacy
				? "Original baseline: drag + speed cap"
				: "Updated demo: no drag, no speed cap"}</strong
		>
	</p>
	<label
		><span
			><input type="checkbox" bind:checked={legacy}>
			Compare original drag and speed cap</span
		></label
	>
	{#if curveStudy}
		<label
			>Gravity curve<select bind:value={curve}>
				<option value="inverse-square">Inverse-square, zero at edge</option>
				<option value="linear">Original linear pull</option>
			</select></label
		>
		<p>
			Both curves pull at {(300 * strengthMultiplier).toFixed(0)} units/s²
			halfway to the boundary (157.5 units). The inverse-square variant is
			weaker outside that distance and stronger inside. No drag or cap unless
			explicitly enabled above.
		</p>
	{/if}
	<div class="controls">
		{#if curveStudy}
			<label
				>Star gravity: {strengthMultiplier.toFixed(2)}×<input
					aria-label="Star gravity"
					type="range"
					min="0.25"
					max="8"
					step="0.25"
					bind:value={strengthMultiplier}
				></label
			>
		{/if}
		<label
			>Entry speed: {speed} units/s
			<input
				aria-label="Entry speed"
				type="range"
				min="150"
				max="900"
				step="25"
				bind:value={speed}
			></label
		>
		<label
			>Aim offset: {aim} units
			<input
				aria-label="Aim offset"
				type="range"
				min="0"
				max="300"
				step="10"
				bind:value={aim}
			></label
		>
		<label
			>Replay time: {time.toFixed(1)} s
			<input
				aria-label="Replay time"
				type="range"
				min="0"
				max={duration}
				step="0.05"
				bind:value={time}
			></label
		>
		<button type="button" class="btn btn-ghost" onclick={reset}>
			Reset comparison
		</button>
	</div>
	<p>
		Solid lime: solar well. Dashed white: no sun. Dashed circle: gravity reach,
		not a safety boundary. Both ships enter from the left, pointing right, with
		engines off.
	</p>
	{#if curveStudy}
		<p>
			Surface pull:
			{wellAcceleration(
				star.radius,
				star.influenceRadius,
				star.mass * strengthMultiplier,
				curve,
			).toFixed(0)}
			units/s². This scales the whole curve; the radius and zero-pull boundary
			stay fixed. 1× restores the previous strength.
		</p>
	{/if}
	<div class="results">
		<canvas
			bind:this={canvas}
			width="800"
			height="800"
			aria-label="Overlaid close-pass trajectories. Numeric outcomes are provided alongside the diagram."
		></canvas>
		<div>
			{#each flights as { title, flight }}
				{@const sample =
					flight.samples[
						Math.min(Math.round(time * rate), flight.samples.length - 1)
					]}
				<article>
					<h3>{title}</h3>
					<p>
						<strong>{flight.outcome}</strong>
						· {flight.end.time.toFixed(2)} s
					</p>
					<dl>
						<dt>Entry → peak speed</dt>
						<dd>{speed} → {flight.peak.toFixed(0)} units/s</dd>
						<dt>
							{flight.outcome === "Exited"
								? "Exit speed"
								: "Final speed (no exit)"}
						</dt>
						<dd>{flight.end.speed.toFixed(0)} units/s</dd>
						<dt>Closest distance to center</dt>
						<dd>{flight.closest.toFixed(0)} units</dd>
						<dt>Hull remaining</dt>
						<dd>{flight.end.hull.toFixed(0)}%</dd>
						<dt>Speed at replay cursor</dt>
						<dd>
							{sample.speed.toFixed(0)}
							units/s at {sample.time.toFixed(2)} s
						</dd>
					</dl>
				</article>
			{/each}
		</div>
	</div>
	<p class="limits">
		Fixture: stock G sun (radius {star.radius}, reach {star.influenceRadius},
		strength {star.mass * (curveStudy ? strengthMultiplier : 1)}), stock core
		flight tuning, 60 steps/s, up to 12 s. Shared solar gravity calculation and
		solar hull damage are reused. The selected curve is study-only; the
		production game retains its original linear pull. Drag and the speed cap are
		disabled by default; the comparison checkbox restores both original rules.
		Both engines are off, so directional engine effectiveness is not exercised
		here. The reference removes the entire sun, including heat. Both exits are
		measured at the starting radius; elapsed times may differ. No planets, power
		depletion, steering, camera motion, or arena wrapping occur in this
		encounter. Paths stop at exit or death; “still inside” does not prove escape
		is impossible. The dots and trails are measurement graphics, not proposed
		game visuals.
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
	align-items: center;
}
label {
	display: grid;
	gap: var(--spacing-sm);
}
select {
	min-height: 44px;
	font: inherit;
}
input[type="checkbox"] {
	width: auto;
	min-height: auto;
}
input {
	width: 100%;
	min-height: 44px;
	accent-color: var(--color-acid-lime);
}
.results {
	display: grid;
	grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr);
	gap: var(--spacing-lg);
}
canvas {
	width: 100%;
	height: auto;
	align-self: start;
}
article {
	margin-block: var(--spacing-lg);
}
h3 {
	color: var(--color-acid-lime);
	margin-bottom: var(--spacing-sm);
}
dl {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--spacing-sm);
	font-size: var(--font-small);
}
dt {
	color: var(--color-text-dim);
}
dd {
	margin: 0;
}
p {
	margin-block: var(--spacing-md);
}
.limits {
	color: var(--color-text-dim);
	font-size: var(--font-small);
}
@media (max-width: 650px) {
	.results {
		grid-template-columns: 1fr;
	}
}
</style>
