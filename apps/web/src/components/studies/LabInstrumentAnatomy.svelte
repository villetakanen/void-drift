<script lang="ts">
import { type Snippet, tick as settled } from "svelte";
import BrandSlider from "./BrandSlider.svelte";
import { BURN_IDS, BURNS, type BurnId } from "./burns";
import { derive, fixtureVehicles, summarize } from "./lab-instrument";
import { TOTAL_TICKS } from "./movement-bench";
import OptionToggle from "./OptionToggle.svelte";
import {
	INSTRUMENT,
	niceCeil,
	type PathSeries,
	type TraceKey,
} from "./path-instrument";

/** One drawn vehicle: a calculated path plus a one-line configuration summary. */
export type InstrumentInput = {
	id: string;
	series: PathSeries;
	config: string;
};

const fixture: InstrumentInput[] = fixtureVehicles.map((v, i) => ({
	id: v.id,
	series: { ...v.series, label: `${v.source} #${i}` },
	config: `accel ${v.settings.acceleration} · ceiling ${v.settings.maxSpeed}`,
}));

let {
	label = "Lab instrument",
	vehicles: input = fixture,
	burn = $bindable(),
	editor,
}: {
	label?: string;
	vehicles?: InstrumentInput[];
	/** The input program; its switcher appears on the strip only when the host can recalculate. */
	burn?: BurnId;
	/** The pane's content: controls for the values under investigation. */
	editor?: Snippet;
} = $props();

// One logical screen, laptop-shaped; the host only decides the scale.
const SCREEN_W = 1440;
const SCREEN_H = 900;
// Two equal columns inside a 32px margin, 32px apart; no header or footer.
const PAD = 32;
const GAP = 32;
const COL = (SCREEN_W - 2 * PAD - GAP) / 2;
// Each diagram's title row sits above its panel.
const TITLE = 24;

// Left column: the plan view, in screen pixels.
const PLAN = { x: PAD, y: PAD + TITLE, w: COL, h: SCREEN_H - 2 * PAD - TITLE };
const DEFAULT_SCALE = 0.2;
const DEFAULT_GRID = 500;
const TICK = 16;

// Right column: traces, input lanes and time. Its 128px left gutter holds the
// axis labels and the burn switcher.
const TR_X = PAD + COL + GAP + 128;
const TR = {
	x: TR_X,
	w: SCREEN_W - PAD - TR_X,
	top: PAD + TITLE,
	h: 200,
	gap: 40,
};
// The slider's knob width; its travel is widened by this so the knob's
// centre runs exactly along the traces' time axis.
const KNOB = 16;
// Input lane height; two lanes and a 4px gap fill 28px under the traces.
const LANE = 12;
const traceKeys: TraceKey[] = ["speed", "acceleration", "turn"];
const inputY = TR.top + 3 * (TR.h + TR.gap);

const vehicles = $derived(
	input.map((v) => {
		const d = derive(v.series);
		return { ...v, d, summary: summarize(d) };
	}),
);

const strip = $derived.by(() => {
	let start = 0;
	return BURNS[burn ?? "course"].segments.map((seg) => {
		const out = { ...seg, start };
		start += seg.ticks;
		return out;
	});
});

let hostW = $state(SCREEN_W);
let hostH = $state(SCREEN_H);
let paneOpen = $state(false);
let tick = $state(252);
// Vehicles are shown unless switched off.
let hidden = $state<Record<string, boolean>>({});
let mode = $state<"fit" | "default">("fit");
let pan = $state({ x: PLAN.x + 40, y: PLAN.y + PLAN.h / 2 });
let dragging = $state(false);
let toggleEl: HTMLButtonElement;
let closeEl: HTMLButtonElement;
let paneEl: HTMLElement;

const scale = $derived(Math.min(hostW / SCREEN_W, hostH / SCREEN_H));
const seconds = $derived(tick / 60);
const shown = $derived(vehicles.filter((v) => !hidden[v.id]));

