<script lang="ts">
import { EnginePlume, Vec2 } from "@void-drift/core";
import {
	applyBuildEngines,
	BUILD_FLIGHT_SCALE,
	buildDrain,
	buildPlumeEmitters,
	buildStats,
	defaultLoadout,
	drawBuild,
	LoadoutSchema,
	STEP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

let { label = "Light and Heavy ion visual comparison" }: { label?: string } =
	$props();
const variants = (["ion", "heavy-ion"] as const).map((part) => ({
	build: LoadoutSchema.parse({
		...defaultLoadout("balanced"),
		side: part,
		aft: [part, null],
	}),
	length: part === "ion" ? 1 : 1.4,
	width: part === "ion" ? 1 : 1.45,
}));
let lightCanvas: HTMLCanvasElement;
let heavyCanvas: HTMLCanvasElement;
let playing = $state(false);
let released = $state(false);
let ticks = $state(0);
let plumes = variants.map(() => new EnginePlume());
const ship = {
	pos: new Vec2(0, 0),
	vel: new Vec2(0, 0),
	acc: new Vec2(0, 0),
	rotation: 0,
	radius: 16,
};
// Reproduce the accepted 02.3 flight and output history for both visual variants.
const referenceBuild = variants[0].build;
const stats = buildStats(referenceBuild);
let power = stats.capacity;
let timers: Record<string, number> = {};
function reset() {
	ticks = 0;
	released = false;
	ship.pos.x = ship.pos.y = ship.vel.x = ship.vel.y = ship.rotation = 0;
	power = stats.capacity;
	timers = {};
	plumes = variants.map(() => new EnginePlume());
}
function advance() {
	if (ticks >= 420) {
		playing = false;
		return;
	}
	const time = ticks * STEP;
	const firing = !released && time < 5.25;
	const turning = time >= 4 && time < 4.75;
	const input = {
		leftThruster: firing,
		rightThruster: firing && !turning,
		fire: false,
	};
	const available = Math.max(0, power - 3 * STEP);
	const requested = (buildDrain(referenceBuild, input) - 3) * STEP;
	const spent = Math.min(available, requested);
	const fraction = requested > 0 ? spent / requested : 0;
	power = available - spent;
	let delivered = { left: 0, right: 0, aft: [] as number[] };
	for (let i = 0; i < 4; i++) {
		delivered = applyBuildEngines(
			ship,
			referenceBuild,
			input,
			STEP / 4,
			fraction > 0,
			timers,
			fraction,
		);
		ship.pos.x += (ship.vel.x * STEP) / 4;
		ship.pos.y += (ship.vel.y * STEP) / 4;
	}
	const outputs = [delivered.left, delivered.right, delivered.aft[0]];
	variants.forEach((variant, i) => {
		plumes[i].stepMounted(
			STEP,
			ship,
			buildPlumeEmitters(variant.build).map((emitter, index) => ({
				...emitter,
				output: outputs[index] * fraction,
			})),
		);
	});
	ticks++;
	if (ticks === 420) playing = false;
}
function paint(ctx: CanvasRenderingContext2D, size: number, index: number) {
	const length = 48 * size * variants[index].length;
	for (const [width, color, alpha] of [
		[6, index === 0 ? "19,174,191" : "19,157,205", 0.12],
		[3, index === 0 ? "112,255,226" : "112,226,255", 0.3],
		[1.6, index === 0 ? "112,255,226" : "112,226,255", 1],
		[0.6, "234,255,249", 1],
	] as const) {
		const fade = ctx.createLinearGradient(-length, 0, 0, 0);
		fade.addColorStop(0, `rgba(${color},0)`);
		fade.addColorStop(0.3, `rgba(${color},${alpha * 0.2})`);
		fade.addColorStop(0.75, `rgba(${color},${alpha})`);
		fade.addColorStop(1, `rgba(${color},${alpha})`);
		ctx.fillStyle = fade;
		ctx.shadowColor = index === 0 ? "#25e9d2" : "#25cfe9";
		ctx.shadowBlur = width === 1.6 ? 9 : 0;
		const breadth = width * variants[index].width;
		ctx.fillRect(-length, -breadth / 2, length, breadth);
	}
	ctx.shadowBlur = 0;
}
function render(canvas: HTMLCanvasElement, index: number) {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	ctx.clearRect(0, 0, 480, 330);
	ctx.save();
	ctx.translate(320, 165);
	ctx.scale(2.4, 2.4);
	ctx.translate(-ship.pos.x, -ship.pos.y);
	ctx.fillStyle = "#596077";
	const x0 = Math.floor(ship.pos.x / 40) * 40;
	const y0 = Math.floor(ship.pos.y / 40) * 40;
	for (let x = x0 - 120; x <= x0 + 100; x += 40)
		for (let y = y0 - 80; y <= y0 + 80; y += 40) ctx.fillRect(x, y, 0.45, 0.45);
	plumes[index].draw(ctx, undefined, (context, size) =>
		paint(context, size, index),
	);
	drawBuild(
		ctx,
		variants[index].build,
		ship.pos.x,
		ship.pos.y,
		ship.rotation,
		BUILD_FLIGHT_SCALE,
	);
	ctx.restore();
}
onMount(() => {
	for (let i = 0; i < 45; i++) advance();
	let last = performance.now(),
		carry = 0,
		frame = 0;
	function loop(now: number) {
		if (playing) {
			carry += Math.min(0.1, (now - last) / 1000);
			while (carry >= STEP) {
				advance();
				carry -= STEP;
			}
		} else carry = 0;
		last = now;
		render(lightCanvas, 0);
		render(heavyCanvas, 1);
		frame = requestAnimationFrame(loop);
	}
	frame = requestAnimationFrame(loop);
	const blur = () => {
		playing = false;
	};
	window.addEventListener("blur", blur);
	return () => {
		cancelAnimationFrame(frame);
		window.removeEventListener("blur", blur);
	};
});
</script>
<section class="comparison" aria-label={label}>
	<div class="views">
		<figure>
			<figcaption>Light ion · accepted beam</figcaption>
			<canvas
				bind:this={lightCanvas}
				width="480"
				height="330"
				aria-label="Light ion engines and their narrow fading streams on a Fighter"
			></canvas>
		</figure>
		<figure>
			<figcaption>Heavy ion · accepted proportions</figcaption>
			<canvas
				bind:this={heavyCanvas}
				width="480"
				height="330"
				aria-label="Heavy ion engines and their longer broader fading streams on a Fighter"
			></canvas>
		</figure>
	</div>
	<p>
		{released || ticks >= 315
			? "Off · marks fading"
			: ticks >= 240 && ticks < 285
				? "Turning · one side engine"
				: "On · emitting beam marks"}
	</p>
	<div class="controls">
		<button
			type="button"
			class="btn btn-primary"
			onclick={() => {
				if (ticks >= 420) reset();
				playing = !playing;
			}}
		>
			{playing ? "Pause" : "Play"}
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				reset();
				playing = true;
			}}
		>
			Replay
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			disabled={released || ticks >= 315}
			onclick={() => {
				released = true;
				playing = true;
			}}
		>
			Release both
		</button>
	</div>
	<p class="caption">
		Same motion, output and scale as 02.3: forward thrust, a turn at four
		seconds, then release at 5.25 seconds.
	</p>
</section>
<style>
.comparison {
	border: var(--flight-border);
	padding: var(--spacing-md);
}
.views {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--spacing-md);
}
figure {
	margin: 0;
	min-width: 0;
}
figcaption {
	color: var(--color-acid-lime);
	font: var(--font-small) var(--font-flight);
}
canvas {
	display: block;
	width: 100%;
	height: auto;
}
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
}
.caption {
	color: var(--color-text-dim);
	margin-top: var(--spacing-md);
}
@media (max-width: 700px) {
	.views {
		grid-template-columns: 1fr;
	}
}
</style>
