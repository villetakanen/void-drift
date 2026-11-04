<script lang="ts">
import { type Snippet, untrack } from "svelte";
import {
	documentTracks,
	editDocument,
	FIELD_MEASURES,
	FLIGHT_MEASURES,
	InstrumentConfig,
	SECONDS,
	TICK_RATE,
	type Track,
	V2_BURN_IDS,
} from "../../../lib/instrument";
import RingSlider from "../../inputs/RingSlider.svelte";
import BurnRow from "./BurnRow.svelte";
import DocumentPanel from "./DocumentPanel.svelte";
import Legend from "./Legend.svelte";
import OverlayPane from "./OverlayPane.svelte";
import PathPane from "./PathPane.svelte";
import TimeGraph from "./TimeGraph.svelte";
import { GRAPH_MARGIN } from "./time-graph";

// The Lab instrument (study lab-instrument-2026-11-01): compares two to six
// vehicles from one configuration document. A 1440 × 900 logical screen on the
// console holds the path tool and burn row (left), the time graph three times
// and the time slider (right), and the legend below both. It scales to fill its
// container. The pane overlays it with the values under investigation.
let {
	config,
	label = "Lab instrument",
	pane,
}: {
	/** The configuration document; parsed here, so it may come from anywhere. */
	config: unknown;
	label?: string;
	/** Pane content; by default the values editor and the document. */
	pane?: Snippet<[InstrumentConfig]>;
} = $props();

// Layout, in logical pixels on the 4px grid.
const SCREEN = { w: 1440, h: 900 };
const PAD = 32;
const GAP = 32;
const COL = (SCREEN.w - 2 * PAD - GAP) / 2;
const BLOCK = COL;
const CONTROL = 44;
const CONTROL_GAP = 24;
const LEGEND = 24;
const LEGEND_GAP = 24;
const HEIGHT = BLOCK + CONTROL_GAP + CONTROL + LEGEND_GAP + LEGEND;
const TOP = Math.floor((SCREEN.h - HEIGHT) / 2 / 4) * 4;
const GRAPH = 208;
const GRAPH_GAP = (BLOCK - 3 * GRAPH) / 2;
const RIGHT = PAD + COL + GAP;
const CONTROL_TOP = TOP + BLOCK + CONTROL_GAP;
// The slider's knob (16px) runs along the graphs' time axis.
const SLIDER = { left: GRAPH_MARGIN.left - 8, right: GRAPH_MARGIN.right - 8 };

// The document is read once, as the starting point; edits happen in the pane.
const parsed = untrack(() => InstrumentConfig.safeParse(config));
const issues = parsed.success ? [] : parsed.error.issues;
let doc = $state(parsed.success ? parsed.data : null);
let tick = $state(7 * TICK_RATE);
const tracks = $derived.by((): Track[] =>
	doc ? documentTracks($state.snapshot(doc)) : [],
);
// Field mode: the bodies of the longest run, so moving planets cover the burn.
const bodies = $derived(
	tracks
		.map((t) => t.run)
		.filter((run) => run !== undefined)
		.sort((a, b) => b.samples.length - a.samples.length)[0]?.bodies ?? [],
);
function moveWell(index: number, x: number, y: number) {
	if (!doc) return;
	const result = editDocument($state.snapshot(doc), (draft) => {
		if (draft.version === 2 && draft.field?.wells[index])
			Object.assign(draft.field.wells[index], { x, y });
	});
	if (result.ok) doc = result.doc;
}
const measures = $derived(
	tracks.some((t) => t.run) ? FIELD_MEASURES : FLIGHT_MEASURES,
);

let hostW = $state(SCREEN.w);
let hostH = $state(SCREEN.h);
const scale = $derived(Math.min(hostW / SCREEN.w, hostH / SCREEN.h));
</script>

<figure
	class="host"
	bind:clientWidth={hostW}
	bind:clientHeight={hostH}
	aria-label={label}
