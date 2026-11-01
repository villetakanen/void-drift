<script lang="ts">
import { onMount } from "svelte";
import "./instrument-display.css";
import { exampleSeries, exampleTick, SCREEN } from "./instrument-example";
import PathTool from "./PathTool.svelte";

let {
	label = "Path tool with its numbers on the display",
}: { label?: string } = $props();

// The tool is 672 of the instrument's 1440 × 900 logical pixels: one 50%
// column, shown at the size the instrument would give it in this window.
const W = 672;
const H = W;
const series = exampleSeries;
const tick = exampleTick;

let scale = $state(0.8);
function measure() {
	scale = Math.min(innerWidth / SCREEN.w, innerHeight / SCREEN.h);
}
onMount(() => {
	measure();
	addEventListener("resize", measure);
	return () => removeEventListener("resize", measure);
});
</script>

<section class="area instrument-display" aria-label={label}>
	<div class="host" style={`width:${W * scale}px;height:${H * scale}px`}>
		<div class="scaled" style={`transform:scale(${scale})`}>
			<PathTool {series} {tick} {scale} edge="shadow-black" />
		</div>
	</div>
</section>

<style>
/* The console: elevation 1 from the shared display material. */
.area {
	display: grid;
	justify-items: center;
	gap: var(--spacing-lg);
	margin-block: var(--spacing-lg);
	padding: var(--spacing-xl) var(--spacing-lg);
	background: var(--_elev-1);
	box-shadow: var(--_elev-1-inset, none);
}
.host {
	position: relative;
}
.scaled {
	transform-origin: top left;
	color: var(--color-text);
}
</style>