const fit = $derived.by(() => {
	const pts = shown.flatMap((v) => v.d.path);
	if (pts.length === 0) return { s: DEFAULT_SCALE, ox: pan.x, oy: pan.y };
	const xs = pts.map((p) => p[0]),
		ys = pts.map((p) => p[1]);
	const x0 = Math.min(...xs),
		x1 = Math.max(...xs),
		y0 = Math.min(...ys),
		y1 = Math.max(...ys);
	const m = 32;
	const s = Math.min(
		(PLAN.w - 2 * m) / Math.max(1, x1 - x0),
		(PLAN.h - 2 * m) / Math.max(1, y1 - y0),
	);
	return {
		s,
		ox: PLAN.x + (PLAN.w - (x1 - x0) * s) / 2 - x0 * s,
		oy: PLAN.y + (PLAN.h - (y1 - y0) * s) / 2 - y0 * s,
	};
});
const view = $derived(
	mode === "fit" ? fit : { s: DEFAULT_SCALE, ox: pan.x, oy: pan.y },
);
const grid = $derived(mode === "fit" ? niceCeil(100 / view.s) : DEFAULT_GRID);
const sx = (x: number) => view.ox + x * view.s;
const sy = (y: number) => view.oy + y * view.s;
function gridLines(o: number, from: number, extent: number) {
	const out: number[] = [];
	const start = Math.ceil((from - o) / view.s / grid) * grid;
	for (let v = start; o + v * view.s <= from + extent; v += grid) out.push(v);
	return out;
}
const gridX = $derived(gridLines(view.ox, PLAN.x, PLAN.w));
const gridY = $derived(gridLines(view.oy, PLAN.y, PLAN.h));

function traceY(key: TraceKey, i: number, v: number) {
	const r = INSTRUMENT.traces[key];
	const c = Math.max(r.min, Math.min(r.max, v));
	return (
		TR.top + i * (TR.h + TR.gap) + TR.h - ((c - r.min) / (r.max - r.min)) * TR.h
	);
}
const tx = (t: number) => TR.x + (t / TOTAL_TICKS) * TR.w;
function traceLine(key: TraceKey, i: number, values: number[]) {
	return values
		.map((v, t) => `${tx(t).toFixed(1)},${traceY(key, i, v).toFixed(1)}`)
		.join(" ");
}

function choose(next: "fit" | "default") {
	mode = next;
	if (next === "default") recenter();
}
function recenter() {
	pan = { x: PLAN.x + 40, y: PLAN.y + PLAN.h / 2 };
}
let last = { x: 0, y: 0 };
let scrubbing = $state(false);
// Pointer position in screen pixels, whatever the current scale.
function at(e: PointerEvent) {
	const box = (e.currentTarget as Element).getBoundingClientRect();
	return {
		x: (e.clientX - box.left) / scale,
		y: (e.clientY - box.top) / scale,
	};
}
function scrubTo(x: number) {
	const t = Math.round(((x - TR.x) / TR.w) * TOTAL_TICKS);
	tick = Math.max(0, Math.min(TOTAL_TICKS, t));
}
function down(e: PointerEvent) {
	const p = at(e);
	const inTraces =
		p.x >= TR.x &&
		p.x <= TR.x + TR.w &&
		p.y >= TR.top &&
		p.y <= inputY + 2 * LANE + 4;
	const inPlan =
		p.x >= PLAN.x &&
		p.x <= PLAN.x + PLAN.w &&
		p.y >= PLAN.y &&
		p.y <= PLAN.y + PLAN.h;
	if (inTraces) {
		scrubbing = true;
		scrubTo(p.x);
	} else if (inPlan && mode === "default") {
		dragging = true;
		last = { x: e.clientX, y: e.clientY };
	} else return;
	(e.currentTarget as Element).setPointerCapture(e.pointerId);
}
function move(e: PointerEvent) {
	if (scrubbing) scrubTo(at(e).x);
	if (!dragging) return;
	pan = {
		x: pan.x + (e.clientX - last.x) / scale,
		y: pan.y + (e.clientY - last.y) / scale,
	};
	last = { x: e.clientX, y: e.clientY };
}
function up() {
	dragging = false;
	scrubbing = false;
}
function setPane(open: boolean) {
	paneOpen = open;
	// Move focus with the corner: into the pane on open, back to the menu on close.
	if (open) settled().then(() => closeEl?.focus());
	else toggleEl?.focus();
}
function keydown(e: KeyboardEvent) {
	// Escape closes only the pane that holds focus.
	if (
		e.key === "Escape" &&
		paneOpen &&
		paneEl?.contains(document.activeElement)
	)
		setPane(false);
}
const fmt = (v: number, digits = 0) => v.toFixed(digits);
const paneId = `pane-${Math.random().toString(36).slice(2, 8)}`;
</script>

