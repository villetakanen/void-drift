<script lang="ts">
import {
	bodyAt,
	type FieldBody,
	niceCeil,
	type Track,
} from "../../../lib/instrument";
import Toggle from "../../inputs/Toggle.svelte";

// The path tool (lab-instrument study, 02.8–02.9): a square display of every
// vehicle's path with a marker at the current time, the scale switch in its
// top right and its numbers in its bottom right. It draws in its own
// coordinates; the host scales it. Given bodies (the Gravity tuning bench's
// well), it draws them under the paths and lets a well be dragged.
let {
	tracks,
	tick,
	bodies = [],
	onmovewell,
	size = 672,
	scale = 1,
}: {
	tracks: Track[];
	/** The field's bodies; empty outside field mode. */
	bodies?: FieldBody[];
	/** Called when a Lab well (index among the wells) is dropped at a world point; enables dragging. */
	onmovewell?: (index: number, x: number, y: number) => void;
	/** Sample index marked on every path. */
	tick: number;
	/** Side of the square, in the host's logical pixels. */
	size?: number;
	/** Host's scale, so dragging follows the pointer. */
	scale?: number;
} = $props();

const DEFAULT_SCALE = 0.2;
const DEFAULT_GRID = 500;
// Half-length of the tick drawn across each path at the marker.
const TICK = 16;
const FIT_MARGIN = 48;
// Half-size of a well's centre cross.
const MARK = 6;
// A jump this long between samples is an arena wrap, not motion.
const WRAP_JUMP = 1000;
// Play's arena centre, where the default scale opens in field mode.
const ARENA_CENTRE = { x: 960, y: 540 };
const field = $derived(bodies.length > 0);

let mode = $state<"fit" | "default">("fit");
let pan = $state({ x: 40, y: 336 });
let dragging = $state(false);
let last = { x: 0, y: 0 };

const fit = $derived.by(() => {
	const pts: { x: number; y: number }[] = tracks.flatMap((t) => t.samples);
	for (const body of bodies)
		for (const c of body.path)
			for (const [dx, dy] of [
				[-1, -1],
				[1, 1],
			])
				pts.push({ x: c.x + dx * body.reach, y: c.y + dy * body.reach });
	const xs = pts.map((p) => p.x),
		ys = pts.map((p) => p.y);
	const x0 = Math.min(...xs),
		x1 = Math.max(...xs),
		y0 = Math.min(...ys),
		y1 = Math.max(...ys);
	const s = Math.min(
		(size - 2 * FIT_MARGIN) / Math.max(1, x1 - x0),
		(size - 2 * FIT_MARGIN) / Math.max(1, y1 - y0),
	);
	return {
		s,
		ox: (size - (x1 - x0) * s) / 2 - x0 * s,
		oy: (size - (y1 - y0) * s) / 2 - y0 * s,
	};
});
const view = $derived(
	mode === "fit" ? fit : { s: DEFAULT_SCALE, ox: pan.x, oy: pan.y },
);
const grid = $derived(mode === "fit" ? niceCeil(100 / view.s) : DEFAULT_GRID);
const sx = (x: number) => view.ox + x * view.s;
const sy = (y: number) => view.oy + y * view.s;
function lines(o: number) {
	const out: number[] = [];
	const start = Math.ceil(-o / view.s / grid) * grid;
	for (let v = start; o + v * view.s <= size; v += grid) out.push(v);
	return out;
}
const gridX = $derived(lines(view.ox));
const gridY = $derived(lines(view.oy));
// The area of space the display shows, in world units.
const area = $derived(Math.round(size / view.s));

function choose(next: "fit" | "default") {
	mode = next;
	if (next === "default")
		pan = field
			? {
					x: size / 2 - ARENA_CENTRE.x * DEFAULT_SCALE,
					y: size / 2 - ARENA_CENTRE.y * DEFAULT_SCALE,
				}
			: { x: 40, y: size / 2 };
}
function down(e: PointerEvent) {
	if (mode !== "default") return;
	dragging = true;
	last = { x: e.clientX, y: e.clientY };
	(e.currentTarget as Element).setPointerCapture(e.pointerId);
}
function move(e: PointerEvent) {
	if (!dragging) return;
	pan = {
		x: pan.x + (e.clientX - last.x) / scale,
		y: pan.y + (e.clientY - last.y) / scale,
	};
	last = { x: e.clientX, y: e.clientY };
}
const id = `path-${Math.random().toString(36).slice(2, 8)}`;

// Dragging a Lab well: it follows the pointer and is handed back on release.
let svg: SVGSVGElement | undefined = $state();
let held = $state<{ index: number; x: number; y: number } | null>(null);
const wellIndex = (body: FieldBody) =>
	bodies.filter((b) => b.kind === "well").indexOf(body);
function world(e: PointerEvent) {
	const rect = svg?.getBoundingClientRect();
	if (!rect) return { x: 0, y: 0 };
	const k = size / rect.width;
	return {
		x: ((e.clientX - rect.left) * k - view.ox) / view.s,
		y: ((e.clientY - rect.top) * k - view.oy) / view.s,
	};
}
function grab(e: PointerEvent, body: FieldBody) {
	if (!onmovewell) return;
	e.stopPropagation();
	(e.currentTarget as Element).setPointerCapture(e.pointerId);
	held = { index: wellIndex(body), ...world(e) };
}
function drag(e: PointerEvent) {
	if (held) held = { ...held, ...world(e) };
}
function drop() {
	if (held) onmovewell?.(held.index, Math.round(held.x), Math.round(held.y));
	held = null;
}
const centre = (body: FieldBody) =>
	held && body.kind === "well" && wellIndex(body) === held.index
		? held
		: bodyAt(body, tick);

