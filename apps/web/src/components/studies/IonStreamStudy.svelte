<script lang="ts">
import { EnginePlume, PlumeProportionsSchema, Vec2 } from "@void-drift/core";
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
import { onMount, untrack } from "svelte";
import "@void-drift/core/styles/buttons.css";

let {
	label = "Ion stream comparison",
	linear = false,
	fx = false,
}: { label?: string; linear?: boolean; fx?: boolean } = $props();
// Each preserved example has a fixed loadout for its lifetime.
const hasAft = untrack(() => fx);
const baseBuild = defaultLoadout("balanced");
const build = LoadoutSchema.parse({
	...baseBuild,
	side: "ion",
	aft: baseBuild.aft.map((part, index) =>
		hasAft && index === 0 ? "ion" : part,
	),
});
const stats = buildStats(build);
const narrow = PlumeProportionsSchema.parse({ length: 1, width: 0.24 });
const residue = PlumeProportionsSchema.parse({
	length: 0.55,
	width: 0.07,
	opacity: 0.08,
});
let currentCanvas: HTMLCanvasElement;
let ionCanvas: HTMLCanvasElement;
let playing = $state(false);
let slow = $state(false);
let released = $state(false);
let elapsed = $state(0);
let speed = $state(0);
let output = $state(0);
let power = $state(stats.capacity);
let phase = $state("Ready");
function fixture() {
	return {
		ship: {
			pos: new Vec2(0, 0),
			vel: new Vec2(0, 0),
			acc: new Vec2(0, 0),
			rotation: 0,
			radius: 16,
		},
		plume: new EnginePlume(),
		emitters: buildPlumeEmitters(build).map((emitter) => ({
			...emitter,
			style: "default" as const,
		})),
		timers: {} as Record<string, number>,
		ticks: 0,
	};
}
let trial = $state.raw(fixture());
function reset() {
	trial = fixture();
	released = false;
	elapsed = speed = output = 0;
	power = stats.capacity;
	phase = "Ready";
}
function advance() {
	if (trial.ticks >= 420) {
		playing = false;
		return;
	}
	const time = trial.ticks * STEP;
	const firing = !released && time < 5.25;
	const turning = time >= 4 && time < 4.75;
	const input = {
		leftThruster: firing,
		rightThruster: firing && !turning,
		fire: false,
	};
	const available = Math.max(0, power - 3 * STEP);
	const requested = (buildDrain(build, input) - 3) * STEP;
	const spent = Math.min(available, requested);
	const fraction = requested > 0 ? spent / requested : 0;
	power = available - spent;
	let delivered = { left: 0, right: 0, aft: [] as number[] };
	for (let i = 0; i < 4; i++) {
		delivered = applyBuildEngines(
			trial.ship,
			build,
			input,
			STEP / 4,
			fraction > 0,
			trial.timers,
			fraction,
		);
		trial.ship.pos.x += (trial.ship.vel.x * STEP) / 4;
		trial.ship.pos.y += (trial.ship.vel.y * STEP) / 4;
	}
	trial.emitters[0].output = delivered.left * fraction;
	trial.emitters[1].output = delivered.right * fraction;
	if (hasAft) trial.emitters[2].output = delivered.aft[0] * fraction;
	trial.plume.stepMounted(STEP, trial.ship, trial.emitters);
	trial.ticks++;
	elapsed = trial.ticks * STEP;
	speed = trial.ship.vel.mag();
	output =
		Math.max(delivered.left, delivered.right, ...delivered.aft) * fraction;
	phase = firing
		? turning
			? "One engine · turning"
			: hasAft
				? "Side pair + aft · accelerating"
				: "Paired thrust · accelerating"
		: "Off · exhaust fading, ship coasting";
	if (trial.ticks === 420) {
		phase = "Coasting · sequence complete";
		playing = false;
	}
}
function render(canvas: HTMLCanvasElement, compressed: boolean) {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	ctx.clearRect(0, 0, 480, 330);
	ctx.save();
	ctx.translate(fx ? 320 : 285, 165);
	const zoom = fx ? 2.4 : 3.2;
	ctx.scale(zoom, zoom);
	ctx.translate(-trial.ship.pos.x, -trial.ship.pos.y);
	// Sparse world-space reference points reveal motion under the following camera.
	ctx.fillStyle = "#596077";
	const x0 = Math.floor(trial.ship.pos.x / 40) * 40;
	const y0 = Math.floor(trial.ship.pos.y / 40) * 40;
	for (let x = x0 - 120; x <= x0 + 100; x += 40)
		for (let y = y0 - 80; y <= y0 + 80; y += 40) ctx.fillRect(x, y, 0.45, 0.45);
	if (fx && compressed) {
		trial.plume.draw(ctx, undefined, (context, size) =>
			paintBeam(context, 48 * size),
		);
	} else if ((linear && compressed) || fx) {
		trial.plume.draw(ctx, residue);
		drawBeam(ctx);
	} else trial.plume.draw(ctx, compressed || linear ? narrow : undefined);
	drawBuild(
		ctx,
		build,
		trial.ship.pos.x,
		trial.ship.pos.y,
		trial.ship.rotation,
		BUILD_FLIGHT_SCALE,
	);
	ctx.restore();
}
/** Study-only attached light surface; the shared plume supplies drifting residue. */
function drawBeam(ctx: CanvasRenderingContext2D) {
	const ship = trial.ship;
	const cos = Math.cos(ship.rotation),
		sin = Math.sin(ship.rotation);
	for (const emitter of trial.emitters) {
		if (emitter.output <= 0) continue;
		const length = 48 * Math.sqrt(emitter.output);
		ctx.save();
		ctx.translate(
			ship.pos.x + emitter.x * cos - emitter.y * sin,
			ship.pos.y + emitter.x * sin + emitter.y * cos,
		);
		ctx.rotate(ship.rotation + emitter.angle);
		paintBeam(ctx, length);
		ctx.restore();
	}
}
/** Filled mark used identically for attached and emitted examples. */
function paintBeam(ctx: CanvasRenderingContext2D, length: number) {
	if (fx) {
		// All layers fade along the axis; the core stays parallel-sided.
		for (const [width, color, alpha] of [
			[6, "19,174,191", 0.12],
			[3, "112,255,226", 0.3],
			[1.6, "112,255,226", 1],
			[0.6, "234,255,249", 1],
		] as const) {
			const fade = ctx.createLinearGradient(-length, 0, 0, 0);
			fade.addColorStop(0, `rgba(${color},0)`);
			fade.addColorStop(0.3, `rgba(${color},${alpha * 0.2})`);
			fade.addColorStop(0.75, `rgba(${color},${alpha})`);
			fade.addColorStop(1, `rgba(${color},${alpha})`);
			ctx.fillStyle = fade;
			ctx.shadowColor = "#25e9d2";
			ctx.shadowBlur = width === 1.6 ? 9 : 0;
			ctx.fillRect(-length, -width / 2, length, width);
		}
		ctx.shadowBlur = 0;
		return;
	}
	// Parallel sides and a small rounded end retain a beam silhouette.
	const halo = ctx.createLinearGradient(0, -3, 0, 3);
	halo.addColorStop(0, "#1754b000");
	halo.addColorStop(0.35, "#13aebf44");
	halo.addColorStop(0.5, "#70ffe2aa");
	halo.addColorStop(0.65, "#13aebf44");
	halo.addColorStop(1, "#1754b000");
	ctx.fillStyle = halo;
	ctx.beginPath();
	ctx.roundRect(-length - 1, -3, length + 1, 6, 3);
	ctx.fill();
	ctx.shadowColor = "#25e9d2";
	ctx.shadowBlur = 9;
	ctx.fillStyle = "#70ffe2";
	ctx.beginPath();
	ctx.roundRect(-length, -0.8, length, 1.6, 0.8);
	ctx.fill();
	ctx.shadowBlur = 0;
	ctx.fillStyle = "#eafff9";
	ctx.beginPath();
	ctx.roundRect(-length + 0.4, -0.3, length - 0.4, 0.6, 0.3);
	ctx.fill();
}

