<script lang="ts">
// Frozen: the 02.8 comparison, drawing the frozen 02.8 path tool.
import { onMount } from "svelte";
import { calculate, InstrumentConfig } from "./lab-instrument-config";
import OptionToggle from "./OptionToggle.svelte";
import PathTool028 from "./PathTool028.svelte";

let { label = "Path tool edge and elevation" }: { label?: string } = $props();

// The tool is 672 of the instrument's 1440 × 900 logical pixels: one 50%
// column. It is shown at the size the instrument would give it in this
// window, so on the iPad it is the iPad's column.
const SCREEN_W = 1440;
const SCREEN_H = 900;
const W = 672;
const H = 24 + W;

const COLORS = ["#5ce5e7", "#ffbd69", "#ff7aa8"];
const fighter = (aft: [string | null, string | null]) => ({
	version: 2,
	chassis: "balanced",
	side: "ion",
	stabilizers: true,
	hull: [null, null],
	aft,
});
// The 02.7 document, on B1, with the marker at 7 s.
const doc = InstrumentConfig.parse({
	version: 1,
	vehicles: [
		{ label: "Ion aft", loadout: fighter(["ion", "ion"]) },
		{ label: "Plasma aft", loadout: fighter(["plasma", "plasma"]) },
		{
			label: "Plasma aft, more thrust",
			loadout: fighter(["plasma", "plasma"]),
			changes: { plasma: { thrust: 46000 } },
		},
	],
});
const series = doc.vehicles.map((v, i) => ({
	label: v.label,
	color: COLORS[i],
	samples: calculate(v, doc.burn),
}));
const tick = 7 * 60;

let scale = $state(0.8);
function measure() {
	scale = Math.min(innerWidth / SCREEN_W, innerHeight / SCREEN_H);
}
onMount(() => {
	measure();
	addEventListener("resize", measure);
	return () => removeEventListener("resize", measure);
});

// Accepted: the plot's edge is a black shadow. Study variable now: the
// material of elevation 1 (the example area) and elevation 2 (the plot).
const materials = [
	{ id: "tint", label: "Tinted void" },
	{ id: "plate", label: "Lit plate" },
	{ id: "glass", label: "Glass over space" },
	{ id: "display", label: "Instrument display" },
] as const;
let chosen = $state<string>(materials[0].label);
const material = $derived(
	materials.find((m) => m.label === chosen)?.id ?? materials[0].id,
);
</script>

<section class={`area ${material}`} aria-label={label}>
	<div class="control">
		<span class="caption">Elevation material</span>
		<OptionToggle
			hover="tint"
			label="Elevation material"
			options={materials.map((m) => m.label)}
			bind:value={chosen}
		/>
	</div>
	<div class="host" style={`width:${W * scale}px;height:${H * scale}px`}>
		<div class="scaled" style={`transform:scale(${scale})`}>
			<PathTool028 {series} {tick} {scale} edge="shadow-black" />
		</div>
	</div>
</section>

<style>
/* Study-local elevation materials. Every one keeps the background's hue,
   290; the plot's edge is the accepted black shadow. */
.area {
	display: grid;
	justify-items: center;
	gap: var(--spacing-lg);
	margin-block: var(--spacing-lg);
	padding: var(--spacing-xl) var(--spacing-lg);
	background: var(--_elev-1);
	box-shadow: var(--_elev-1-inset, none);
}
/* A: the lch steps, kept as the reference. */
.tint {
	--_elev-1: lch(5.5% 10 290);
	--_elev-2: lch(11% 15 290);
}
/* B: machined plates lit from the upper left, as in the engine studies. */
.plate {
	--_elev-1: linear-gradient(160deg, lch(8% 10 290), lch(4% 8 290));
	--_elev-1-inset: inset 1px 1px 0 lch(16% 10 290);
	--_elev-2: linear-gradient(160deg, lch(15% 14 290), lch(8% 12 290));
	--_elev-2-inset: inset 1px 1px 0 lch(28% 14 290);
}
/* C: tinted glass over a faint starfield; the plot is denser, blurred glass. */
.glass {
	--_elev-1:
		linear-gradient(lch(6% 10 290 / 0.72), lch(6% 10 290 / 0.72)),
		radial-gradient(1px 1px at 23px 41px, #fffff0, transparent),
		radial-gradient(1px 1px at 117px 13px, #fffff0b0, transparent),
		radial-gradient(1.5px 1.5px at 171px 97px, #fffff0, transparent),
		radial-gradient(1px 1px at 61px 149px, #fffff090, transparent),
		radial-gradient(1px 1px at 197px 181px, #fffff0c0, transparent),
		var(--color-void);
	--_elev-2: lch(12% 15 290 / 0.62);
	--_elev-2-filter: blur(6px);
	--_elev-2-inset: inset 0 1px 0 lch(30% 15 290 / 0.6);
	background-size:
		auto,
		211px 211px,
		211px 211px,
		211px 211px,
		211px 211px,
		211px 211px,
		auto;
}
/* D: a flat console holding a display with 4px scanlines and a vignette. */
.display {
	--_elev-1: lch(5.5% 10 290);
	--_elev-2:
		radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.4)),
		repeating-linear-gradient(
			0deg,
			lch(11% 15 290) 0 2px,
			lch(9% 15 290) 2px 4px
		);
	--_elev-2-inset: inset 0 0 0 1px lch(4% 8 290);
}
.control {
	display: grid;
	justify-items: center;
	gap: var(--spacing-sm);
}
.caption {
	color: var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
}
.host {
	position: relative;
}
.scaled {
	transform-origin: top left;
	color: var(--color-text);
}
</style>