/** The path as polylines, broken wherever the ship wrapped across the arena. */
function segments(track: Track) {
	const out: string[][] = [[]];
	track.samples.forEach((p, i) => {
		const prev = track.samples[i - 1];
		if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) > WRAP_JUMP)
			out.push([]);
		out[out.length - 1].push(`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`);
	});
	return out.map((pts) => pts.join(" "));
}
// A run that ended early holds its last sample under the marker.
const sampleAt = (track: Track) =>
	track.samples[Math.max(0, Math.min(tick, track.samples.length - 1))];
</script>

<div class="pane" style={`width:${size}px;height:${size}px`}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		bind:this={svg}
		class:pan={mode === "default"}
		class:dragging
		viewBox={`0 0 ${size} ${size}`}
		width={size}
		height={size}
		onpointerdown={down}
		onpointermove={move}
		onpointerup={() => (dragging = false)}
		onpointercancel={() => (dragging = false)}
		role="img"
		aria-label="Plan view of every path with a marker at the current time"
	>
		<defs>
			<clipPath {id}><rect width={size} height={size} /></clipPath>
		</defs>
		<g clip-path={`url(#${id})`}>
			{#each bodies as body}
				{@const c = centre(body)}
				<circle
					cx={sx(c.x)}
					cy={sy(c.y)}
					r={body.reach * view.s}
					fill="none"
					class={body.kind === "well" ? "reach lab" : "reach"}
				/>
				{#if body.kind === "well"}
					<path
						d={`M${sx(c.x) - MARK},${sy(c.y)}h${2 * MARK}M${sx(c.x)},${sy(c.y) - MARK}v${2 * MARK}`}
						class="lab-centre"
					/>
					{#if onmovewell}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<circle
							cx={sx(c.x)}
							cy={sy(c.y)}
							r={2 * MARK}
							class="handle"
							onpointerdown={(e) => grab(e, body)}
							onpointermove={drag}
							onpointerup={drop}
							onpointercancel={() => (held = null)}
						>
							<title>Drag Lab well {body.label}</title>
						</circle>
					{/if}
				{:else}
					<circle
						cx={sx(c.x)}
						cy={sy(c.y)}
						r={Math.max(2, body.radius * view.s)}
						fill={body.color}
						class="surface"
					/>
				{/if}
			{/each}
			{#each gridX as g}
				<line
					x1={sx(g)}
					x2={sx(g)}
					y1="0"
					y2={size}
					class={g === 0 ? "axis" : "grid"}
				/>
			{/each}
			{#each gridY as g}
				<line
					x1="0"
					x2={size}
					y1={sy(g)}
					y2={sy(g)}
					class={g === 0 ? "axis" : "grid"}
				/>
			{/each}
			{#each tracks as t}
				{#each segments(t) as points}
					<polyline {points} fill="none" stroke={t.color} stroke-width="2" />
				{/each}
				{@const p = sampleAt(t)}
				{@const v = Math.hypot(p.vx, p.vy)}
				{#if v > 1e-6}
					<line
						x1={sx(p.x) + (p.vy / v) * TICK}
						y1={sy(p.y) - (p.vx / v) * TICK}
						x2={sx(p.x) - (p.vy / v) * TICK}
						y2={sy(p.y) + (p.vx / v) * TICK}
						stroke={t.color}
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				{/if}
				<circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill="none" class="ring" />
				<circle cx={sx(p.x)} cy={sy(p.y)} r="2.5" fill={t.color} />
			{/each}
		</g>
	</svg>
	<!-- Title and numbers on one line in the display's bottom right. -->
	<dl class="readout">
		<dt class="name">Paths</dt>
		<dd>{area} × {area} u</dd>
		<dd>grid {grid} u</dd>
		<dd>{view.s.toFixed(3)} px/u</dd>
	</dl>
	<div class="tools">
		<Toggle
			label="Path scale"
			options={["Fit all", "Default scale"]}
			bind:value={
				() => (mode === "fit" ? "Fit all" : "Default scale"),
				(o) => choose(o === "Fit all" ? "fit" : "default")
			}
		/>
	</div>
</div>

<style>
/* An instrument display: elevation 2 with scanlines, bezel and black shadow. */
.pane {
	position: relative;
	background: var(--surface-display);
	box-shadow: var(--shadow-display);
	font-family: var(--font-family-ui);
}
svg {
	position: absolute;
	inset: 0;
	display: block;
	user-select: none;
}
svg.pan {
	cursor: grab;
	touch-action: none;
}
svg.dragging {
	cursor: grabbing;
}
.grid {
	stroke: var(--color-border-subtle);
}
.axis {
	stroke: var(--color-text-muted);
}
.ring {
	stroke: var(--color-text);
	stroke-width: 1.5;
}
.reach {
	stroke: var(--color-text-muted);
	stroke-width: 1;
	stroke-dasharray: 4 4;
}
.reach.lab,
.lab-centre {
	stroke: var(--color-caution-tape);
}
.lab-centre {
	stroke-width: 1.5;
}
.surface {
	opacity: 0.85;
}
.handle {
	fill: transparent;
	cursor: move;
	touch-action: none;
}
.tools {
	position: absolute;
	top: 8px;
	right: 8px;
}
/* One 24px line: the readout keeps the 4px rhythm on the display. */
.readout {
	position: absolute;
	right: 8px;
	bottom: 8px;
	display: flex;
	align-items: baseline;
	gap: 16px;
	margin: 0;
	padding: 4px 8px;
	font-size: 17px;
	line-height: 24px;
	white-space: nowrap;
	pointer-events: none;
}
.readout dd {
	margin: 0;
	color: var(--color-text);
}
.name {
	color: var(--color-text-muted);
	font-size: 15px;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
</style>
