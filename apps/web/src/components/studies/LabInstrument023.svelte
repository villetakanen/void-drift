<script lang="ts">
// Frozen: the instrument as reviewed in 02.3. Later decisions go to the
// current component, not here.
import { type Snippet, tick as settled } from "svelte";
import { derive, fixtureVehicles, summarize } from "./lab-instrument";
import { TOTAL_TICKS } from "./movement-bench";
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
	sourceLabel = "2 sources",
	editor,
}: {
	label?: string;
	vehicles?: InstrumentInput[];
	sourceLabel?: string;
	/** The pane's content: controls for the values under investigation. */
	editor?: Snippet;
} = $props();

// One logical screen, laptop-shaped; the host only decides the scale.
const SCREEN_W = 1440;
const SCREEN_H = 900;
const BAR = 56;
const VIEWS_H = 620;

// Plan view, in screen pixels.
const PLAN = { x: 20, y: BAR + 20, w: 640, h: VIEWS_H - 40 };
const DEFAULT_SCALE = 0.2;
const DEFAULT_GRID = 500;
const TICK = 16;

// Trace stack, in screen pixels.
const TR = { x: 760, w: 640, top: BAR + 44, h: 120, gap: 46 };
const traceKeys: TraceKey[] = ["speed", "acceleration", "turn"];
const inputY = TR.top + 3 * (TR.h + TR.gap) - 18;

const vehicles = $derived(
	input.map((v) => {
		const d = derive(v.series);
		return { ...v, d, summary: summarize(d) };
	}),
);

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

