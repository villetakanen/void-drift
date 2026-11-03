<script lang="ts">
import { buildMounts, defaultLoadout, drawBuild } from "@void-drift/mode-a";
import { onMount } from "svelte";

const functions = [
	"Energy storage",
	"Solar charger",
	"Gravity charger",
	"Automatic repair",
];
const families = ["A / Industrial banks", "B / Scientific assemblies"];
let root: HTMLDivElement;
function apparatus(
	c: CanvasRenderingContext2D,
	family: number,
	role: number,
	large = false,
) {
	const dark = "#46524d",
		mid = "#81917a",
		light = "#d6dd96";
	function block(x: number, y: number, w: number, h: number) {
		c.fillStyle = dark;
		c.fillRect(x, y, w, h);
		c.fillStyle = mid;
		c.fillRect(x, y - 0.8, w, h - 0.8);
		c.fillStyle = light;
		c.fillRect(x, y - 0.8, w, 0.65);
	}
	const n = large ? 4 : 3;
	// Shared structural feet and bearer, with exposed working assemblies above.
	block(-5, -3.5, 2, 7);
	block(3, -3.5, 2, 7);
	block(-4, -1, 8, 2);
	if (family === 0) {
		if (role === 0) for (let i = 0; i < n; i++) block(-4 + i * 2.5, -3, 1.6, 6);
		if (role === 1) {
			block(-5, -6, 10, 3.3);
			block(-5, 2.7, 10, 3.3);
			block(-1, -3, 2, 6);
		}
		if (role === 2) {
			block(-5, -5, 3, 10);
			block(2, -5, 3, 10);
			block(-2, -1.5, 4, 3);
		}
		if (role === 3) {
			block(-4, -3, 5, 6);
			block(1, -4, 3, 2);
			block(1, 2, 3, 2);
			block(4, -4, 2, 1.5);
			block(4, 2.5, 2, 1.5);
		}
	} else {
		if (role === 0)
			for (let i = 0; i < n; i++) {
				c.save();
				c.translate(-3 + i * 2.2, 0);
				c.rotate(-0.4);
				block(-0.6, -4, 1.3, 8);
				c.restore();
			}
		if (role === 1)
			for (const y of [-1, 1])
				for (let i = 0; i < n; i++) {
					c.save();
					c.translate(-3 + i * 2.5, y * 4);
					c.rotate(y * 0.3);
					block(-1, -2, 2, 4);
					c.restore();
				}
		if (role === 2) {
			for (let i = 0; i < 8; i++) {
				c.save();
				c.rotate((i * Math.PI) / 4);
				block(3.2, -1.5, 1.8, 3);
				c.restore();
			}
			block(-1, -1, 2, 2);
		}
		if (role === 3) {
			block(-3, -2, 3, 4);
			for (const y of [-1, 1]) {
				c.save();
				c.translate(0, y * 2);
				c.rotate(y * 0.6);
				block(0, -0.7, 4, 1.4);
				c.translate(4, 0);
				c.rotate(-y * 0.9);
				block(0, -0.6, 3, 1.2);
				c.restore();
			}
		}
	}
}
onMount(() => {
	const build = defaultLoadout("fighter");
	const mount = buildMounts(build).find((m) => m.key === "hull-0");
	if (!mount) return;
	const { x: mountX, y: mountY } = mount;
	root.querySelectorAll("canvas").forEach((canvas, i) => {
		const c = canvas.getContext("2d");
		if (!c) return;
		c.scale(2, 2);
		const family = Math.floor(i / 4),
			role = i % 4;
		function ship(y: number, scale: number) {
			if (!c) return;
			drawBuild(c, build, 105, y, -Math.PI / 2, scale);
			c.save();
			c.translate(105, y);
			c.rotate(-Math.PI / 2);
			c.scale(scale, scale);
			c.translate(mountX, mountY);
			apparatus(c, family, role);
			c.restore();
		}
		ship(48, 0.65);
		ship(190, 2.5);
		c.save();
		c.translate(65, 300);
		c.scale(4, 4);
		apparatus(c, family, role);
		c.restore();
		c.save();
		c.translate(155, 300);
		c.scale(4, 4);
		apparatus(c, family, role, true);
		c.restore();
	});
});
</script>
<div bind:this={root}>
	{#each families as family}
		<h4>{family}</h4>
		<p>
			{family.startsWith("A")
				? "Heavy bearers and repeated working banks: mass and serviceability carry the family."
				: "Shared precision supports and separated working elements: purposeful apparatus carries the family."}
		</p>
		<div class="family">
			{#each functions as role}
				<figure>
					<figcaption>{role}</figcaption>
					<canvas
						width="420"
						height="680"
						aria-label={`${family}, ${role}: flight size, enlarged ship, and two construction variants`}
					></canvas><small
						>0.65 flight · 2.5× ship<br>4× object · variant probe</small
					>
				</figure>
			{/each}
		</div>
	{/each}
</div>
<style>
.family {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
	gap: 12px;
}
figure {
	margin: 0;
	background: var(--color-surface);
	padding: 8px;
	text-align: center;
}
canvas {
	display: block;
	width: 210px;
	height: 340px;
	margin: auto;
}
figcaption {
	font-size: 14px;
}
small {
	color: var(--color-text-muted);
}
</style>
