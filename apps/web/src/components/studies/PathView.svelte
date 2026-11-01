<script lang="ts">
import type { Snippet } from "svelte";
import { niceCeil, type PathSeries } from "./path-instrument";

let {
	series,
	label,
	tick,
	children,
}: {
	series: PathSeries[];
	label: string;
	/** Sample index to mark on every path; no marker when omitted. */
	tick?: number;
	/** Rendered directly under the path area. */
	children?: Snippet;
} = $props();

type Mode = "fit" | "default";
// The instrument's default scale: pixels of the 680-wide view per world unit.
const DEFAULT_SCALE = 0.2;
const DEFAULT_GRID = 500;
// Half-length, in view pixels, of the tick drawn across the path at the time marker.
const TICK = 16;
const W = 680,
	H = 420,
	MARGIN = 28;

const points = $derived(series.flatMap((s) => s.samples));
const bounds = $derived.by(() => {
	const xs = points.map((p) => p.x),
		ys = points.map((p) => p.y);
	return {
		x0: Math.min(0, ...xs),
		x1: Math.max(1, ...xs),
		y0: Math.min(0, ...ys),
		y1: Math.max(1, ...ys),
	};
});

let mode = $state<Mode>("fit");
let panX = $state(MARGIN);
let panY = $state(H / 2);
let dragging = $state(false);
let svg: SVGSVGElement;

const fit = $derived.by(() => {
	const scale = Math.min(
		(W - 2 * MARGIN) / (bounds.x1 - bounds.x0),
		(H - 2 * MARGIN) / (bounds.y1 - bounds.y0),
	);
	return {
		scale,
		offX:
			MARGIN +
			(W - 2 * MARGIN - (bounds.x1 - bounds.x0) * scale) / 2 -
			bounds.x0 * scale,
		offY:
			MARGIN +
			(H - 2 * MARGIN - (bounds.y1 - bounds.y0) * scale) / 2 -
			bounds.y0 * scale,
	};
});
const view = $derived(
	mode === "fit" ? fit : { scale: DEFAULT_SCALE, offX: panX, offY: panY },
);
const gridStep = $derived(
	mode === "fit" ? niceCeil(100 / view.scale) : DEFAULT_GRID,
);
function ticks(offset: number, extent: number) {
	const from = Math.floor(-offset / view.scale / gridStep) * gridStep;
	const to = (extent - offset) / view.scale;
	const out: number[] = [];
	for (let v = from; v <= to; v += gridStep) out.push(v);
	return out;
}
const gridX = $derived(ticks(view.offX, W));
const gridY = $derived(ticks(view.offY, H));
const sx = (x: number) => view.offX + x * view.scale;
const sy = (y: number) => view.offY + y * view.scale;

