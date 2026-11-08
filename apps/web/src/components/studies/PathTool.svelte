<script lang="ts">
import OptionToggle from "./OptionToggle.svelte";
import { niceCeil, type PathSeries } from "./path-instrument";

// Study-local (02.8): the path tool as a component. Givens: a square plot, one
// 50% column wide, the scale switch, its numbers, and the area of space shown
// by the grid. It draws in its own coordinates (672 wide); the host scales it.
let {
  series,
  tick,
  edge,
  scale = 1,
}: {
  series: PathSeries[];
  /** Sample index marked on every path. */
  tick: number;
  /** Study variable: how the plot's edge separates it from the surface. */
  edge:
    | "border-white"
    | "border-brand"
    | "shadow-white"
    | "shadow-brand"
    | "shadow-black";
  /** Host's scale, so dragging follows the pointer. */
  scale?: number;
} = $props();

const W = 672;
// The tool is the square display itself; its title and numbers sit on it.
const PLOT = { x: 0, y: 0, w: W, h: W };
const H = W;
const DEFAULT_SCALE = 0.2;
const DEFAULT_GRID = 500;
const TICK = 16;

let mode = $state<"fit" | "default">("fit");
let pan = $state({ x: PLOT.x + 40, y: PLOT.y + PLOT.h / 2 });
let dragging = $state(false);
let last = { x: 0, y: 0 };

const fit = $derived.by(() => {
  const pts = series.flatMap((s) => s.samples);
  const xs = pts.map((p) => p.x),
    ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  const m = 48;
  const s = Math.min(
    (PLOT.w - 2 * m) / Math.max(1, x1 - x0),
    (PLOT.h - 2 * m) / Math.max(1, y1 - y0),
  );
  return {
    s,
    ox: PLOT.x + (PLOT.w - (x1 - x0) * s) / 2 - x0 * s,
    oy: PLOT.y + (PLOT.h - (y1 - y0) * s) / 2 - y0 * s,
  };
});
const view = $derived(
  mode === "fit" ? fit : { s: DEFAULT_SCALE, ox: pan.x, oy: pan.y },
);
const grid = $derived(mode === "fit" ? niceCeil(100 / view.s) : DEFAULT_GRID);
const sx = (x: number) => view.ox + x * view.s;
const sy = (y: number) => view.oy + y * view.s;
function lines(o: number, from: number, extent: number) {
  const out: number[] = [];
  const start = Math.ceil((from - o) / view.s / grid) * grid;
  for (let v = start; o + v * view.s <= from + extent; v += grid) out.push(v);
  return out;
}
const gridX = $derived(lines(view.ox, PLOT.x, PLOT.w));
const gridY = $derived(lines(view.oy, PLOT.y, PLOT.h));
// The area of space the plot shows, in world units.
const area = $derived(Math.round(PLOT.w / view.s));

function choose(next: "fit" | "default") {
  mode = next;
  if (next === "default") pan = { x: PLOT.x + 40, y: PLOT.y + PLOT.h / 2 };
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
</script>

<div class="tool" style={`width:${W}px;height:${H}px`}>
  <!-- The plot's surface: elevation 2, with the edge under study. -->
  <div
    class={`surface ${edge}`}
    style={`top:${PLOT.y}px;left:${PLOT.x}px;width:${PLOT.w}px;height:${PLOT.h}px`}
  ></div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svg
    class="plot"
    class:pan={mode === "default"}
    class:dragging
    viewBox={`0 0 ${W} ${H}`}
    width={W}
    height={H}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={() => (dragging = false)}
    onpointercancel={() => (dragging = false)}
    role="img"
    aria-label="Plan view of every path with a marker at the current time"
  >
    <defs>
      <clipPath {id}>
        <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} />
      </clipPath>
    </defs>
    <g clip-path={`url(#${id})`}>
      {#each gridX as g}
        <line
          x1={sx(g)}
          x2={sx(g)}
          y1={PLOT.y}
          y2={PLOT.y + PLOT.h}
          class={g === 0 ? "axis" : "grid"}
        />
      {/each}
      {#each gridY as g}
        <line
          x1={PLOT.x}
          x2={PLOT.x + PLOT.w}
          y1={sy(g)}
          y2={sy(g)}
          class={g === 0 ? "axis" : "grid"}
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
        {@const p = s.samples[tick]}
        {@const v = Math.hypot(p.vx, p.vy)}
        {#if v > 1e-6}
          <line
            x1={sx(p.x) + (p.vy / v) * TICK}
            y1={sy(p.y) - (p.vx / v) * TICK}
            x2={sx(p.x) - (p.vy / v) * TICK}
            y2={sy(p.y) + (p.vx / v) * TICK}
            stroke={s.color}
            stroke-width="1.5"
            stroke-linecap="round"
          />
        {/if}
        <circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill="none" class="ring" />
        <circle cx={sx(p.x)} cy={sy(p.y)} r="2.5" fill={s.color} />
      {/each}
    </g>
  </svg>

  <!-- Title and numbers read on one line in the display's bottom right. -->
  <dl class="readout" style={`bottom:8px;right:8px`}>
    <dt class="name">Paths</dt>
    <dd>{area} × {area} u</dd>
    <dd>grid {grid} u</dd>
    <dd>{view.s.toFixed(3)} px/u</dd>
  </dl>

  <div class="tools" style={`top:${PLOT.y + 8}px;right:8px`}>
    <OptionToggle
      hover="tint"
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
.tool {
  position: relative;
  font-family: var(--font-flight);
}
/* One 24px line: the readout keeps the 4px rhythm on the display. */
.readout {
  position: absolute;
  z-index: 1;
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
  color: var(--color-text-dim);
  font-size: 15px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.plot {
  position: absolute;
  z-index: 0;
  inset: 0;
  display: block;
  user-select: none;
}
.plot.pan {
  cursor: grab;
  touch-action: none;
}
.plot.dragging {
  cursor: grabbing;
}
/* Elevation 2 is supplied by the host as a material: a background, an
   optional inner highlight and an optional backdrop filter. */
.surface {
  position: absolute;
  box-sizing: border-box;
  background: var(--_elev-2);
  backdrop-filter: var(--_elev-2-filter, none);
}
.border-white {
  border: 1px solid var(--color-text);
}
.border-brand {
  border: 1px solid var(--color-acid-lime);
}
.shadow-white {
  box-shadow: 0 0 24px color-mix(in srgb, var(--color-text) 25%, transparent);
}
.shadow-brand {
  box-shadow: 0 0 24px
    color-mix(in srgb, var(--color-acid-lime) 25%, transparent);
}
.shadow-black {
  box-shadow:
    var(--_elev-2-inset, 0 0 #0000),
    0 8px 24px rgb(0 0 0 / 0.7);
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
.tools {
  position: absolute;
  z-index: 1;
}
</style>
