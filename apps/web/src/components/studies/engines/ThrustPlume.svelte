<script lang="ts">
import { CONFIG, drawShip, updateShip } from "@void-drift/core";
import { Simulation, STEP, stockSettings } from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

let { label = "Thrust and plume size" }: { label?: string } = $props();
let straightCanvas: HTMLCanvasElement;
let left = $state(true);
let right = $state(true);
let launchSpeed = $state(0);
let speed = $state(0);
let delivered = $state(0);
let playing = $state(false);

let glow = $state(true);
let slow = $state(false);
type Mark = {
	x: number;
	y: number;
	angle: number;
	age: number;
	vx: number;
	vy: number;
	size: number;
};
function trial(turning: boolean) {
	const simulation = new Simulation(stockSettings("balanced"));
	simulation.ship.pos.set(960, 540);
	simulation.ship.rotation = 0;
	simulation.ship.vel.set(launchSpeed, 0);
	return { simulation, turning, marks: [] as Mark[], ticks: 0 };
}
let trials = [trial(false)];
function reset() {
	trials = [trial(false)];
	delivered = 0;
	speed = launchSpeed;
}
function advance(t: ReturnType<typeof trial>) {
	const ship = t.simulation.ship;
	ship.pos.set(960, 540);
	let impulse = 0;
	for (let n = 0; n < 4; n++) {
		const beforeX = ship.vel.x,
			beforeY = ship.vel.y;
		const profile = t.simulation.settings.profile;
		const active = Number(left) + Number(right);
		const direction =
			ship.rotation +
			((left === right ? 0 : left ? 1 : -1) *
				CONFIG.ROTATION_SPEED *
				profile.turnMultiplier *
				STEP) /
				4;
		const along =
			ship.vel.x * Math.cos(direction) + ship.vel.y * Math.sin(direction);
		// Study proposal: linear directional taper to zero at 750; no velocity clamp.
		const effectiveness = Math.max(0, 1 - Math.max(0, along) / 750);
		const proposed = ((profile.thrustMultiplier * active) / 2) * effectiveness;
		const available =
			Math.max(0, 750 - along) / ((CONFIG.THRUST_FORCE * STEP) / 4);
		updateShip(
			ship,
			{
				leftThruster: left,
				rightThruster: right,
				fire: false,
			},
			STEP / 4,
			1920,
			1080,
			undefined,
			[],
			undefined,
			undefined,
			{ ...profile, thrustMultiplier: Math.min(proposed, available) },
			{ drag: 0, speedLimit: null },
			"inverse-square",
			null,
		);
		impulse += Math.hypot(ship.vel.x - beforeX, ship.vel.y - beforeY);
	}
	const active = Number(left) + Number(right);
	delivered = active ? impulse / STEP / active : 0;
	speed = ship.vel.mag();
	const fraction =
		delivered /
		((CONFIG.THRUST_FORCE * t.simulation.settings.profile.thrustMultiplier) /
			2);

	const dx = ship.pos.x - 960,
		dy = ship.pos.y - 540;
	for (const m of t.marks) {
		m.x += m.vx * STEP - dx;
		m.y += m.vy * STEP - dy;
		m.age += STEP;
	}
	t.marks = t.marks.filter((m) => m.age < 0.65);
	for (const side of [-1, 1]) {
		if (!(side === -1 ? left : right) || fraction <= 0) continue;
		const angle = ship.rotation - (side * Math.PI) / 15;
		t.marks.unshift({
			x: -8 * Math.cos(ship.rotation) - side * 5 * Math.sin(ship.rotation),
			y: -8 * Math.sin(ship.rotation) + side * 5 * Math.cos(ship.rotation),
			angle,
			age: 0,
			size: Math.sqrt(Math.max(0, Math.min(1, fraction))),
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
	ctx.clearRect(0, 0, 800, 420);
	ctx.save();
	ctx.translate(490, 210);
	ctx.scale(1.65, 1.65);
	// Every visible flame is an emitted surface with the same lifetime.
	// Releasing an engine only stops emission: nothing already visible is removed.
	for (let i = t.marks.length - 1; i >= 0; i--) {
		const m = t.marks[i];
		const age = m.age / 0.65;
		ctx.save();
		ctx.translate(m.x, m.y);
		ctx.rotate(m.angle);
		surface(
			ctx,
			(43 + age * 22) * m.size,
			(9 + age * 5) * m.size,
			0.26 * (1 - age) ** 2,
			glow,
		);
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
		request = requestAnimationFrame(animate);
	}
	request = requestAnimationFrame(animate);
	return () => cancelAnimationFrame(request);
});
</script>

<section class="comparison" aria-label={label}>
	<canvas
		bind:this={straightCanvas}
		width="800"
		height="420"
		aria-label="Single ship with plumes sized by delivered thrust"
	></canvas>
	<div class="readouts">
		<span>Speed {speed.toFixed(0)} units/s</span>
		<span>Left {left ? (delivered / 2).toFixed(0) : 0}% thrust</span>
		<span>Right {right ? (delivered / 2).toFixed(0) : 0}% thrust</span>
		<span>Per active engine: Δv {(delivered * STEP).toFixed(2)} / tick</span>
	</div>
	<div class="controls">
		<button
			type="button"
			class="btn btn-ghost"
			aria-pressed={left}
			onclick={() => {
				left = !left;
			}}
		>
			Left engine {left ? "on" : "off"}
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			aria-pressed={right}
			onclick={() => {
				right = !right;
			}}
		>
			Right engine {right ? "on" : "off"}
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				left = false;
				right = false;
			}}
		>
			Release both
		</button>
		<button
			type="button"
			class="btn btn-ghost"
			onclick={() => {
				playing = !playing;
			}}
		>
			{playing ? "Pause" : "Play"}
		</button>
		<label
			>Starting speed
			<select bind:value={launchSpeed}>
				<option value={0}>Rest</option>
				<option value={600}>600 units/s</option>
				<option value={750}>750 units/s · cutoff</option>
				<option value={1200}>1200 units/s</option>
			</select></label
		>
		<button type="button" class="btn btn-ghost" onclick={reset}>
			Restart at chosen speed
		</button>
		<label><input type="checkbox" bind:checked={slow}> Quarter speed</label>
	</div>
	<p>
		Toggle either engine with touch or keyboard. Turning changes the direction
		of thrust; a small plume can grow again as the engine pushes across or
		against existing motion.
	</p>
</section>
<style>
.comparison {
	border: var(--flight-border);
	padding: var(--spacing-md);
}
.readouts {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-md);
	color: var(--color-acid-lime);
	margin-bottom: var(--spacing-md);
	font-family: var(--font-flight);
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
</style>