onMount(() => {
	// Open on an inspectable firing moment; playback always starts deliberately.
	for (let i = 0; i < 45; i++) advance();
	let last = performance.now(),
		carry = 0,
		request = 0;
	function frame(now: number) {
		if (playing) {
			carry += Math.min((now - last) / 1000, 0.1) * (slow ? 0.25 : 1);
			while (carry >= STEP) {
				advance();
				carry -= STEP;
			}
		} else carry = 0;
		last = now;
		render(currentCanvas, false);
		render(ionCanvas, true);
		request = requestAnimationFrame(frame);
	}
	request = requestAnimationFrame(frame);
	const blur = () => {
		playing = false;
	};
	window.addEventListener("blur", blur);
	return () => {
		cancelAnimationFrame(request);
		window.removeEventListener("blur", blur);
	};
});
</script>

<section class="experiment" aria-label={label}>
	<div class="views">
		<figure>
			<figcaption>
				{fx
					? "02.2 · attached beam + faint wake"
					: linear
						? "02.1 · compressed plume"
						: "Shared plume · current proportions"}
			</figcaption>
			<canvas
				bind:this={currentCanvas}
				width="480"
				height="330"
				aria-label={fx
					? "Attached beam comparison reference"
					: linear
						? "Earlier compressed plume on a moving Fighter"
						: "Current broad surfaces on a moving ion-equipped Fighter"}
			></canvas>
		</figure>
		<figure>
			<figcaption>
				{fx
					? "02.3 · beam marks in the shared FX system"
					: linear
						? "02.2 · straight luminous beam"
						: "Ion candidate · compressed surfaces"}
			</figcaption>
			<canvas
				bind:this={ionCanvas}
				width="480"
				height="330"
				aria-label={fx
					? "Entire ion effect emitted and faded in world space"
					: linear
						? "Straight luminous ion beam on the same moving Fighter"
						: "Narrow ion stream candidate on the same moving Fighter"}
			></canvas>
		</figure>
	</div>
	<p class="readout">
		{phase}
		· {elapsed.toFixed(2)} s<br>Speed {speed.toFixed(0)} / 500 · strongest
		engine output {(output * 100).toFixed(0)}% · energy {power.toFixed(0)}
	</p>
	<div class="controls">
		<button
			class="btn btn-primary"
			type="button"
			onclick={() => {
				if (trial.ticks >= 420) reset();
				playing = !playing;
			}}
		>
			{playing ? "Pause" : "Play"}
		</button>
		<button
			class="btn btn-ghost"
			type="button"
			onclick={() => {
				reset();
				playing = true;
			}}
		>
			Replay from rest
		</button>
		<button
			class="btn btn-ghost"
			type="button"
			onclick={() => {
				released = true;
			}}
			disabled={released || elapsed >= 5.25}
		>
			Release now
		</button>
		<button
			class="btn btn-ghost"
			type="button"
			onclick={() => {
				playing = false;
				advance();
			}}
		>
			Step frame
		</button>
		<label><input type="checkbox" bind:checked={slow}> Quarter speed</label>
	</div>
	<p class="caption">
		4 seconds of {hasAft ? "side-pair and aft thrust" : "paired thrust"}, a
		brief turn, paired thrust {hasAft ? "with aft " : ""}again, then release at
		5.25 seconds. The camera follows position without rotating. Both views are
		enlarged {fx ? "2.4" : "3.2"}×.
	</p>
</section>
<style>
.experiment {
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
	line-height: 1.5;
}
canvas {
	display: block;
	width: 100%;
	height: auto;
}
.controls {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--spacing-sm);
}
label {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
	min-height: 44px;
}
.readout {
	font: var(--font-small) var(--font-flight);
	margin-block: var(--spacing-md);
}
.caption {
	color: var(--color-text-dim);
	margin-top: var(--spacing-md);
	max-width: 70ch;
}
@media (max-width: 700px) {
	.views {
		grid-template-columns: 1fr;
	}
}
</style>
