<script lang="ts">
import { paintIonBeam } from "@void-drift/core";
import { onMount } from "svelte";

let { label = "FX overlap comparison" }: { label?: string } = $props();
let host: HTMLElement;
let overlap = $state(0);
let opacity = $state(0.65);
let reverse = $state(false);
let redraw = () => {};
const modes = [
	{
		mode: "lighter",
		title: "A / Add",
		note: "Light accumulates; repeated overlap can reach white.",
	},
	{
		mode: "screen",
		title: "B / Screen",
		note: "Lightens toward white with gentler accumulation.",
	},
	{
		mode: "source-over",
		title: "C / Alpha blend",
		note: "The later effect covers the earlier in proportion to its opacity.",
	},
	{
		mode: "color-burn",
		title: "D / Burn",
		note: "Darkens the overlap; tests a disruptive field rather than emitted light.",
	},
	{
		mode: "source-over",
		title: "E / Override",
		note: "The later mark replaces covered pixels; soft edges are deliberately removed.",
	},
] as const;

onMount(() => {
	const engine = document.createElement("canvas");
	const coil = document.createElement("canvas");
	engine.width = coil.width = 360;
	engine.height = coil.height = 200;
	redraw = () => {
		const e = engine.getContext("2d");
		const c = coil.getContext("2d");
		if (!e || !c) return;
		e.clearRect(0, 0, 360, 200);
		e.save();
		e.translate(290, 100);
		e.scale(4, 4);
		paintIonBeam(e, 1, "ion-light");
		e.restore();
		c.clearRect(0, 0, 360, 200);
		c.strokeStyle = "#d477ff";
		c.lineWidth = 5;
		c.beginPath();
		c.ellipse(210 + overlap, 100, 35, 65, -0.45, 0, Math.PI * 2);
		c.stroke();
		c.lineWidth = 15;
		c.globalAlpha = 0.15;
		c.stroke();
		c.globalAlpha = 1;
		for (const [index, canvas] of Array.from(
			host.querySelectorAll("canvas"),
		).entries()) {
			const ctx = canvas.getContext("2d");
			if (!ctx) continue;
			ctx.clearRect(0, 0, 360, 200);
			const first = reverse ? coil : engine;
			const last = reverse ? engine : coil;
			ctx.globalAlpha = reverse ? opacity : 1;
			ctx.drawImage(first, 0, 0);
			ctx.globalAlpha = reverse ? 1 : opacity;
			ctx.globalCompositeOperation = modes[index].mode;
			if (index === 4) {
				const source = last.getContext("2d")?.getImageData(0, 0, 360, 200);
				const target = ctx.getImageData(0, 0, 360, 200);
				if (source) {
					for (let p = 0; p < source.data.length; p += 4) {
						if (source.data[p + 3] < 13) continue;
						target.data[p] = source.data[p];
						target.data[p + 1] = source.data[p + 1];
						target.data[p + 2] = source.data[p + 2];
						target.data[p + 3] = 255;
					}
					ctx.putImageData(target, 0, 0);
				}
			} else ctx.drawImage(last, 0, 0);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
		}
	};
	redraw();
});
$effect(() => {
	overlap;
	opacity;
	reverse;
	redraw();
});
</script>

<div class="controls">
	<label
		>Coil position
		<input type="range" min="-130" max="100" bind:value={overlap}></label
	>
	<label
		>Coil opacity
		<input
			type="range"
			min="0.1"
			max="1"
			step="0.05"
			bind:value={opacity}
		></label
	>
	<label
		><input type="checkbox" bind:checked={reverse}>
		Engine drawn last</label
	>
</div>
<section class="comparisons" aria-label={label} bind:this={host}>
	{#each modes as item}
		<figure>
			<figcaption>
				<strong>{item.title}</strong><span>{item.note}</span>
			</figcaption>
			<canvas
				width="360"
				height="200"
				aria-label={item.title +
					": cyan engine beam crossed by a violet coil fixture"}
			></canvas>
		</figure>
	{/each}
</section>
<style>
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	margin-block: 24px;
}
label {
	display: flex;
	align-items: center;
	gap: 8px;
}
.comparisons {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
	gap: 24px;
}
figure {
	margin: 0;
	border: 1px solid var(--color-border);
	padding: 12px;
}
figcaption {
	min-height: 100px;
}
strong,
span {
	display: block;
}
span {
	color: var(--color-text-muted);
	font-size: 14px;
	margin-top: 8px;
}
canvas {
	display: block;
	width: 100%;
	height: auto;
	background: var(--color-void);
}
</style>