>
	{#if doc}
		<div
			class="screen"
			style={`width:${SCREEN.w}px;height:${SCREEN.h}px;transform:translate(-50%,-50%) scale(${scale})`}
		>
			<div class="slot" style={`left:${PAD}px;top:${TOP}px`}>
				<PathPane
					{tracks}
					{bodies}
					{tick}
					{scale}
					size={BLOCK}
					onmovewell={moveWell}
				/>
			</div>
			<div
				class="slot"
				style={`left:${PAD}px;top:${CONTROL_TOP}px;width:${COL}px`}
			>
				<BurnRow
					bind:burn={doc.burn}
					{tick}
					ids={doc.version === 2 ? V2_BURN_IDS : undefined}
				/>
			</div>
			{#each measures as m, i}
				<div
					class="slot"
					style={`left:${RIGHT}px;top:${TOP + i * (GRAPH + GRAPH_GAP)}px`}
				>
					<TimeGraph measure={m} {tracks} {tick} width={COL} height={GRAPH} />
				</div>
			{/each}
			<div
				class="slot"
				style={`left:${RIGHT}px;top:${CONTROL_TOP}px;width:${COL}px;padding:0 ${SLIDER.right}px 0 ${SLIDER.left}px`}
			>
				<RingSlider
					compact
					label="Time"
					unit="s"
					digits={2}
					min={0}
					max={SECONDS}
					step={1 / TICK_RATE}
					bind:value={
						() => tick / TICK_RATE,
						(v) => (tick = Math.round(v * TICK_RATE))
					}
				/>
				<span class="slider-label" aria-hidden="true">Time</span>
				<span class="slider-end start" style={`left:${SLIDER.left + 8}px`}
					>0</span
				>
				<span class="slider-end end" style={`right:${SLIDER.right + 8}px`}>
					{SECONDS}
					s
				</span>
			</div>
			<div
				class="slot"
				style={`left:${PAD}px;top:${CONTROL_TOP + CONTROL + LEGEND_GAP}px;width:${SCREEN.w - 2 * PAD}px`}
			>
				<Legend {tracks} />
			</div>
		</div>

		<!-- Unscaled: the menu, backdrop and pane sit on the container. -->
		<OverlayPane>
			{#if pane}
				{@render pane(doc)}
			{:else}
				<DocumentPanel bind:config={doc} />
			{/if}
		</OverlayPane>
	{:else}
		<div class="invalid" role="alert">
			<h3>This configuration cannot be drawn</h3>
			<ul>
				{#each issues as issue}
					<li>{issue.path.join(".") || "document"}: {issue.message}</li>
				{/each}
			</ul>
		</div>
	{/if}
</figure>

<style>
/* The console, elevation 1, fills the container, including any bands the
   screen's 16:10 shape leaves in other container shapes. */
.host {
	position: relative;
	margin: 0;
	width: 100%;
	height: 100%;
	aspect-ratio: 1440 / 900;
	overflow: hidden;
	background: var(--color-elev-1);
	color: var(--color-text);
	font-family: var(--font-family-ui);
}
.screen {
	position: absolute;
	left: 50%;
	top: 50%;
	transform-origin: center;
}
.slot {
	position: absolute;
	box-sizing: border-box;
}
.slider-label {
	position: absolute;
	top: 50%;
	right: calc(100% - 44px);
	transform: translateY(-50%);
	color: var(--color-text-muted);
	font-size: 13px;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
.slider-end {
	position: absolute;
	bottom: -2px;
	color: var(--color-text-muted);
	font-size: 13px;
}
.slider-end.start {
	transform: translateX(-50%);
}
.slider-end.end {
	transform: translateX(50%);
}
h3 {
	margin: 0;
	font-size: 19px;
	font-weight: normal;
}
.invalid {
	padding: var(--spacing-lg);
	color: var(--color-caution-tape);
}
</style>
