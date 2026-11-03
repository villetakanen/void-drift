<script lang="ts">
import { Camera, Input, Renderer } from "@void-drift/core";
import {
	BUILD_FLIGHT_SCALE,
	drawBuild,
	FlightFx,
	LoadoutSchema,
	Simulation,
	STEP,
	starterLoadout,
	stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";

let { label = "J in planetary flight" }: { label?: string } = $props();
let canvas: HTMLCanvasElement;
let running = $state(false);
let fold = $state(true);
let additive = $state(true);
let burn = $state(true);
let turning = $state(true);
let zoom = $state(1);
let gameCamera = $state(true);
let repeat = $state(true);
let slow = $state(false);
let status = $state("Ready");
let field = $state("Outside planetary influence");
let reset = () => {};
const base = starterLoadout("fighter");
base.hull.fill("gravity-coil");
const loadout = LoadoutSchema.parse(base);
onMount(() => {
	const renderer = new Renderer(canvas);
	renderer.resize(1000, 600);
	const ctx = canvas.getContext("2d");
	const flightFx = new FlightFx();
	if (!ctx) return;
	const input = new Input(canvas);
	const camera = new Camera({ viewportWidth: 1000, viewportHeight: 600 });
	const frameCamera = (snap = false) => {
		const c = sim.settings.camera;
		camera.frame(
			sim.ship.pos.x,
			sim.ship.pos.y,
			960,
			540,
			c.padding,
			c.smoothing,
			snap,
			c.zoomSteps,
		);
	};
	let sim: Simulation;
	reset = () => {
		sim = new Simulation({ ...stockSettings("fighter"), loadout });
		const p = sim.planets[0];
		// Reproducible powered pass: outside → inside → outside in three seconds.
		sim.ship.pos.set(p.pos.x - 350, p.pos.y - 140);
		sim.ship.vel.set(60, 0);
		sim.ship.rotation = 0;
		sim.start();
		frameCamera(true);
		input.reset();
		status = "Ready";
		running = false;
	};
	reset();
	let previous = performance.now(),
		accumulator = 0,
		frame = 0;
	const draw = (now: number) => {
		const dt = Math.min((now - previous) / 1000, 0.1);
		previous = now;
		if (running) {
			accumulator += dt * (slow ? 0.25 : 1);
			while (accumulator >= STEP) {
				const controls = input.getEffectiveState(false);
				const auto = burn;
				// A real asymmetric engine input turns the ship during field crossing.
				const turn = turning && sim.ticks >= 60 && sim.ticks < 96;
				sim.step({
					leftThruster: controls.leftThruster || auto,
					rightThruster: controls.rightThruster || (auto && !turn),
					fire: false,
				});
				frameCamera();
				camera.update(STEP);
				accumulator -= STEP;
				if (repeat && sim.ticks >= 180) {
					reset();
					running = true;
					accumulator = 0;
					break;
				}
			}
			status = sim.state.status;
			if (sim.state.status !== "PLAYING") running = false;
		} else accumulator = 0;
		renderer.clear();
		ctx.save();
		if (gameCamera) camera.applyTransform(ctx);
		else {
			ctx.translate(500, 300);
			ctx.scale(zoom, zoom);
			ctx.translate(-sim.ship.pos.x, -sim.ship.pos.y);
		}
		renderer.drawBackground();
		renderer.drawStar(sim.star, sim.ticks * STEP * 1000);
		for (const p of sim.planets) renderer.drawPlanet(p);
		drawBuild(
			ctx,
			loadout,
			sim.ship.pos.x,
			sim.ship.pos.y,
			sim.ship.rotation,
			BUILD_FLIGHT_SCALE,
		);
		flightFx.draw(ctx, sim, fold, additive);
		field =
			sim.gravityCollectionRate > 0
				? `Collecting ${sim.gravityCollectionRate.toFixed(1)} energy/s · ${sim.state.resources.power.toFixed(1)} energy`
				: `Not collecting · ${sim.state.resources.power.toFixed(1)} energy`;
		ctx.restore();
		frame = requestAnimationFrame(draw);
	};
	frame = requestAnimationFrame(draw);
	const blur = () => {
		running = false;
	};
	window.addEventListener("blur", blur);
	return () => {
		cancelAnimationFrame(frame);
		input.destroy();
		window.removeEventListener("blur", blur);
	};
});
</script>
<div class="controls">
	<button type="button" onclick={() => (running = !running)}>
		{running ? "Pause" : "Fly by"}
	</button>
	<button type="button" onclick={() => reset()}>Reset flyby</button>
	<label><input type="checkbox" bind:checked={fold}> J FX</label>
	<label><input type="checkbox" bind:checked={additive}> Add fold light</label>
	<label
		><input type="checkbox" bind:checked={burn}>
		Powered flyby</label
	>
	<label><input type="checkbox" bind:checked={turning}> Turn in field</label>
	<label><input type="checkbox" bind:checked={repeat}> Repeat flyby</label>
	<label><input type="checkbox" bind:checked={gameCamera}> Game camera</label>
	<label><input type="checkbox" bind:checked={slow}> ¼ speed</label>
	<label
		>Close-view zoom
		<input
			type="range"
			disabled={gameCamera}
			min="0.5"
			max="4"
			step="0.25"
			bind:value={zoom}
		>
		{zoom}×</label
	>
</div>
<p>{status} · {field}</p>
<canvas bind:this={canvas} aria-label={label}></canvas>
<p>
	Pause inside the field, then toggle Add fold light to compare the same frame.
	On: overlapping light adds and can brighten toward white. Off: folds use
	ordinary transparency over the engine trails and each other. Engine rendering
	stays fixed. Use J FX to compare against engines alone.
</p>
<p>
	W / ↑: both engines · A / ← and D / →: individual engines. Touch either half
	for that engine; use both together. Turn off Powered flyby for manual control.
	Repeat restarts the same three-second pass; turn it off to keep flying.
</p>
<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
	margin-block: 20px;
}
label {
	display: flex;
	align-items: center;
	gap: 8px;
}
button {
	padding: 8px 12px;
	background: var(--color-void);
	color: var(--color-text);
	border: 1px solid var(--color-border);
	cursor: pointer;
}
button:focus-visible,
input:focus-visible {
	outline: 2px solid var(--color-action);
	outline-offset: 3px;
}
canvas {
	display: block;
	width: 100%;
	height: auto;
	touch-action: none;
	border: 1px solid var(--color-border);
}
p {
	font-size: 14px;
	color: var(--color-text-muted);
}
</style>
