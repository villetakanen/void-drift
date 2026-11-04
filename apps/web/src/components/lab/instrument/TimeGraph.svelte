<script lang="ts">
import {
	MEASURES,
	type Measure,
	niceCeil,
	SECONDS,
	TICK_RATE,
	TOTAL_TICKS,
	type Track,
} from "../../../lib/instrument";
import { GRAPH_MARGIN as M } from "./time-graph";

// The time graph (lab-instrument study, 02.10–02.11): one measure for every
// vehicle against 0–14 s, its value axis scaled to fit the data, with the
// measure, unit and the values at the cursor in a title row. Every label sits
// outside the data. It draws in its own coordinates; the host scales it.
let {
	measure,
	tracks,
	tick,
	width = 672,
	height = 208,
}: {
	measure: Measure;
	tracks: Track[];
	/** Sample index under the time cursor. */
	tick: number;
	width?: number;
	height?: number;
} = $props();

const spec = $derived(MEASURES[measure]);
// A track without values for this measure draws nothing.
const values = (t: Track) => t.traces[measure] ?? [];
const plot = $derived({
	x: M.left,
	y: M.top,
	w: width - M.left - M.right,
	h: height - M.top - M.bottom,
});
// Auto-scale: a nice tick step for about five ticks, the top one step above the
// peak. Signed measures stay symmetric about zero.
// Values that do not exist (NaN, e.g. no surface in an empty field) are gaps.
const peak = $derived(
	Math.max(
		1,
		...tracks.flatMap((t) => values(t).filter(Number.isFinite).map(Math.abs)),
	),
);
const step = $derived(niceCeil(peak / (spec.signed ? 2.5 : 5)));
const range = $derived.by(() => {
	const top = Math.ceil(peak / step) * step;
	return spec.signed ? { min: -top, max: top } : { min: 0, max: top };
});
const valueTicks = $derived.by(() => {
	const out: number[] = [];
	for (let v = range.min; v <= range.max; v += step) out.push(v);
	return out;
});
const seconds = Array.from({ length: SECONDS + 1 }, (_, i) => i);

const x = (t: number) => plot.x + (t / TOTAL_TICKS) * plot.w;
const y = (v: number) =>
	plot.y + plot.h - ((v - range.min) / (range.max - range.min)) * plot.h;
/** Polylines for the finite runs of a trace. */
function lines(values: number[]) {
	const out: string[][] = [[]];
	values.forEach((v, t) => {
		if (!Number.isFinite(v)) {
			if (out[out.length - 1].length) out.push([]);
			return;
		}
		out[out.length - 1].push(`${x(t).toFixed(1)},${y(v).toFixed(1)}`);
	});
	return out.filter((pts) => pts.length).map((pts) => pts.join(" "));
}
const fmt = (v: number) =>
	!Number.isFinite(v) ? "–" : v < 0 ? `−${Math.abs(v)}` : `${v}`;
// A run that ended early holds its last value under the cursor.
const at = (t: Track) => Math.max(0, Math.min(tick, values(t).length - 1));
</script>

<div class="graph" style={`width:${width}px;height:${height}px`}>
	<svg
		viewBox={`0 0 ${width} ${height}`}
		{width}
		{height}
		role="img"
		aria-label={`${spec.label} in ${spec.unit} against time, ${range.min} to ${range.max}`}
	>
		{#each valueTicks as v}
			<line
				x1={plot.x}
				x2={plot.x + plot.w}
				y1={y(v)}
				y2={y(v)}
				class={v === 0 ? "zero" : "grid"}
			/>
			<text x={plot.x - 8} y={y(v) + 4} class="tick" text-anchor="end">
				{fmt(v)}
			</text>
		{/each}
		{#each seconds as sec}
			<line
				x1={x(sec * TICK_RATE)}
				x2={x(sec * TICK_RATE)}
				y1={plot.y}
				y2={plot.y + plot.h}
				class="grid"
			/>
			<text
				x={x(sec * TICK_RATE)}
				y={plot.y + plot.h + 16}
				class="tick"
				text-anchor="middle"
			>
				{sec}
			</text>
		{/each}
		<line
			x1={plot.x}
			x2={plot.x}
			y1={plot.y}
			y2={plot.y + plot.h}
			class="axis"
		/>
		<line
			x1={plot.x}
			x2={plot.x + plot.w}
			y1={plot.y + plot.h}
			y2={plot.y + plot.h}
			class="axis"
		/>
		<!-- The time unit sits in the value-label column, level with the seconds. -->
		<text
			x={plot.x - 16}
			y={plot.y + plot.h + 16}
			class="tick"
			text-anchor="end"
		>
			s
		</text>
		{#each tracks as t}
			{#each lines(values(t)) as points}
				<polyline {points} fill="none" stroke={t.color} stroke-width="1.6" />
			{/each}
		{/each}
		<line
			x1={x(tick)}
			x2={x(tick)}
			y1={plot.y}
			y2={plot.y + plot.h}
			class="cursor"
		/>
		{#each tracks as t}
			{@const value = values(t)[at(t)]}
			{#if Number.isFinite(value)}
				<circle
					cx={x(at(t))}
					cy={y(value)}
					r="3.5"
					fill={t.color}
					class="dot"
				/>
			{/if}
		{/each}
	</svg>
	<div
		class="head"
		style={`left:${M.left}px;right:${M.right}px;height:${M.top}px`}
	>
		<span class="name">{spec.label}</span>
		<span class="unit">{spec.unit}</span>
		<span class="values">
			<span class="at">{(tick / TICK_RATE).toFixed(2)} s</span>
			{#each tracks as t}
				<b style={`color:${t.color}`}>{fmt(Math.round(values(t)[at(t)]))}</b>
			{/each}
		</span>
	</div>
</div>

<style>
/* An instrument display: elevation 2 with scanlines, bezel and black shadow. */
.graph {
	position: relative;
	background: var(--surface-display);
	box-shadow: var(--shadow-display);
	font-family: var(--font-family-ui);
}
svg {
	position: absolute;
	inset: 0;
	display: block;
}
.grid {
	stroke: var(--color-border-subtle);
}
.zero,
.axis {
	stroke: var(--color-text-muted);
}
.tick {
	fill: var(--color-text-muted);
	font: 13px var(--font-family-ui);
}
.cursor {
	stroke: var(--color-text);
}
.dot {
	stroke: var(--color-text);
	stroke-width: 1.5;
}
.head {
	position: absolute;
	top: 0;
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 15px;
	white-space: nowrap;
}
.name {
	color: var(--color-text-muted);
	letter-spacing: 0.1em;
	text-transform: uppercase;
}
.unit {
	color: var(--color-text);
}
.values {
	display: flex;
	gap: 12px;
	margin-left: auto;
	font-variant-numeric: tabular-nums;
}
.at {
	color: var(--color-text-muted);
}
.values b {
	min-width: 3ch;
	font-weight: normal;
	text-align: right;
}
</style>
