<script lang="ts">
import { TOTAL_TICKS } from "./movement-bench";
import {
  derive,
  INSTRUMENT,
  niceCeil,
  PathSeries,
  type Scale,
  type TraceKey,
} from "./path-instrument";

let {
  series,
  scale,
  label,
  tick,
  part = "all",
  legend = true,
}: {
  series: PathSeries[];
  scale: Scale;
  label: string;
  /** Sample index to mark with a cursor on every view; none when omitted. */
  tick?: number;
  /** "traces" draws only the three traces and the input strip. */
  part?: "all" | "traces";
  legend?: boolean;
} = $props();

const W = 720,
  H = 400;
const viewBox = $derived(
  part === "traces" ? `350 0 370 ${H}` : `0 0 ${W} ${H}`,
);
const keys: TraceKey[] = ["speed", "acceleration", "turn"];
const measured = $derived(series.map((s) => derive(PathSeries.parse(s))));

const ranges = $derived.by(() => {
  const out = {} as Record<TraceKey, { min: number; max: number }>;
  for (const key of keys) {
    const fixed = INSTRUMENT.traces[key];
    if (scale === "fixed") {
      out[key] = { min: fixed.min, max: fixed.max };
      continue;
    }
    const values = measured.flatMap((d) => d.traces[key]);
    const peak = niceCeil(Math.max(...values.map(Math.abs)));
    out[key] = { min: fixed.min < 0 ? -peak : 0, max: peak };
  }
  return out;
});

// Path window: equal scale on both axes, fixed or fitted to this run.
const window_ = $derived.by(() => {
  if (scale === "fixed") return INSTRUMENT.path;
  const pts = measured.flatMap((d) => d.path);
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const x0 = Math.min(0, ...xs),
    y0 = Math.min(0, ...ys);
  const size =
    Math.max(Math.max(1, ...xs) - x0, Math.max(1, ...ys) - y0) * 1.06;
  return { x0, y0, size };
});

const box = { x: 40, y: 20, w: 300, h: 300 };
const pathScale = $derived(box.w / window_.size);
const px = (x: number) => box.x + (x - window_.x0) * pathScale;
const py = (y: number) => box.y + (y - window_.y0) * pathScale;
const gridStep = $derived(niceCeil(window_.size / 6));
const gridX = $derived(
  Array.from(
    { length: Math.ceil(window_.size / gridStep) + 1 },
    (_, i) => Math.ceil(window_.x0 / gridStep) * gridStep + i * gridStep,
  ).filter((v) => v <= window_.x0 + window_.size),
);
const gridY = $derived(
  Array.from(
    { length: Math.ceil(window_.size / gridStep) + 1 },
    (_, i) => Math.ceil(window_.y0 / gridStep) * gridStep + i * gridStep,
  ).filter((v) => v <= window_.y0 + window_.size),
);

