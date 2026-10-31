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

let { label = "Continuous tail comparison" }: { label?: string } = $props();
let straightCanvas: HTMLCanvasElement;
let turningCanvas: HTMLCanvasElement;
let playing = $state(false);
let firing = $state(true);
let glow = $state(true);
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
	t.marks = t.marks.filter((m) => m.age < 1.2);
	if (firing) {
		const side = t.turning ? -1 : 0;
		const angle = ship.rotation - (side * Math.PI) / 15;
		t.marks.unshift({
			x: -14 * Math.cos(ship.rotation) - side * 5 * Math.sin(ship.rotation),
			y: -14 * Math.sin(ship.rotation) + side * 5 * Math.cos(ship.rotation),
			angle,
			age: 0,
			vx: -70 * Math.cos(angle),
			vy: -70 * Math.sin(angle),
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

function render(canvas: HTMLCanvasElement, t: ReturnType<typeof trial>) {
	const ctx = canvas?.getContext("2d");
	if (!ctx) return;
	ctx.clearRect(0, 0, 480, 360);
	ctx.save();
	ctx.translate(285, 180);
	ctx.scale(1.65, 1.65);
	// Connected filled cross-sections, anchored in emission history rather than stamped plumes.
	for (const layer of [1.65, 1, 0.36]) {
		for (let i = t.marks.length - 2; i >= 0; i--) {
			const a = t.marks[i],
				b = t.marks[i + 1];
			const fade = (m: Mark) =>
				Math.min(
					1,
					Math.max(m.age / 1.2, Math.max(0, Math.hypot(m.x, m.y) - 14) / 145),
				);
			const width = (m: Mark) =>
				(t.turning ? 6 : 10) *
				Math.sin(Math.PI * (0.25 + 0.75 * fade(m))) *
				layer;
			const wa = width(a),
				wb = width(b);
			const normal = (index: number, w: number) => {
				const before = t.marks[Math.max(0, index - 1)];
				const after = t.marks[Math.min(t.marks.length - 1, index + 1)];
				const dx = before.x - after.x,
					dy = before.y - after.y;
				const length = Math.hypot(dx, dy) || 1;
				return { x: (-dy / length) * w, y: (dx / length) * w };
			};
			const na = normal(i, wa),
				nb = normal(i + 1, wb);
			const ax = na.x,
				ay = na.y,
				bx = nb.x,
				by = nb.y;
			const color = (m: Mark) => {
				const alpha =
					(1 - fade(m)) ** 1.6 * (layer > 1 ? 0.12 : layer < 1 ? 0.55 : 0.48);
				return layer < 1
					? `rgba(174,255,234,${alpha})`
					: `rgba(26,213,193,${alpha})`;
			};
			const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
			gradient.addColorStop(0, color(a));
			gradient.addColorStop(1, color(b));
			ctx.fillStyle = gradient;
			ctx.shadowColor = "#25e9d2";
			ctx.shadowBlur = glow && layer > 1 ? 12 : 0;
			ctx.beginPath();
			ctx.moveTo(a.x + ax, a.y + ay);
			ctx.lineTo(b.x + bx, b.y + by);
			ctx.lineTo(b.x - bx, b.y - by);
			ctx.lineTo(a.x - ax, a.y - ay);
			ctx.closePath();
			ctx.fill();
		}
	}
	ctx.shadowBlur = 0;
	if (firing)
		for (const side of [-1, 1]) {
			if (t.turning && side === 1) continue;
			ctx.save();
			ctx.rotate(t.simulation.ship.rotation);
			ctx.translate(-8, side * 5);
			ctx.rotate((-side * Math.PI) / 15);
			const pulse = Math.sin(t.ticks * 0.16) * 3;
			surface(ctx, 43 + pulse, 9, 0.9, glow);
			surface(ctx, 17 + pulse * 0.3, 3, 1, false);
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
			carry += Math.min((now - last) / 1000, 0.1);
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
				aria-label="Continuous straight flight and connected tail"
			></canvas>
		</div>
		<div>
			<h3>Turning · {firing ? "one engine" : "coasting"}</h3>
			<canvas
				bind:this={turningCanvas}
				width="480"
				height="360"
				aria-label="Continuous turning flight and connected tail"
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
	</div>
	<p>
		Continuous flight, shared clock and scale. Release both trials to watch the
		tails detach and fade.
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