function step(delta: number) {
	tick = Math.max(0, Math.min(TOTAL_TICKS, tick + delta));
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
		p.x >= TR.x && p.x <= TR.x + TR.w && p.y >= TR.top && p.y <= inputY + 16;
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
		<header class="bar" style={`height:${BAR}px`}>
			<div class="title">
				<strong>LAB INSTRUMENT</strong>
				<span class="dim"
					>{sourceLabel}
					· {shown.length} of {vehicles.length} vehicles</span
				>
			</div>
			<div class="readouts">
				<span>t <b>{fmt(seconds, 2)} s</b></span>
				<span>
					path <b>{mode === "fit" ? "fit all" : "default"}</b>
					· {view.s.toFixed(3)} px/u · grid {grid} u
				</span>
			</div>
		</header>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<svg
			class="views"
			class:pan={mode === "default"}
			class:dragging
			class:scrubbing
			viewBox={`0 0 ${SCREEN_W} ${BAR + VIEWS_H}`}
			width={SCREEN_W}
			height={BAR + VIEWS_H}
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
			<text x={PLAN.x} y={PLAN.y - 8} class="label">Plan · paths</text>
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
				<text x={TR.x} y={top - 10} class="label">{r.label} ({r.unit})</text>
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
			{#each INSTRUMENT.input as s, i}
				{@const w = TR.w / INSTRUMENT.input.length}
				<rect
					x={TR.x + i * w}
					y={inputY}
					width={w - 1}
					height="16"
					class={s === "–" ? "idle" : "active"}
				/>
				<text
					x={TR.x + i * w + w / 2}
					y={inputY + 12}
					class="step"
					text-anchor="middle"
				>
					{s === "–" ? "" : s}
				</text>
				<text
					x={TR.x + i * w}
					y={inputY + 34}
					class="tick"
					text-anchor="middle"
				>
					{i}
				</text>
			{/each}
			<text x={TR.x + TR.w} y={inputY + 34} class="tick" text-anchor="end">
				{INSTRUMENT.seconds}
				s
			</text>
			<line
				x1={tx(tick)}
				x2={tx(tick)}
				y1={TR.top}
				y2={inputY + 16}
				class="cursor"
			/>
		</svg>

		<!-- Diagram tools sit on the diagram they act on. -->
		<div
			class="tools"
			style={`top:${PLAN.y + 10}px;right:${SCREEN_W - PLAN.x - PLAN.w + 10}px`}
		>
			<button
				type="button"
				aria-pressed={mode === "fit"}
				onclick={() => choose("fit")}
			>
				Fit all
			</button>
			<button
				type="button"
				aria-pressed={mode === "default"}
				onclick={() => choose("default")}
			>
				Default scale
			</button>
			{#if mode === "default"}
				<button type="button" onclick={recenter}>Recenter</button>
			{/if}
		</div>
		<div
			class="tools time"
			style={`top:${inputY + 46}px;left:${TR.x}px;width:${TR.w}px`}
		>
			<b>{fmt(seconds, 2)} s</b>
			<input
				type="range"
				min="0"
				max={TOTAL_TICKS}
				step="1"
				bind:value={tick}
				aria-label="Time"
				aria-valuetext={`${fmt(seconds, 2)} seconds`}
			>
			<button type="button" aria-label="Back 0.1 s" onclick={() => step(-6)}>
				−0.1
			</button>
			<button type="button" aria-label="Back 0.01 s" onclick={() => step(-1)}>
				−0.01
			</button>
			<button type="button" aria-label="Forward 0.01 s" onclick={() => step(1)}>
				+0.01
			</button>
			<button type="button" aria-label="Forward 0.1 s" onclick={() => step(6)}>
				+0.1
			</button>
		</div>

		<table class="readout" style={`top:${BAR + VIEWS_H}px`}>
			<thead>
				<tr class="groups">
					<th></th>
					<th colspan="3">At {fmt(seconds, 2)} s</th>
					<th colspan="3">Whole run</th>
					<th></th>
				</tr>
				<tr>
					<th>Vehicle</th>
					<th>Speed u/s</th>
					<th>Accel u/s²</th>
					<th>Turn °/s²</th>
					<th>Peak u/s</th>
					<th>To 200 u/s</th>
					<th>Distance u</th>
					<th class="config">Configuration</th>
				</tr>
			</thead>
			<tbody>
				{#each vehicles as v}
					<tr class:off={hidden[v.id]}>
						<th scope="row">
							<button
								type="button"
								class="toggle-row"
								aria-pressed={!hidden[v.id]}
								aria-label={`Show ${v.d.label}`}
								onclick={() => (hidden[v.id] = !hidden[v.id])}
							>
								<i style={`background:${v.d.color}`}></i>{v.d.label}
							</button>
						</th>
						<td>{fmt(v.d.traces.speed[tick])}</td>
						<td>{fmt(v.d.traces.acceleration[tick])}</td>
						<td>{fmt(v.d.traces.turn[tick])}</td>
						<td>{fmt(v.summary.peakSpeed)}</td>
						<td>
							{v.summary.to200 === null ? "—" : `${fmt(v.summary.to200, 2)} s`}
						</td>
						<td>{fmt(v.summary.distance)}</td>
						<td class="config">{v.config}</td>
					</tr>
				{/each}
			</tbody>
		</table>
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
/* The right padding keeps the readouts clear of the menu button. */
.bar {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 32px;
	padding: 0 120px 0 20px;
	border-bottom: var(--flight-border);
	box-sizing: border-box;
}
.title {
	display: flex;
	gap: 16px;
	align-items: baseline;
}
.title strong {
	color: var(--color-acid-lime);
	letter-spacing: 0.12em;
}
.readouts {
	display: flex;
	gap: 28px;
	margin-left: auto;
	color: var(--color-text-dim);
}
.readouts b {
	color: var(--color-text);
	font-weight: normal;
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
.active {
	fill: var(--color-acid-lime);
	opacity: 0.85;
}
.idle {
	fill: var(--color-flight-trail);
}
.step {
	fill: var(--color-void);
	font-size: 11px;
}
.readout {
	position: absolute;
	left: 20px;
	width: calc(100% - 40px);
	border-collapse: collapse;
	font-size: 15px;
}
.readout th,
.readout td {
	padding: 5px 10px;
	text-align: right;
	border-bottom: 1px solid var(--color-flight-trail);
	font-weight: normal;
	white-space: nowrap;
}
.readout .config {
	max-width: 420px;
	overflow: hidden;
	text-align: left;
	text-overflow: ellipsis;
}
.readout th:first-child {
	text-align: left;
}
.readout thead th {
	color: var(--color-text-dim);
}
.readout .groups th {
	text-align: center;
	border-bottom-color: var(--color-text-dim);
}
.tools {
	position: absolute;
	display: flex;
	align-items: center;
	gap: 6px;
}
.tools.time b {
	min-width: 5.5em;
	color: var(--color-acid-lime);
	font-weight: normal;
}
.tools.time input {
	flex: 1;
	min-height: 40px;
	accent-color: var(--color-acid-lime);
}
.readout tr.off {
	opacity: 0.35;
}
i {
	display: inline-block;
	width: 16px;
	height: 4px;
	margin-right: 8px;
	vertical-align: middle;
	flex: none;
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
button[aria-pressed="true"] {
	background: var(--color-acid-lime);
	color: var(--color-void);
	border-color: var(--color-acid-lime);
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
button:focus-visible,
input:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
/* Diagram tools follow the base button rule. */
.tools button:not([aria-pressed="true"]) {
	background: var(--color-void);
}
.readout .toggle-row {
	min-height: 0;
	padding: 0;
	border: 0;
	background: none;
	color: var(--color-text);
	text-align: left;
	font: inherit;
}
</style>
