<script lang="ts">
import { FxSurface } from "@void-drift/core";
import {
	BUILD_FLIGHT_SCALE,
	drawBuild,
	SALVAGE,
	type SalvageBody,
	SalvageSystem,
	Simulation,
	starterLoadout,
	stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { createDraftPainter } from "../derelict-draft-two/renderer";

let {
	label = "Two, five and eight physical splinters with staged shedding and energy ejection",
}: { label?: string } = $props();
let canvas: HTMLCanvasElement;
let time = $state(0.7);
let playing = $state(false);
let render = () => {};
const scale = 110 / 140;
type Point = { x: number; y: number };
// Uneven fracture sites follow the narrow hulls, rather than a rectangular cut grid.
const sites = [
	[
		{ x: 87, y: 132 },
		{ x: 113, y: 170 },
	],
	[
		{ x: 89, y: 96 },
		{ x: 87, y: 155 },
		{ x: 88, y: 210 },
		{ x: 111, y: 121 },
		{ x: 115, y: 191 },
	],
	[
		{ x: 89, y: 91 },
		{ x: 90, y: 122 },
		{ x: 85, y: 168 },
		{ x: 88, y: 211 },
		{ x: 110, y: 96 },
		{ x: 113, y: 142 },
		{ x: 117, y: 178 },
		{ x: 110, y: 205 },
	],
];
function polygon(site: Point, all: Point[]) {
	let points: Point[] = [
		{ x: 72, y: 75 },
		{ x: 132, y: 75 },
		{ x: 132, y: 225 },
		{ x: 72, y: 225 },
	];
	for (const other of all) {
		if (other === site) continue;
		const dx = other.x - site.x,
			dy = other.y - site.y;
		const edge = (other.x ** 2 + other.y ** 2 - site.x ** 2 - site.y ** 2) / 2;
		const next: Point[] = [];
		for (let i = 0; i < points.length; i++) {
			const a = points[i],
				b = points[(i + 1) % points.length];
			const da = a.x * dx + a.y * dy - edge,
				db = b.x * dx + b.y * dy - edge;
			if (da <= 0) next.push(a);
			if (da <= 0 !== db <= 0) {
				const t = da / (da - db);
				next.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
			}
		}
		points = next;
	}
	return `M${points.map((p) => `${p.x},${p.y}`).join("L")}Z`;
}
const variantsPieces = sites.map((all, col) =>
	all.map((p, i) => ({
		...p,
		path: polygon(p, all),
		release:
			col === 0
				? 1
				: i === 0
					? 0.25
					: col === 2 && i === 4
						? 0.45
						: i === 2
							? 0.65
							: 1,
		vx: (p.x < 101 ? -1 : 1) * (i % 2 === 0 ? 27 : 19),
		vy: (p.y - 150) * 0.3,
	})),
);
onMount(() => {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const painter = createDraftPainter();
	const build = starterLoadout("wasp");
	const paths = variantsPieces.map((pieces) =>
		pieces.map((p) => new Path2D(p.path)),
	);
	function frames(pieces: (typeof variantsPieces)[number]) {
		const sim = new Simulation({
			...stockSettings("wasp"),
			loadout: build,
			mode: "practice",
			seed: 2026,
		});
		sim.ship.pos.set(100, 100);
		const system = new SalvageSystem(build, 2026);
		system.nextPass = Infinity;
		system.weapons.length = 0;
		const initial = pieces.map(
			(p, i): SalvageBody => ({
				id: i + 1,
				group: 1,
				kind: "fragment",
				x: 600 + (p.x - 101) * scale,
				y: 540 + (p.y - 150) * scale,
				previousX: 0,
				previousY: 0,
				vx: p.vx,
				vy: p.vy,
				radius: SALVAGE.fragment.radius,
				hull: SALVAGE.fragment.hull,
				life: SALVAGE.fragment.life,
				rotation: 0,
			}),
		);
		initial.push({
			id: pieces.length + 1,
			group: 1,
			kind: "cell",
			x: 600 + (100.05 - 101) * scale,
			y: 540 + (154.15 - 150) * scale,
			previousX: 0,
			previousY: 0,
			vx: 0,
			vy: -45,
			radius: SALVAGE.cell.radius,
			hull: 1,
			life: SALVAGE.cell.life,
			rotation: 0,
		});
		const result = [initial.map((b) => ({ ...b }))];
		for (let tick = 1; tick <= 120; tick++) {
			initial.forEach((body, i) => {
				const release = i === pieces.length ? 1 : pieces[i].release;
				if (tick === Math.round(release * 60) + 1)
					system.bodies.push({ ...body });
			});
			system.step(
				1 / 60,
				sim.ship,
				sim.star,
				sim.state.resources,
				100,
				100,
				100,
				false,
			);
			result.push(
				initial.map((b) => ({
					...(system.bodies.find((active) => active.id === b.id) ?? b),
				})),
			);
		}
		return result;
	}
	const variants = variantsPieces.map(frames);
	const scratch = document.createElement("canvas");
	scratch.width = 1080;
	scratch.height = 500;
	const light = scratch.getContext("2d");
	const fx = new FxSurface();
	const position = (
		target: CanvasRenderingContext2D,
		column: number,
		x: number,
		y: number,
	) => {
		target.translate(
			column * 360 + 180 + (x - 600) * 1.6,
			260 + (y - 540) * 1.6,
		);
	};
	const core = (
		target: CanvasRenderingContext2D,
		column: number,
		tick: number,
	) => {
		const cell = variants[column][tick][variantsPieces[column].length];
		position(target, column, cell.x, cell.y);
		target.scale(scale * 1.6, scale * 1.6);
		target.translate(-100.05, -154.15);
	};
	render = () => {
		if (!light) return;
		canvas.width = 1080;
		canvas.height = 500;
		const tick = Math.round(time * 60);
		for (let col = 0; col < 3; col++) {
			drawBuild(
				ctx,
				build,
				col * 360 + 40,
				50,
				-Math.PI / 2,
				BUILD_FLIGHT_SCALE * 1.6,
			);
			for (let i = 0; i < variantsPieces[col].length; i++) {
				const body = variants[col][tick][i];
				const piece = variantsPieces[col][i];
				ctx.save();
				position(ctx, col, body.x, body.y);
				ctx.rotate(body.rotation);
				ctx.scale(scale * 1.6, scale * 1.6);
				ctx.translate(-piece.x, -piece.y);
				ctx.clip(paths[col][i]);
				painter.hull(ctx);
				ctx.restore();
			}

			ctx.save();
			core(ctx, col, tick);
			painter.core(ctx, time);
			ctx.restore();
		}
		fx.clear();
		for (let n = -30; n <= tick; n++) {
			fx.draw(light, (n + 31) / 60, (target, pass) => {
				for (let col = 0; col < 3; col++) {
					target.save();
					core(target, col, Math.max(0, n));
					painter.light(target, pass, Math.max(0, n) / 60);
					target.restore();
				}
			});
		}
		fx.draw(ctx, (tick + 31) / 60, () => {});
		for (let col = 0; col < 3; col++) {
			ctx.save();
			core(ctx, col, tick);
			painter.aperture(ctx, time);
			ctx.restore();
		}
	};
	render();
	let previous = performance.now();
	let raf = 0;
	const animate = (now: number) => {
		if (playing) {
			time = Math.min(2.0, time + Math.min((now - previous) / 1000, 0.05));
			if (time >= 2.0) playing = false;
		}
		previous = now;
		raf = requestAnimationFrame(animate);
	};
	raf = requestAnimationFrame(animate);
	return () => cancelAnimationFrame(raf);
});
$effect(() => {
	void time;
	render();
});
</script>
<div class="controls">
	<button
		class="btn"
		type="button"
		onclick={() => {
			if (time >= 2.0) time = 0;
			playing = !playing;
		}}
	>
		{playing ? "Pause" : "Play rupture"}
	</button>
	<button
		class="btn"
		type="button"
		onclick={() => {
			playing = false;
			time = 0;
		}}
	>
		Intact / reset
	</button>
	<label
		>Damage sequence · {time.toFixed(2)} s
		<input
			aria-label="Damage sequence time"
			type="range"
			min="0"
			max="2.0"
			step="0.01"
			bind:value={time}
			oninput={() => (playing = false)}
		></label
	>
</div>
<div class="headings">
	<strong>2 · Major hull remnants</strong
	><strong>5 · Tips and hull sections</strong
	><strong>8 · Progressive splintering</strong>
</div>
<p class="phase">
	{time < 0.25
		? "Intact"
		: time < 1
			? "Early shedding · energy still contained"
			: "Containment lost · energy ejecting"}
	· energy release at 1.00 s
</p>
<div class="controls">
	{#each [
		{ t: 0, label: "Intact" },
		{ t: 0.7, label: "Early shedding" },
		{ t: 1.15, label: "Release" },
		{ t: 2, label: "Separated" },
	] as mark}
		<button
			class="btn"
			type="button"
			onclick={() => {
				playing = false;
				time = mark.t;
			}}
		>
			{mark.label}
		</button>
	{/each}
</div>
<canvas bind:this={canvas} aria-label={label}></canvas>
<style>
.controls {
	display: flex;
	align-items: center;
	gap: var(--spacing-lg);
	margin-block: var(--spacing-lg);
	font-family: var(--font-family-ui);
}
label {
	display: grid;
	gap: var(--spacing-sm);
}
input {
	width: 260px;
	accent-color: var(--color-action);
}
.headings {
	display: grid;
	grid-template-columns: repeat(3, 360px);
	font-family: var(--font-family-ui);
}
canvas {
	display: block;
	width: 1080px;
	height: 500px;
	max-width: none;
	background: var(--color-void);
}
</style>
