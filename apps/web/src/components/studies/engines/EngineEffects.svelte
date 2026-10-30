<script lang="ts">
import { drawShip, updateShip } from "@void-drift/core";
import {
	GRAVITY_FLIGHT,
	Simulation,
	STEP,
	stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

let {
	label = "Engine surface study: one engine, both engines, then release",
	splayDegrees = 0,
}: { label?: string; splayDegrees?: number } = $props();

const simulation = new Simulation(stockSettings("balanced"));
simulation.start();
const frames = Array.from({ length: 361 }, (_, tick) => {
	const left = tick < 180;
	const right = tick >= 60 && tick < 180;
	const frame = {
		x: simulation.ship.pos.x,
		y: simulation.ship.pos.y,
		rotation: simulation.ship.rotation,
		wraps: simulation.wraps,
		left,
		right,
	};
	for (let substep = 0; substep < 4; substep++) {
		updateShip(
			simulation.ship,
			{ leftThruster: left, rightThruster: right, fire: false },
			STEP / 4,
			1920,
			1080,
			undefined,
			[],
			undefined,
			undefined,
			simulation.settings.profile,
			{ drag: 0, speedLimit: null },
			"inverse-square",
			GRAVITY_FLIGHT.engineSpeedScale,
		);
	}
	return frame;
});
let canvas: HTMLCanvasElement;
let tick = $state(0);
let playing = $state(false);
let glow = $state(true);
const phase = $derived(
	tick < 60
		? "One engine"
		: tick < 180
			? "Both engines"
			: "Released · drifting",
);

// Study-local palette and geometry; these are proposals, not shared definitions.
function surface(
	ctx: CanvasRenderingContext2D,
	length: number,
	width: number,
	alpha: number,
	luminous: boolean,
) {
	ctx.save();
	ctx.globalAlpha = alpha;
	const gradient = ctx.createLinearGradient(0, 0, -length, 0);
	gradient.addColorStop(0, "#eafff9");
	gradient.addColorStop(0.16, "#70ffe2");
	gradient.addColorStop(0.55, "#13aebf");
	gradient.addColorStop(1, "#1754b000");
	ctx.fillStyle = gradient;
	if (luminous) {
		ctx.shadowColor = "#25e9d2";
		ctx.shadowBlur = 16;
	}
	ctx.beginPath();
	ctx.moveTo(0, -width * 0.25);
	ctx.bezierCurveTo(
		-length * 0.25,
		-width,
		-length * 0.7,
		-width * 0.7,
		-length,
		0,
	);
	ctx.bezierCurveTo(
		-length * 0.7,
		width * 0.7,
		-length * 0.25,
		width,
		0,
		width * 0.25,
	);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

$effect(() => {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	const current = frames[tick];
	ctx.clearRect(0, 0, 800, 420);
	ctx.save();
	ctx.translate(490, 210);
	ctx.scale(2, 2);
	// Old surfaces stay at their emission positions; the camera follows the ship.
	for (let i = Math.max(0, tick - 90); i < tick; i += 3) {
		const old = frames[i];
		if (old.wraps !== current.wraps) continue;
		const age = (tick - i) / 90;
		for (const side of [-1, 1]) {
			if (!(side === -1 ? old.left : old.right)) continue;
			ctx.save();
			ctx.translate(old.x - current.x, old.y - current.y);
			ctx.rotate(old.rotation);
			ctx.translate(-8, side * 5);
			ctx.rotate((-side * splayDegrees * Math.PI) / 180);
			surface(ctx, 24 + age * 32, 5 + age * 11, (1 - age) ** 2 * 0.19, glow);
			ctx.restore();
		}
	}
	for (const side of [-1, 1]) {
		if (!(side === -1 ? current.left : current.right)) continue;
		ctx.save();
		ctx.rotate(current.rotation);
		ctx.translate(-8, side * 5);
		ctx.rotate((-side * splayDegrees * Math.PI) / 180);
		const pulse = Math.sin(tick * 0.16) * 3;
		surface(ctx, 43 + pulse, 9, 0.9, glow);
		surface(ctx, 17 + pulse * 0.3, 3, 1, false);
		ctx.restore();
	}
	drawShip(ctx, {
		x: 0,
		y: 0,
		rotation: current.rotation,
		color: "#d9fff2",
		variant: "balanced",
	});
	ctx.restore();
});

onMount(() => {
	playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
	let last = performance.now();
	let carry = 0;
	let request = 0;
	function animate(now: number) {
		if (playing) {
			carry += Math.min((now - last) / 1000, 0.1);
			while (carry >= STEP) {
				carry -= STEP;
				tick = (tick + 1) % frames.length;
			}
		} else carry = 0;
		last = now;
		request = requestAnimationFrame(animate);
	}
	request = requestAnimationFrame(animate);
	return () => cancelAnimationFrame(request);
});
</script>

<div class="experiment">
	<div class="readout">
		<strong>{phase}</strong><span>{(tick / 60).toFixed(1)} / 6.0 s</span>
	</div>
	<canvas bind:this={canvas} width="800" height="420" aria-label={label}>
		Use the timeline to examine engine surfaces and their fading wake.
	</canvas>
	<div class="controls">
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				playing = !playing;
			}}
		>
			{playing ? "Pause" : "Play"}
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				tick = 0;
			}}
		>
			Restart
		</button>
		<label><input type="checkbox" bind:checked={glow}> Add glow</label>
	</div>
	<label class="timeline"
		>Flight time
		<input
			type="range"
			min="0"
			max="360"
			step="1"
			bind:value={tick}
			oninput={() => {
				playing = false;
			}}
		>
	</label>
	<p>
		Same flight and filled shapes with or without glow. Pause and scrub to
		inspect the surfaces.
	</p>
</div>

<style>
.experiment {
	border: var(--flight-border);
	padding: var(--spacing-md);
	background: var(--color-void);
}
canvas {
	width: 100%;
	height: auto;
	display: block;
}
.readout,
.controls {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-md);
	flex-wrap: wrap;
}
.readout {
	font-family: var(--font-flight);
	color: var(--color-acid-lime);
}
.controls {
	justify-content: flex-start;
}
.controls label {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	min-height: 44px;
}
.timeline {
	display: grid;
	gap: var(--spacing-sm);
	margin-top: var(--spacing-md);
}
.timeline input {
	width: 100%;
	min-height: 44px;
}
p {
	color: var(--color-text-dim);
	margin-top: var(--spacing-sm);
}
</style>