<svelte:window onkeydown={keydown} />

<figure
	class="host"
	bind:clientWidth={hostW}
	bind:clientHeight={hostH}
	aria-label={label}
>
	<div
		class="screen"
		style={`width:${SCREEN_W}px;height:${SCREEN_H}px;transform:translate(-50%,-50%) scale(${scale})`}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<svg
			class="views"
			class:pan={mode === "default"}
			class:dragging
			class:scrubbing
			viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
			width={SCREEN_W}
			height={SCREEN_H}
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
			role="img"
			aria-label="Plan view of every path, and speed, acceleration and turn acceleration against time"
		>
			<defs>
				<clipPath id={`${paneId}-plan`}>
					<rect x={PLAN.x} y={PLAN.y} width={PLAN.w} height={PLAN.h} />
				</clipPath>
			</defs>
			<text x={PLAN.x} y={PLAN.y - 8} class="label">
				Plan · paths
				<tspan class="dim-text">
					· {view.s.toFixed(3)} px/u · grid {grid} u
				</tspan>
			</text>
			<rect
				x={PLAN.x}
				y={PLAN.y}
				width={PLAN.w}
				height={PLAN.h}
				class="panel"
			/>
			<g clip-path={`url(#${paneId}-plan)`}>
				{#each gridX as g}
					<line
						x1={sx(g)}
						x2={sx(g)}
						y1={PLAN.y}
						y2={PLAN.y + PLAN.h}
						class="grid"
						class:axis={g === 0}
					/>
				{/each}
				{#each gridY as g}
					<line
						x1={PLAN.x}
						x2={PLAN.x + PLAN.w}
						y1={sy(g)}
						y2={sy(g)}
						class="grid"
						class:axis={g === 0}
					/>
				{/each}
				{#each shown as v}
					<polyline
						points={v.d.path
							.map((p) => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`)
							.join(" ")}
						fill="none"
						stroke={v.d.color}
						stroke-width="2"
					/>
					<circle
						cx={sx(v.d.path[0][0])}
						cy={sy(v.d.path[0][1])}
						r="4"
						fill={v.d.color}
					/>
					{@const s = v.series.samples[tick]}
					{@const sp = Math.hypot(s.vx, s.vy)}
					{#if sp > 1e-6}
						<line
							x1={sx(s.x) + (s.vy / sp) * TICK}
							y1={sy(s.y) - (s.vx / sp) * TICK}
							x2={sx(s.x) - (s.vy / sp) * TICK}
							y2={sy(s.y) + (s.vx / sp) * TICK}
							stroke={v.d.color}
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					{/if}
					<circle cx={sx(s.x)} cy={sy(s.y)} r="5" fill="none" class="ring" />
					<circle cx={sx(s.x)} cy={sy(s.y)} r="2.5" fill={v.d.color} />
				{/each}
			</g>

			{#each traceKeys as key, i}
				{@const r = INSTRUMENT.traces[key]}
				{@const top = TR.top + i * (TR.h + TR.gap)}
				<text x={TR.x} y={top - 10} class="label">
					{r.label}
					<tspan class="unit">({r.unit})</tspan>
				</text>
				<rect x={TR.x} y={top} width={TR.w} height={TR.h} class="panel" />
				{#if r.min < 0}
					<line
						x1={TR.x}
						x2={TR.x + TR.w}
						y1={top + TR.h / 2}
						y2={top + TR.h / 2}
						class="grid axis"
					/>
				{/if}
				<text x={TR.x - 8} y={top + 12} class="tick" text-anchor="end">
					{r.max}
				</text>
				<text x={TR.x - 8} y={top + TR.h} class="tick" text-anchor="end">
					{r.min}
				</text>
				{#each shown as v}
					<polyline
						points={traceLine(key, i, v.d.traces[key])}
						fill="none"
						stroke={v.d.color}
						stroke-width="1.6"
					/>
					<circle
						cx={tx(tick)}
						cy={traceY(key, i, v.d.traces[key][tick])}
						r="3.5"
						fill={v.d.color}
						class="ring"
					/>
				{/each}
			{/each}
			<text
				x={TR.x + TR.w}
				y={inputY - 14}
				class="label time-readout"
				text-anchor="end"
			>
				t {fmt(seconds, 2)} s
			</text>
			<!-- Input lanes: left engine above, right below; both lit is LR. -->
			{#each ["L", "R"] as lane, li}
				{@const y = inputY + li * (LANE + 4)}
				<rect x={TR.x} {y} width={TR.w} height={LANE} class="lane" />
				<text x={TR.x - 8} y={y + LANE - 2} class="tick" text-anchor="end">
					{lane}
				</text>
				{#each strip as seg}
					{#if seg.input === "LR" || seg.input === lane}
						<rect
							x={tx(seg.start)}
							{y}
							width={tx(seg.start + seg.ticks) - tx(seg.start)}
							height={LANE}
							class="lit"
						/>
					{/if}
				{/each}
			{/each}
			{#each Array.from({ length: INSTRUMENT.seconds + 1 }, (_, i) => i) as t}
				<text
					x={tx(t * 60)}
					y={inputY + 40}
					class="tick"
					text-anchor={t === 0
						? "start"
						: t === INSTRUMENT.seconds
							? "end"
							: "middle"}
				>
					{t}
				</text>
			{/each}
			<line
				x1={tx(tick)}
				x2={tx(tick)}
				y1={TR.top}
				y2={inputY + 2 * LANE + 4}
				class="cursor"
			/>
		</svg>

		<!-- Diagram tools sit on the diagram they act on. -->
		<div
			class="tools"
			style={`top:${PLAN.y + 8}px;right:${SCREEN_W - PLAN.x - PLAN.w + 8}px`}
		>
			{#if mode === "default"}
				<button type="button" class="recenter" onclick={recenter}>
					Recenter
				</button>
			{/if}
			<OptionToggle
				hover="tint"
				label="Plan scale"
				options={["Fit all", "Default scale"]}
				bind:value={
					() => (mode === "fit" ? "Fit all" : "Default scale"),
					(v) => choose(v === "Fit all" ? "fit" : "default")
				}
			/>
		</div>
		{#if burn}
			<!-- The burn switcher sits on the strip it chooses, left of the lanes. -->
			<div
				class="tools"
				style={`top:${inputY - 8}px;right:${SCREEN_W - TR.x + 24}px`}
			>
				<OptionToggle
					compact
					hover="tint"
					label="Burn"
					options={BURN_IDS.map((id) => BURNS[id].label)}
					bind:value={
						() => BURNS[burn ?? "course"].label,
						(l) => (burn = BURN_IDS.find((id) => BURNS[id].label === l))
					}
				/>
			</div>
		{/if}
		<div
			class="tools time"
			style={`top:${inputY + 44}px;left:${TR.x - KNOB / 2}px;width:${TR.w + KNOB}px`}
		>
			<div class="time-slider">
				<BrandSlider
					compact
					label="Time"
					unit="s"
					digits={2}
					min={0}
					max={INSTRUMENT.seconds}
					step={1 / 60}
					bind:value={() => seconds, (v) => (tick = Math.round(v * 60))}
				/>
			</div>
		</div>
	</div>

	<!-- Unscaled: menu and pane are placed on the container, not the screen. -->
	<button
		bind:this={toggleEl}
		type="button"
		class="corner"
		aria-label="Open values"
		aria-expanded={paneOpen}
		aria-controls={paneId}
		onclick={() => setPane(true)}
	>
		☰
	</button>

	<aside
		aria-label="Values under investigation"
		bind:this={paneEl}
		id={paneId}
		class="pane"
		hidden={!paneOpen}
	>
		<div class="pane-head">
			<h3>Values</h3>
			<button
				type="button"
				bind:this={closeEl}
				class="corner"
				aria-label="Close values"
				onclick={() => setPane(false)}
			>
				×
			</button>
		</div>

		{#if editor}
			{@render editor()}
		{:else}
			<p class="dim">This example has no values to investigate.</p>
		{/if}
	</aside>
</figure>

<style>
.host {
	position: relative;
	margin: 0;
	/* Fills a container with a height; otherwise keeps the screen shape. */
	width: 100%;
	height: 100%;
	aspect-ratio: 1440 / 900;
	overflow: hidden;
	background: var(--color-void);
	border: var(--flight-border);
}
.screen {
	position: absolute;
	left: 50%;
	top: 50%;
	overflow: hidden;
	transform-origin: center;
	font: 17px / 1.35 var(--font-flight);
	color: var(--color-text);
}
.dim-text {
	fill: var(--color-text-dim);
}
.dim {
	color: var(--color-text-dim);
}
.views {
	display: block;
	user-select: none;
	position: absolute;
	top: 0;
	left: 0;
}
.views.pan {
	cursor: grab;
	touch-action: none;
}
.views.scrubbing {
	cursor: ew-resize;
}
.views.dragging {
	cursor: grabbing;
}
.panel {
	fill: var(--color-void-light);
	stroke: var(--color-text-dim);
	stroke-width: 1;
}
.grid {
	stroke: var(--color-flight-trail);
}
.axis {
	stroke: var(--color-text-dim);
}
.ring {
	stroke: var(--color-text);
	stroke-width: 1.5;
}
.cursor {
	stroke: var(--color-text);
}
text {
	fill: var(--color-text);
	font: 15px var(--font-flight);
}
.tick {
	fill: var(--color-text-dim);
	font-size: 13px;
}
.lane {
	fill: var(--color-flight-trail);
}
/* Accepted in 02.6: soft white keeps lime for the controls. */
.lit {
	fill: color-mix(in srgb, var(--color-text) 70%, transparent);
}
.tools {
	position: absolute;
	display: flex;
	align-items: center;
	gap: 8px;
}
/* Vertical rhythm: element heights and tops sit on the 4px grid. */
.recenter {
	height: 44px;
}
.time-slider {
	flex: 1;
}
.pane {
	position: absolute;
	inset-block: 0;
	right: 0;
	z-index: 1;
	width: min(22rem, 100%);
	box-sizing: border-box;
	overflow: auto;
	padding: 0 var(--spacing-md) var(--spacing-md);
	background: var(--color-void-light);
	border-left: var(--flight-border);
	color: var(--color-text);
	font: 15px / 1.35 var(--font-flight);
}
.pane[hidden] {
	display: none;
}
.pane-head {
	display: flex;
	margin-right: calc(var(--spacing-sm) - var(--spacing-md));
	padding-top: var(--spacing-sm);
	justify-content: space-between;
	align-items: center;
}
h3 {
	margin: 0;
	font-size: 19px;
}
button {
	min-height: 40px;
	padding: 4px 14px;
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: 15px var(--font-flight);
	cursor: pointer;
}
/* The menu button and the pane's close button share one corner. */
.corner {
	width: 48px;
	padding: 0;
	border-color: var(--color-acid-lime);
	color: var(--color-acid-lime);
	font-size: 20px;
}
.host > .corner {
	position: absolute;
	top: var(--spacing-sm);
	right: var(--spacing-sm);
}
button:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
/* Diagram tools follow the base button rule. */
.tools button:not([aria-pressed="true"]) {
	background: var(--color-void);
}
</style>