function choose(next: Mode) {
	mode = next;
	if (next === "default") recenter();
}
function recenter() {
	panX = MARGIN;
	panY = H / 2;
}
let last = { x: 0, y: 0 };
function down(event: PointerEvent) {
	if (mode !== "default") return;
	dragging = true;
	last = { x: event.clientX, y: event.clientY };
	(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
	if (!dragging) return;
	const ratio = W / svg.getBoundingClientRect().width;
	panX += (event.clientX - last.x) * ratio;
	panY += (event.clientY - last.y) * ratio;
	last = { x: event.clientX, y: event.clientY };
}
function up() {
	dragging = false;
}
function nudge(dx: number, dy: number) {
	panX += dx;
	panY += dy;
}
</script>

<figure>
	<div class="bar">
		<div class="toggle">
			<button
				type="button"
				aria-pressed={mode === "fit"}
				onclick={() => choose("fit")}
			>
				Fit all paths
			</button>
			<button
				type="button"
				aria-pressed={mode === "default"}
				onclick={() => choose("default")}
			>
				Default scale
			</button>
		</div>
		<span class="readout">
			{mode === "fit" ? "auto-zoom" : "default"}
			· {view.scale.toFixed(3)} px/u · grid {gridStep} u
		</span>
		{#if mode === "default"}
			<div class="toggle" role="presentation">
				<button
					type="button"
					aria-label="Pan left"
					onclick={() => nudge(60, 0)}
				>
					←
				</button>
				<button type="button" aria-label="Pan up" onclick={() => nudge(0, 60)}>
					↑
				</button>
				<button
					type="button"
					aria-label="Pan down"
					onclick={() => nudge(0, -60)}
				>
					↓
				</button>
				<button
					type="button"
					aria-label="Pan right"
					onclick={() => nudge(-60, 0)}
				>
					→
				</button>
				<button type="button" onclick={recenter}>Recenter</button>
			</div>
		{/if}
	</div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="stage"
		class:pan={mode === "default"}
		class:dragging
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
	>
		<svg
			bind:this={svg}
			viewBox={`0 0 ${W} ${H}`}
			role="img"
			aria-label={`${label}. ${mode === "default" ? "Default scale; pan with the buttons or by dragging." : "Scaled to fit all paths."}`}
		>
			<defs>
				<clipPath id="pathview-clip"><rect width={W} height={H} /></clipPath>
			</defs>
			<g clip-path="url(#pathview-clip)">
				{#each gridX as gx}
					<line
						x1={sx(gx)}
						x2={sx(gx)}
						y1="0"
						y2={H}
						class="grid"
						class:axis={gx === 0}
					/>
				{/each}
				{#each gridY as gy}
					<line
						x1="0"
						x2={W}
						y1={sy(gy)}
						y2={sy(gy)}
						class="grid"
						class:axis={gy === 0}
					/>
				{/each}
				{#each series as s}
					<polyline
						points={s.samples
							.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
							.join(" ")}
						fill="none"
						stroke={s.color}
						stroke-width="2"
					/>
					<circle
						cx={sx(s.samples[0].x)}
						cy={sy(s.samples[0].y)}
						r="4"
						fill={s.color}
					/>
				{/each}
				{#if tick !== undefined}
					{#each series as s}
						{@const speed = Math.hypot(s.samples[tick].vx, s.samples[tick].vy)}
						{#if speed > 1e-6}
							{@const ux = (-s.samples[tick].vy / speed) * TICK}
							{@const uy = (s.samples[tick].vx / speed) * TICK}
							<line
								x1={sx(s.samples[tick].x) - ux}
								y1={sy(s.samples[tick].y) - uy}
								x2={sx(s.samples[tick].x) + ux}
								y2={sy(s.samples[tick].y) + uy}
								stroke={s.color}
								stroke-width="1.5"
								stroke-linecap="round"
							/>
						{/if}
						<circle
							cx={sx(s.samples[tick].x)}
							cy={sy(s.samples[tick].y)}
							r="4.5"
							fill="none"
							stroke="var(--color-text)"
							stroke-width="1.5"
						/>
						<circle
							cx={sx(s.samples[tick].x)}
							cy={sy(s.samples[tick].y)}
							r="2.5"
							fill={s.color}
						/>
					{/each}
				{/if}
			</g>
		</svg>
	</div>
	{@render children?.()}
	<p class="hint">
		{mode === "default"
			? "Drag to pan, or use the arrow buttons. Scale is the same in every study."
			: "Scale and framing follow these paths; switch to default scale to compare with other studies."}
	</p>
	<ul class="legend">
		{#each series as s}
			<li><i style={`background:${s.color}`}></i>{s.label}</li>
		{/each}
	</ul>
</figure>

<style>
figure {
	margin: 0;
	max-width: 760px;
}
.bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--spacing-md);
	margin-bottom: var(--spacing-sm);
}
.toggle {
	display: flex;
}
button {
	padding: var(--spacing-xs) var(--spacing-md);
	background: transparent;
	color: var(--color-text);
	border: 1px solid var(--color-text-dim);
	font: var(--font-small) var(--font-flight);
	cursor: pointer;
}
button[aria-pressed="true"] {
	background: var(--color-acid-lime);
	color: var(--color-void);
	border-color: var(--color-acid-lime);
}
button:focus-visible,
.stage:focus-visible {
	outline: 2px solid var(--color-focus-ring);
	outline-offset: 2px;
}
.readout,
.hint {
	font: var(--font-small) var(--font-flight);
	color: var(--color-text-dim);
}
.hint {
	margin: var(--spacing-sm) 0 0;
}
svg {
	width: 100%;
	height: auto;
	display: block;
	background: var(--color-void-light);
	border: var(--flight-border);
}
.stage.pan {
	cursor: grab;
	touch-action: none;
}
.stage.dragging {
	cursor: grabbing;
}
.grid {
	stroke: var(--color-flight-trail);
	stroke-width: 1;
}
.axis {
	stroke: var(--color-text-dim);
}
.legend {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-md);
	list-style: none;
	padding: 0;
	margin: var(--spacing-sm) 0 0;
	font: var(--font-small) var(--font-flight);
}
.legend i {
	display: inline-block;
	width: 12px;
	height: 3px;
	margin-right: var(--spacing-xs);
	vertical-align: middle;
}
</style>
