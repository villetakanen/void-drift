<script lang="ts">
import { drawStar, SUN_CONFIG } from "@void-drift/core";
import { BUILD_FLIGHT_SCALE, drawBuild } from "@void-drift/mode-a";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import { loadout, reach } from "./charging";

let { label = "Standard Sun HUD state preview" }: { label?: string } = $props();
let gravity = $state(true),
	solar = $state(true),
	collecting = $state(false),
	hazard = $state(true),
	damaging = $state(false),
	animate = $state(true),
	solarFill = $state(true),
	hazardFill = $state(true);
let zoom = $state(0.8),
	width = $state(760),
	height = $state(640);
let canvas: HTMLCanvasElement;
const green = $derived(solar && collecting ? "active" : "quiet");
const shipDistance = $derived(
	hazard && damaging ? 80 : solar && collecting ? 180 : 350,
);
const shipX = $derived(Math.cos(-0.45) * shipDistance);
const shipY = $derived(Math.sin(-0.45) * shipDistance);
onMount(() => {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	let frame = 0,
		time = 0,
		last = 0;
	const draw = (now: number) => {
		if (animate && last) time += Math.min(50, now - last);
		last = now;
		const dpr = window.devicePixelRatio || 1;
		const w = Math.round(width * dpr),
			h = Math.round(height * dpr);
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "#07080d";
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = "#ffffff";
		for (let i = 0; i < 90; i++) {
			ctx.globalAlpha = 0.1 + (i % 4) * 0.07;
			ctx.fillRect((i * 137.31) % width, (i * 71.93) % height, 1, 1);
		}
		ctx.globalAlpha = 1;
		ctx.save();
		ctx.translate(width / 2, height / 2);
		ctx.scale(zoom, zoom);
		drawStar(ctx, {
			x: 0,
			y: 0,
			radius: SUN_CONFIG.G.radius,
			color: SUN_CONFIG.G.color,
			glowColor: SUN_CONFIG.G.glowColor,
			pulseSpeed: SUN_CONFIG.G.pulseSpeed,
			time,
		});
		drawBuild(ctx, loadout, shipX, shipY, -0.45, BUILD_FLIGHT_SCALE);
		ctx.restore();
		frame = requestAnimationFrame(draw);
	};
	frame = requestAnimationFrame(draw);
	return () => cancelAnimationFrame(frame);
});
</script>
<div class="preview">
	<div class="stage" bind:clientWidth={width} bind:clientHeight={height}>
		<canvas bind:this={canvas} aria-label={label}></canvas>
		<svg
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="World-anchored solar, gravity and hazard boundaries; strokes remain one CSS pixel at every zoom"
		>
			<g transform={`translate(${width / 2} ${height / 2}) scale(${zoom})`}>
				{#if gravity}
					<circle class="field quiet dashed gravity" cx="0" cy="0" r={reach} />
				{/if}
				{#if solar}
					<circle
						class={`field solar ${green}`}
						class:solarFill={solarFill && collecting}
						cx="0"
						cy="0"
						r={reach - (gravity ? 2 / zoom : 0)}
					/>
				{/if}
				{#if hazard}
					<circle
						class="hazard"
						class:damaging
						class:hazardFill={hazardFill && damaging}
						cx="0"
						cy="0"
						r="100"
					/>
				{/if}
			</g>
		</svg>
		<div class="readout">
			<span class="identity">G / STANDARD SUN</span>
			<span class:bright={solar && collecting}
				>{solar && collecting
					? "SOLAR COLLECTION ACTIVE"
					: "SOLAR COLLECTION IDLE"}</span
			>
			<span class:danger={hazard && damaging}
				>{hazard && damaging
					? "HULL DAMAGE ACTIVE"
					: "NO ACTIVE HULL DAMAGE"}</span
			>
		</div>
		<div class="caption">
			WASP · state preview <span>{zoom.toFixed(2)}× · HUD 1 px</span>
		</div>
	</div>
	<aside aria-label="Sun HUD preview controls">
		<h4>HUD states</h4>
		<label><input type="checkbox" bind:checked={gravity}>Gravity field</label>
		<label><input type="checkbox" bind:checked={solar}>Solar field</label>
		<label class="sub"
			><input type="checkbox" bind:checked={collecting} disabled={!solar}>Active
			collection</label
		>
		<label><input type="checkbox" bind:checked={hazard}>Hazard zone</label>
		<label class="sub"
			><input type="checkbox" bind:checked={damaging} disabled={!hazard}>Active
			damage</label
		>
		<label
			><input type="checkbox" bind:checked={solarFill}>5% active solar
			fill</label
		>
		<label
			><input type="checkbox" bind:checked={hazardFill}>5% active hazard
			fill</label
		>
		<RingSlider
			label="Camera zoom"
			min={0.5}
			max={1.2}
			step={0.05}
			bind:value={zoom}
			digits={2}
		/>
		<label><input type="checkbox" bind:checked={animate}>Animate Sun</label>
		<p>
			Gravity: dashed green. Solar: solid green, drawn 2 screen pixels inside
			gravity when their boundaries coincide. Field sizes are unchanged. Active
			collection brightens it; active damage turns the dotted inner warning red.
			Hazard stays dotted in both states.
		</p>
		<p>
			State switches place the Wasp in a representative location. These are
			forced presentation states, not a flight simulation or a live resource
			reading.
		</p>
	</aside>
</div>
<style>
.preview {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 280px;
	gap: 24px;
	margin-block: 32px;
}
.stage {
	height: 640px;
	position: relative;
	overflow: hidden;
	background: var(--color-void);
}
canvas,
svg {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	display: block;
}
svg {
	pointer-events: none;
}
circle {
	fill: none;
	stroke-width: 1px;
	vector-effect: non-scaling-stroke;
}
.field {
	stroke: var(--color-android-green);
}
.quiet {
	opacity: 0.35;
}
.active {
	opacity: 1;
}
.dashed {
	stroke-dasharray: 5 5;
}
.hazard {
	stroke-dasharray: 1 4;
	stroke-linecap: round;
	stroke: var(--color-resource-warning);
	opacity: 0.6;
}
.solar.solarFill {
	fill: var(--color-android-green);
	fill-opacity: 0.033;
}
.hazard.hazardFill {
	fill: var(--color-resource-danger);
	fill-opacity: 0.11;
}
.hazard.damaging {
	stroke: var(--color-resource-danger);
	opacity: 1;
}
.readout {
	position: absolute;
	left: 20px;
	top: 20px;
	display: grid;
	gap: 8px;
	font: 12px var(--font-family-ui);
	color: var(--color-text-muted);
}
.identity {
	color: var(--color-android-green);
}
.bright {
	color: var(--color-android-green);
}
.danger {
	color: var(--color-resource-danger);
}
.caption {
	position: absolute;
	bottom: 20px;
	left: 20px;
	right: 20px;
	display: flex;
	justify-content: space-between;
	font: 12px var(--font-family-ui);
	color: var(--color-text-muted);
}
aside {
	padding: 20px;
	background: var(--color-elev-1);
}
h4 {
	margin: 0 0 16px;
	font-size: var(--font-size-heading);
}
label {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 44px;
	cursor: pointer;
	font: 14px var(--font-family-ui);
}
input {
	accent-color: var(--color-android-green);
	width: 18px;
	height: 18px;
}
input:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 3px;
}
.sub {
	padding-left: 18px;
}
p {
	font-size: 14px;
	line-height: 1.5;
	margin-top: 20px;
	color: var(--color-text-muted);
}
</style>
