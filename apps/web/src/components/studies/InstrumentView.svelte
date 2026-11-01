<script lang="ts">
import "./instrument-display.css";
import BrandSlider from "./BrandSlider.svelte";
import { BURN_IDS, BURNS, type BurnId } from "./burns";
import InputStrip from "./InputStrip.svelte";
import { exampleTick, SCREEN, seriesFor } from "./instrument-example";
import { TOTAL_TICKS } from "./movement-bench";
import OptionToggle from "./OptionToggle.svelte";
import PathTool from "./PathTool.svelte";
import TraceGraph from "./TraceGraph.svelte";

// Study-local (02.11): the composed view. One 1440 × 900 logical screen on the
// console: the path tool with the burn chooser under it in the left column,
// the three graphs with the time slider under them in the right. The host
// decides the scale.
let { label = "Lab instrument, composed view" }: { label?: string } = $props();

const PAD = 32;
const GAP = 32;
const COL = (SCREEN.w - 2 * PAD - GAP) / 2;
// Each column: a 672px square block, a 24px gap, then a 44px control. Both
// columns are this tall, centred on the screen on the 4px grid.
const BLOCK = COL;
const CONTROL = 44;
const CONTROL_GAP = 24;
// Below both columns, one row across the screen names the vehicles.
const LEGEND = 24;
const LEGEND_GAP = 24;
const HEIGHT = BLOCK + CONTROL_GAP + CONTROL + LEGEND_GAP + LEGEND;
const TOP = Math.floor((SCREEN.h - HEIGHT) / 2 / 4) * 4;
const GRAPH = 208;
const GRAPH_GAP = (BLOCK - 3 * GRAPH) / 2;
// The graph's plot margins (TraceGraph: 52px left, 12px right) less half the
// 16px knob, so the slider's knob runs along the graphs' time axis.
const SLIDER_INSET = { left: 52 - 8, right: 12 - 8 };
const measures = ["speed", "acceleration", "turn"] as const;

let burn = $state<BurnId>("course");
let tick = $state(exampleTick);
const series = $derived(seriesFor(burn));
const seconds = $derived(tick / 60);

let hostW = $state(SCREEN.w);
let hostH = $state(SCREEN.h);
const scale = $derived(Math.min(hostW / SCREEN.w, hostH / SCREEN.h));
</script>

<figure
	class="host instrument-display"
	bind:clientWidth={hostW}
	bind:clientHeight={hostH}
	aria-label={label}
>
	<div
		class="screen"
		style={`width:${SCREEN.w}px;height:${SCREEN.h}px;transform:translate(-50%,-50%) scale(${scale})`}
	>
		<div class="slot" style={`left:${PAD}px;top:${TOP}px`}>
			<PathTool {series} {tick} {scale} edge="shadow-black" />
		</div>
		<div
			class="slot chooser"
			style={`left:${PAD}px;top:${TOP + BLOCK + CONTROL_GAP}px;width:${COL}px`}
		>
			<OptionToggle
				compact
				hover="tint"
				label="Burn"
				options={BURN_IDS.map((id) => BURNS[id].label)}
				bind:value={
					() => BURNS[burn].label,
					(l) => (burn = BURN_IDS.find((id) => BURNS[id].label === l) ?? burn)
				}
			/>
			<div class="lanes"><InputStrip {burn} {tick} tone="white-soft" /></div>
		</div>

		{#each measures as m, i}
			<div
				class="slot"
				style={`left:${PAD + COL + GAP}px;top:${TOP + i * (GRAPH + GRAPH_GAP)}px`}
			>
				<TraceGraph measure={m} {series} {tick} width={COL} height={GRAPH} />
			</div>
		{/each}
		<div
			class="slot"
			style={`left:${PAD + COL + GAP}px;top:${TOP + BLOCK + CONTROL_GAP}px;width:${COL}px;padding:0 ${SLIDER_INSET.right}px 0 ${SLIDER_INSET.left}px`}
		>
			<BrandSlider
				compact
				label="Time"
				unit="s"
				digits={2}
				min={0}
				max={TOTAL_TICKS / 60}
				step={1 / 60}
				bind:value={() => seconds, (v) => (tick = Math.round(v * 60))}
			/>
			<!-- Visible label in the graphs' value-label column; start and end
			     under the track's ends, which sit on the graphs' 0 s and 14 s. -->
			<span class="slider-label" aria-hidden="true">Time</span>
			<span class="slider-end start" style={`left:${SLIDER_INSET.left + 8}px`}
				>0</span
			>
			<span class="slider-end end" style={`right:${SLIDER_INSET.right + 8}px`}>
				{TOTAL_TICKS / 60}
				s
			</span>
		</div>
		<ul
			class="slot legend"
			style={`left:${PAD}px;top:${TOP + BLOCK + CONTROL_GAP + CONTROL + LEGEND_GAP}px;width:${SCREEN.w - 2 * PAD}px;height:${LEGEND}px`}
			aria-label="Vehicles"
		>
			{#each series as s}
				<li><i style={`background:${s.color}`}></i>{s.label}</li>
			{/each}
		</ul>
	</div>
</figure>

<style>
/* The console, elevation 1, fills the whole host, including any bands the
   screen's 16:10 shape leaves in other window shapes. */
.host {
	position: relative;
	margin: 0;
	width: 100%;
	height: 100%;
	aspect-ratio: 1440 / 900;
	overflow: hidden;
	background: var(--_elev-1);
}
.screen {
	position: absolute;
	left: 50%;
	top: 50%;
	transform-origin: center;
	color: var(--color-text);
}
.slot {
	position: absolute;
	box-sizing: border-box;
}
/* Two to six vehicles: a short line in each one's colour, then its name. */
.legend {
	display: flex;
	align-items: center;
	gap: 32px;
	margin: 0;
	padding: 0;
	list-style: none;
	font: 15px var(--font-flight);
	white-space: nowrap;
}
.legend i {
	display: inline-block;
	width: 24px;
	height: 3px;
	margin-right: 8px;
	vertical-align: middle;
}
.slider-label {
	position: absolute;
	top: 50%;
	right: calc(100% - 44px);
	transform: translateY(-50%);
	color: var(--color-text-dim);
	font: 13px var(--font-flight);
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
.slider-end {
	position: absolute;
	bottom: -2px;
	color: var(--color-text-dim);
	font: 13px var(--font-flight);
}
.slider-end.start {
	transform: translateX(-50%);
}
.slider-end.end {
	transform: translateX(50%);
}
/* The accepted burn row (02.6): the compact switcher, then the selected
   burn's lanes across the rest of the column. The gap leaves room for the
   lanes' L and R labels. */
.chooser {
	display: flex;
	align-items: center;
	gap: 32px;
}
.lanes {
	flex: 1;
}
</style>
