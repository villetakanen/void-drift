<script lang="ts">
import { loadCanvasFonts } from "@void-drift/core";

let {
	width,
	height,
	draw,
}: {
	width: number;
	height: number;
	draw: (ctx: CanvasRenderingContext2D) => void;
} = $props();

let canvas: HTMLCanvasElement;
let fontsLoaded = $state(false);
loadCanvasFonts().then(() => {
	fontsLoaded = true;
});

$effect(() => {
	// Read so the drawing repeats once webfonts load; canvas text does not load them.
	void fontsLoaded;
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	// Reset transform and clear
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, width, height);

	// Invoke draw callback
	draw(ctx);
});
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	style:width="{width}px"
	style:height="{height}px"
></canvas>

<style>
canvas {
	background: #000;
	border: 1px solid #333;
	image-rendering: pixelated;
}
</style>
