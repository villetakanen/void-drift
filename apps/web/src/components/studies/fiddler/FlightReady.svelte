<script lang="ts">
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import { drawBuild, starterLoadout } from "@void-drift/mode-a";
import { onMount } from "svelte";
import Toggle from "../../inputs/Toggle.svelte";

let { label = "Accepted Fiddler" }: { label?: string } = $props();
let view = $state("Plan");
let canvas: HTMLCanvasElement;
let fonts = $state(false);
const build = starterLoadout("fiddler");
onMount(() => {
	loadCanvasFonts().then(() => {
		fonts = true;
	});
});
$effect(() => {
	void fonts;
	if (!canvas) return;
	const dpr = window.devicePixelRatio || 1;
	canvas.width = 340 * dpr;
	canvas.height = 500 * dpr;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	ctx.scale(dpr, dpr);
	drawBuild(
		ctx,
		build,
		170,
		250,
		-Math.PI / 2,
		3.25,
		"hull-4",
		view === "Plan"
			? { dark: COLOR.void, lime: COLOR.selected, ivory: COLOR.text }
			: undefined,
	);
});
</script>

<div class="flight-ready">
	<Toggle
		label={`${label} view`}
		options={["Plan", "Fitted"]}
		bind:value={view}
	/>
	<canvas
		bind:this={canvas}
		aria-label="Flight-ready Fiddler with nine slots; centre weapon or support mount selected"
	></canvas>
	<p>187 hull mass · 9 slots · Wasp-size black glass</p>
	<a class="btn btn-filled" href="/hangar?chassis=fiddler"
		>Fit and fly Fiddler</a
	>
	<p>
		Four Light ions, two Potential Wells in the lower pincer slots, and one
		Gravity coil below the centre slot. The two forward + slots start empty.
	</p>
</div>

<style>
.flight-ready {
	display: grid;
	justify-items: center;
	gap: var(--spacing-md);
	margin-block: var(--spacing-lg);
}
canvas {
	width: min(100%, 340px);
	height: auto;
	aspect-ratio: 340 / 500;
	background: var(--color-void);
}
p {
	margin: 0;
	max-width: 48ch;
	text-align: center;
}
</style>
