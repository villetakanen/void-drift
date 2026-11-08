<script lang="ts">
import { TOTAL_TICKS } from "./movement-bench";
import {
  derive,
  INSTRUMENT,
  niceCeil,
  type PathSeries,
  type TraceKey,
} from "./path-instrument";

// Study-local (02.10, auto-scale from 02.11): the base for the three time
// graphs. One measure against the shared 0–14 s axis, its value axis scaled to
// fit the data, drawn as a display in its own coordinates; the host scales it.
let {
  measure,
  series,
  tick,
  width = 672,
  height = 176,
}: {
  measure: TraceKey;
  series: PathSeries[];
  /** Sample index under the time cursor. */
  tick: number;
  width?: number;
  height?: number;
} = $props();

// Margins hold every label outside the data: title row above, value axis to
// the left, seconds below. All on the 4px grid.
const TOP = 28;
const LEFT = 52;
const RIGHT = 12;
const BOTTOM = 24;
const plot = $derived({
  x: LEFT,
  y: TOP,
  w: width - LEFT - RIGHT,
  h: height - TOP - BOTTOM,
});

const spec = $derived(INSTRUMENT.traces[measure]);
const lines = $derived(series.map((s) => ({ s, d: derive(s) })));
// Auto-scale: the value axis fits every vehicle's data. A nice tick step is
// chosen for about five ticks, and the top is the next step above the peak.
// Measures that can go negative stay symmetric about zero.
const peak = $derived(
  Math.max(1, ...lines.flatMap(({ d }) => d.traces[measure].map(Math.abs))),
);
const step = $derived(niceCeil(peak / (spec.min < 0 ? 2.5 : 5)));
const range = $derived.by(() => {
  const top = Math.ceil(peak / step) * step;
  return spec.min < 0 ? { min: -top, max: top } : { min: 0, max: top };
});
const valueTicks = $derived.by(() => {
  const out: number[] = [];
  for (let v = Math.ceil(range.min / step) * step; v <= range.max; v += step)
    out.push(v);
  return out;
});
const seconds = Array.from({ length: INSTRUMENT.seconds + 1 }, (_, i) => i);

const x = (t: number) => plot.x + (t / TOTAL_TICKS) * plot.w;
const y = (v: number) =>
  plot.y + plot.h - ((v - range.min) / (range.max - range.min)) * plot.h;
function points(values: number[]) {
  return values
    .map((v, t) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
}
const fmt = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);
</script>

<div class="graph" style={`width:${width}px;height:${height}px`}>
  <div class="surface"></div>
  <svg
    viewBox={`0 0 ${width} ${height}`}
    {width}
    {height}
    role="img"
    aria-label={`${spec.label} in ${spec.unit} against time, ${range.min} to ${range.max}`}
  >
    <!-- Grid: value ticks across, seconds down. -->
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
        x1={x(sec * 60)}
        x2={x(sec * 60)}
        y1={plot.y}
        y2={plot.y + plot.h}
        class="grid"
      />
      <text
        x={x(sec * 60)}
        y={plot.y + plot.h + 16}
        class="tick"
        text-anchor="middle"
      >
        {sec}
      </text>
    {/each}
    <!-- Axes. -->
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

    {#each lines as { s, d }}
      <polyline
        points={points(d.traces[measure])}
        fill="none"
        stroke={s.color}
        stroke-width="1.6"
      />
    {/each}
    <line
      x1={x(tick)}
      x2={x(tick)}
      y1={plot.y}
      y2={plot.y + plot.h}
      class="cursor"
    />
    {#each lines as { s, d }}
      <circle
        cx={x(tick)}
        cy={y(d.traces[measure][tick])}
        r="3.5"
        fill={s.color}
        class="dot"
      />
    {/each}
  </svg>

  <!-- Title row: the measure and unit at left, values at the cursor at right. -->
  <div class="head" style={`left:${LEFT}px;right:${RIGHT}px;height:${TOP}px`}>
    <span class="name">{spec.label}</span>
    <span class="unit">{spec.unit}</span>
    <span class="values">
      <span class="at">{(tick / 60).toFixed(2)} s</span>
      {#each lines as { s, d }}
        <b style={`color:${s.color}`}
          >{fmt(Math.round(d.traces[measure][tick]))}</b
        >
      {/each}
    </span>
  </div>
</div>

<style>
.graph {
  position: relative;
  font-family: var(--font-flight);
}
/* Elevation 2 from the host's display material, with the black shadow. */
.surface {
  position: absolute;
  inset: 0;
  background: var(--_elev-2);
  box-shadow:
    var(--_elev-2-inset, 0 0 #0000),
    0 8px 24px rgb(0 0 0 / 0.7);
}
svg {
  position: absolute;
  inset: 0;
  display: block;
}
.grid {
  stroke: var(--color-flight-trail);
}
.zero,
.axis {
  stroke: var(--color-text-dim);
}
.tick {
  fill: var(--color-text-dim);
  font: 13px var(--font-flight);
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
  color: var(--color-text-dim);
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
  color: var(--color-text-dim);
}
.values b {
  min-width: 3ch;
  font-weight: normal;
  text-align: right;
}
</style>