const plot = { x: 400, w: 300, h: 80, gap: 36, top: 20 };
function plotY(index: number) {
  return plot.top + index * (plot.h + plot.gap);
}
function valueY(key: TraceKey, v: number, index: number) {
  const r = ranges[key];
  const clamped = Math.max(r.min, Math.min(r.max, v));
  return plotY(index) + plot.h - ((clamped - r.min) / (r.max - r.min)) * plot.h;
}
function line(key: TraceKey, d: ReturnType<typeof derive>, index: number) {
  const r = ranges[key];
  const n = d.traces[key].length - 1;
  return d.traces[key]
    .map((v, i) => {
      const clamped = Math.max(r.min, Math.min(r.max, v));
      const x = plot.x + (i / n) * plot.w;
      const y =
        plotY(index) + plot.h - ((clamped - r.min) / (r.max - r.min)) * plot.h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
const clipped = $derived(
  scale === "fixed" &&
    keys.some((key) =>
      measured.some((d) =>
        d.traces[key].some(
          (v) =>
            v > INSTRUMENT.traces[key].max || v < INSTRUMENT.traces[key].min,
        ),
      ),
    ),
);
const inputY = plotY(3) - 10;
const bandWidth = plot.w / INSTRUMENT.input.length;
</script>

<figure>
  <svg {viewBox} role="img" aria-label={label}>
    <title>{label}</title>
    {#if part === "all"}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} class="frame" />
      {#each gridX as gx}
        <line
          x1={px(gx)}
          x2={px(gx)}
          y1={box.y}
          y2={box.y + box.h}
          class="grid"
        />
      {/each}
      {#each gridY as gy}
        <line
          x1={box.x}
          x2={box.x + box.w}
          y1={py(gy)}
          y2={py(gy)}
          class="grid"
        />
      {/each}
      <text x={box.x} y={box.y + box.h + 18} class="note">
        path · grid {gridStep} u · x {Math.round(window_.x0)}…{Math.round(
          window_.x0 + window_.size,
        )}
      </text>
      {#each measured as d}
        <polyline
          points={d.path
            .map((p) => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`)
            .join(" ")}
          fill="none"
          stroke={d.color}
          stroke-width="2"
        />
        <circle
          cx={px(d.path[0][0])}
          cy={py(d.path[0][1])}
          r="4"
          fill={d.color}
        />
      {/each}
    {/if}
    {#each keys as key, index}
      {@const r = ranges[key]}
      {@const spec = INSTRUMENT.traces[key]}
      <rect
        x={plot.x}
        y={plotY(index)}
        width={plot.w}
        height={plot.h}
        class="frame"
      />
      {#if r.min < 0}
        <line
          x1={plot.x}
          x2={plot.x + plot.w}
          y1={plotY(index) + plot.h / 2}
          y2={plotY(index) + plot.h / 2}
          class="grid"
        />
      {/if}
      <text x={plot.x} y={plotY(index) - 6} class="label">
        {spec.label}
        ({spec.unit})
      </text>
      <text x={plot.x - 6} y={plotY(index) + 10} class="tick" text-anchor="end">
        {r.max}
      </text>
      <text
        x={plot.x - 6}
        y={plotY(index) + plot.h}
        class="tick"
        text-anchor="end"
      >
        {r.min}
      </text>
      {#each measured as d}
        <polyline
          points={line(key, d, index)}
          fill="none"
          stroke={d.color}
          stroke-width="1.6"
        />
      {/each}
    {/each}
    {#each INSTRUMENT.input as step, i}
      <rect
        x={plot.x + i * bandWidth}
        y={inputY}
        width={bandWidth - 1}
        height="14"
        class={step === "–" ? "idle" : "active"}
      />
      <text
        x={plot.x + i * bandWidth + bandWidth / 2}
        y={inputY + 11}
        class="step"
        text-anchor="middle"
      >
        {step === "–" ? "" : step}
      </text>
    {/each}
    <text x={plot.x} y={inputY + 30} class="note">
      input per second · 0…{INSTRUMENT.seconds}
      s
    </text>
    {#if tick !== undefined}
      {@const cx = plot.x + (tick / TOTAL_TICKS) * plot.w}
      <line x1={cx} x2={cx} y1={plotY(0)} y2={inputY + 14} class="cursor" />
      {#each measured as d}
        {#each keys as key, index}
          <circle
            {cx}
            cy={valueY(key, d.traces[key][tick], index)}
            r="3.5"
            fill={d.color}
            class="dot"
          />
        {/each}
        {#if part === "all"}
          <circle
            cx={px(d.path[tick][0])}
            cy={py(d.path[tick][1])}
            r="6"
            fill="none"
            class="ring"
          />
          <circle
            cx={px(d.path[tick][0])}
            cy={py(d.path[tick][1])}
            r="2.5"
            fill={d.color}
          />
        {/if}
      {/each}
    {/if}
  </svg>
  {#if clipped}
    <p class="warn">
      Some values exceed the fixed range and are clipped at its edge.
    </p>
  {/if}
  {#if legend}
    <ul class="legend">
      {#each measured as d}
        <li><i style={`background:${d.color}`}></i>{d.label}</li>
      {/each}
    </ul>
  {/if}
</figure>

<style>
.cursor {
  stroke: var(--color-text);
  stroke-width: 1;
}
.dot,
.ring {
  stroke: var(--color-text);
  stroke-width: 1.5;
}
.ring {
  stroke-width: 2;
}
figure {
  margin: 0;
  container-type: inline-size;
}
svg {
  width: 100%;
  height: auto;
  display: block;
  background: var(--color-void-light);
  border: var(--flight-border);
}
.frame {
  fill: none;
  stroke: var(--color-text-dim);
  stroke-width: 1;
}
.grid {
  stroke: var(--color-flight-trail);
  stroke-width: 1;
}
text {
  fill: var(--color-text);
  font: 12px var(--font-flight);
}
.note,
.tick {
  fill: var(--color-text-dim);
  font-size: 11px;
}
.label {
  font-size: 12px;
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
  font-size: 10px;
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
.warn {
  margin: var(--spacing-sm) 0 0;
  color: var(--color-caution-tape);
  font: var(--font-small) var(--font-flight);
}
</style>
