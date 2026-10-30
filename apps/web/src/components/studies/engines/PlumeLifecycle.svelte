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

let { label = "Plume lifecycle comparison" }: { label?: string } = $props();
let straightCanvas: HTMLCanvasElement;
let turningCanvas: HTMLCanvasElement;
let playing = $state(false);
let firing = $state(true);
let glow = $state(true);
let slow = $state(false);
type Mark = {
	x: number;
	y: number;
	angle: number;
	age: number;
	vx: number;
	vy: number;
};
function trial(turning: boolean) {
	const simulation = new Simulation(stockSettings("balanced"));
	simulation.ship.pos.set(960, 540);
	simulation.ship.rotation = 0;
	return { simulation, turning, marks: [] as Mark[], ticks: 0 };
}
let trials = [trial(false), trial(true)];
function reset() {
	trials = [trial(false), trial(true)];
	firing = true;
}
function advance(t: ReturnType<typeof trial>) {
	const ship = t.simulation.ship;
	ship.pos.set(960, 540);
	for (let n = 0; n < 4; n++)
		updateShip(
			ship,
			{
				leftThruster: firing,
				rightThruster: firing && !t.turning,
				fire: false,
			},
			STEP / 4,
			1920,
			1080,
			undefined,
			[],
			undefined,
			undefined,
			t.simulation.settings.profile,
			{ drag: 0, speedLimit: null },
			"inverse-square",
			GRAVITY_FLIGHT.engineSpeedScale,
		);
	const dx = ship.pos.x - 960,
		dy = ship.pos.y - 540;
	for (const m of t.marks) {
		m.x += m.vx * STEP - dx;
		m.y += m.vy * STEP - dy;
		m.age += STEP;
	}
	t.marks = t.marks.filter((m) => m.age < 0.65);
	if (firing)
		for (const side of [-1, 1]) {
			if (t.turning && side === 1) continue;
			const angle = ship.rotation - (side * Math.PI) / 15;
			t.marks.unshift({
				x: -8 * Math.cos(ship.rotation) - side * 5 * Math.sin(ship.rotation),
				y: -8 * Math.sin(ship.rotation) + side * 5 * Math.cos(ship.rotation),
				angle,
				age: 0,
				vx: ship.vel.x * 0.8 - 45 * Math.cos(angle),
				vy: ship.vel.y * 0.8 - 45 * Math.sin(angle),
			});
		}
	t.ticks++;
}
function surface(
	ctx: CanvasRenderingContext2D,
	length: number,
	width: number,
	alpha: number,
	luminous: boolean,
) {
	ctx.save();
	ctx.globalAlpha = alpha;
	// A softly bounded filled plume, including a rounded and transparent leading edge.
	ctx.translate(-length * 0.42, 0);
	ctx.scale(length * 0.58, width);
	const gradient = ctx.createRadialGradient(0.3, 0, 0, 0, 0, 1);
	gradient.addColorStop(0, "#eafff9");
	gradient.addColorStop(0.22, "#70ffe2");
	gradient.addColorStop(0.6, "#13aebf88");
	gradient.addColorStop(1, "#1754b000");
	ctx.fillStyle = gradient;
	if (luminous) {
		ctx.shadowColor = "#25e9d2";
		ctx.shadowBlur = 12;
	}
	ctx.beginPath();
	ctx.ellipse(0, 0, 1, 1, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function render(canvas: HTMLCanvasElement, t: ReturnType<typeof trial>) {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	ctx.clearRect(0, 0, 480, 360);
	ctx.save();
	ctx.translate(285, 180);
	ctx.scale(1.65, 1.65);
	// Every visible flame is an emitted surface with the same lifetime.
	// Releasing an engine only stops emission: nothing already visible is removed.
	for (let i = t.marks.length - 1; i >= 0; i--) {
		const m = t.marks[i];
		const age = m.age / 0.65;
		ctx.save();
		ctx.translate(m.x, m.y);
		ctx.rotate(m.angle);
		surface(ctx, 43 + age * 22, 9 + age * 5, 0.26 * (1 - age) ** 2, glow);
		ctx.restore();
	}
	drawShip(ctx, {
		x: 0,
		y: 0,
		rotation: t.simulation.ship.rotation,
		color: "#d9fff2",
		variant: "balanced",
	});
	ctx.restore();
}
onMount(() => {
	playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
	let last = performance.now(),
		carry = 0,
		request = 0;
	function animate(now: number) {
		if (playing) {
			carry += Math.min((now - last) / 1000, 0.1) * (slow ? 0.25 : 1);
			while (carry >= STEP) {
				for (const t of trials) advance(t);
				carry -= STEP;
			}
		} else carry = 0;
		last = now;
		render(straightCanvas, trials[0]);
		render(turningCanvas, trials[1]);
		request = requestAnimationFrame(animate);
	}
	request = requestAnimationFrame(animate);
	return () => cancelAnimationFrame(request);
});
</script>

<section class="comparison" aria-label={label}>
	<div class="views">
		<div>
			<h3>Straight · {firing ? "both engines" : "coasting"}</h3>
			<canvas
				bind:this={straightCanvas}
				width="480"
				height="360"
				aria-label="Continuous straight flight and fading plume surfaces"
			></canvas>
		</div>
		<div>
			<h3>Turning · {firing ? "one engine" : "coasting"}</h3>
			<canvas
				bind:this={turningCanvas}
				width="480"
				height="360"
				aria-label="Continuous turning flight and fading plume surfaces"
			></canvas>
		</div>
	</div>
	<div class="controls">
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				playing = !playing;
			}}
		>
			{playing ? "Pause comparison" : "Play comparison"}
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				firing = !firing;
			}}
		>
			{firing ? "Release engines" : "Fire engines"}
		</button>
		<button type="button" class="btn btn-ghost" onclick={reset}>
			Reset comparison
		</button>
		<label><input type="checkbox" bind:checked={glow}> Glow</label>
		<label><input type="checkbox" bind:checked={slow}> Quarter speed</label>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				playing = false;
				for (const t of trials) advance(t);
			}}
		>
			Step one frame
		</button>
	</div>
	<p>
		Continuous flight, shared clock and scale. Release both trials to watch the
		whole plumes drift and fade. Quarter speed makes the shutdown easier to
		inspect.
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
h3 {
	color: var(--color-acid-lime);
	font: var(--font-small) var(--font-flight);
}
canvas {
	width: 100%;
	height: auto;
	display: block;
}
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-sm);
	align-items: center;
}
label {
	display: flex;
	gap: var(--spacing-sm);
	align-items: center;
	min-height: 44px;
}
p {
	color: var(--color-text-dim);
	margin-top: var(--spacing-md);
}
@media (max-width: 520px) {
	.views {
		grid-template-columns: 1fr;
	}
}
</style>
