<script lang="ts">
import { buildMounts, defaultLoadout, drawBuild } from "@void-drift/mode-a";
import { onMount } from "svelte";

let root: HTMLDivElement;
const roles = [
	"Storage / separated surfaces",
	"Solar / collector leaves",
	"Gravity / field winding",
	"Repair / service head",
];
const captions = [
	"Three substantial working surfaces, separated by insulation and joined to an exposed bus.",
	"Two thick collector leaves supported by a central distributor; exposed hinges carry their weight.",
	"An open winding around a substantial core, with broad mounting shoes and visible clearance.",
	"A feed reservoir beside a faceted service head, joined by a rigid supply line and articulated tool.",
];
const treatments = [
	"A / Pale alloy, dark working surfaces",
	"B / Graphite alloy, yellow working surfaces",
];
type Point = readonly [number, number];
function device(c: CanvasRenderingContext2D, role: number, treatment: number) {
	const metal = treatment
		? ["#424e58", "#85949c", "#202c39"]
		: ["#8ba3b1", "#d0e0e4", "#435b70"];
	const work = treatment
		? ["#c5c469", "#f0e8a0", "#72783b"]
		: ["#3e5b68", "#819ba4", "#243844"];
	function face(points: readonly Point[], color: string) {
		c.fillStyle = color;
		c.beginPath();
		points.forEach(([x, y], i) => {
			if (i) c.lineTo(x, y);
			else c.moveTo(x, y);
		});
		c.closePath();
		c.fill();
	}
	function slab(
		x: number,
		y: number,
		w: number,
		h: number,
		z: number,
		colors = metal,
	) {
		const b = Math.min(w, h) * 0.18;
		const p: Point[] = [
			[x + b, y],
			[x + w - b, y],
			[x + w, y + b],
			[x + w, y + h - b],
			[x + w - b, y + h],
			[x + b, y + h],
			[x, y + h - b],
			[x, y + b],
		];
		const top = p.map(([a, b]): Point => [a - 0.5 * z, b - z]);
		face(p, colors[2]);
		for (let i = 0; i < p.length; i++) {
			const j = (i + 1) % p.length;
			face([p[i], p[j], top[j], top[i]], i > 3 ? colors[1] : colors[2]);
		}
		face(top, colors[0]);
		face(
			[
				top[0],
				top[1],
				[top[1][0] - 0.4, top[1][1] + 0.6],
				[top[0][0] + 0.3, top[0][1] + 0.6],
			],
			colors[1],
		);
	}
	// Two common substantial mounting shoes, not an enclosing case.
	slab(-7, -6, 4, 13, 1);
	slab(3, -6, 4, 13, 1);
	if (role === 0) {
		slab(-1, -7, 2, 15, 2, work);
		for (const y of [5, 0, -5]) {
			slab(-6, y, 12, 3.8, 2.5);
			slab(-4.5, y + 0.7, 9, 2, 2.6, work);
		}
		slab(6, -6, 2, 13, 2.2);
		for (const y of [-4, 1, 6]) slab(4, y, 4, 1, 2.8, work);
	}
	if (role === 1) {
		slab(-2, -7, 4, 15, 2.5);
		for (const x of [-10, 3]) {
			slab(x, -6, 7, 13, 1.5);
			slab(x + 0.7, -5.3, 5.5, 11.6, 1.7, work);
			for (const y of [-2, 2]) slab(x + 0.8, y, 5.3, 0.65, 1.9);
			slab(x < 0 ? -4 : 1, -2, 3, 4, 2.5);
		}
		slab(-1, -5, 2, 3, 3, work);
	}
	if (role === 2) {
		slab(-2.5, -7, 5, 15, 3, work);
		for (const y of [6, 1, -4]) {
			// Open octagonal winding, with top and side facets; gaps expose the core.
			const pts: Point[] = [
				[-7, y - 2],
				[-4, y - 4],
				[4, y - 4],
				[7, y - 2],
				[7, y + 1],
				[4, y + 3],
				[-4, y + 3],
				[-7, y + 1],
			];
			const inner = pts.map(([x, yy]): Point => [x * 0.6, y + (yy - y) * 0.48]);
			for (let i = 0; i < 8; i++) {
				let j = (i + 1) % 8;
				face(
					[
						[pts[i][0], pts[i][1] + 1.8],
						[pts[j][0], pts[j][1] + 1.8],
						pts[j],
						pts[i],
					],
					metal[2],
				);
				face([pts[i], pts[j], inner[j], inner[i]], i < 3 ? metal[1] : metal[0]);
			}
		}
		slab(-6, 7, 12, 2, 2);
	}
	if (role === 3) {
		slab(-7, -5, 5, 12, 3);
		slab(-6, -4, 3, 8, 3.2, work);
		slab(1, -5, 6, 8, 3.5);
		slab(2, -4, 4, 4, 3.7, work);
		slab(-3, 3, 7, 2, 2.5);
		slab(3, 3, 3, 5, 3);
		c.save();
		c.translate(4, -6);
		c.rotate(-0.5);
		slab(-1, -5, 2.8, 6, 2.5);
		slab(-2, -6, 5, 2, 2.5);
		slab(-2, -8, 1.2, 3, 2.5, work);
		slab(1.8, -8, 1.2, 3, 2.5, work);
		c.restore();
	}
}
onMount(() => {
	const build = defaultLoadout("fighter");
	const mount = buildMounts(build).find((m) => m.key === "hull-0");
	if (!mount) return;
	const mx = mount.x,
		my = mount.y;
	root.querySelectorAll("canvas").forEach((canvas, i) => {
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const c: CanvasRenderingContext2D = ctx;
		c.scale(2, 2);
		const role = i % 4,
			treatment = Math.floor(i / 4);
		c.save();
		c.translate(120, 96);
		c.scale(7, 7);
		device(c, role, treatment);
		c.restore();
		function ship(x: number, y: number, s: number, fitted: boolean) {
			drawBuild(c, build, x, y, -Math.PI / 2, s);
			if (fitted) {
				c.save();
				c.translate(x, y);
				c.rotate(-Math.PI / 2);
				c.scale(s, s);
				c.translate(mx, my);
				c.rotate(Math.PI / 2);
				device(c, role, treatment);
				c.restore();
			}
		}
		ship(120, 310, 2.6, true);
		ship(70, 407, 0.65, false);
		ship(170, 407, 0.65, true);
	});
});
</script>
<div bind:this={root}>
	{#each treatments as treatment}
		<h4>{treatment}</h4>
		<div class="family">
			{#each roles as role, i}
				<figure>
					<figcaption>{role}</figcaption>
					<canvas
						width="480"
						height="880"
						aria-label={`${treatment}: ${role}, enlarged machinery, fitted Lance, and flight-size comparison`}
					></canvas>
					<p>{captions[i]}</p>
				</figure>
			{/each}
		</div>
	{/each}
</div>
<style>
h4 {
	margin-block: 32px 16px;
	font-size: 20px;
}
.family {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 10px;
}
figure {
	margin: 0;
	background: var(--color-void-light);
	border: var(--flight-border);
	padding: 8px;
}
figcaption {
	font-size: 13px;
	min-height: 36px;
	color: var(--color-text);
}
canvas {
	display: block;
	width: 240px;

	height: auto;
	margin: auto;
}
figure p {
	font-size: 13px;
	line-height: 1.5;
	color: var(--color-text-muted);
	margin: 8px;
}
@media (max-width: 900px) {
	.family {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
@media (max-width: 500px) {
	.family {
		grid-template-columns: 1fr;
	}
}
</style>
