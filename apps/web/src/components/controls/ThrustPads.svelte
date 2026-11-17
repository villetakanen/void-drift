<script lang="ts">
import type { ThrustPad } from "@void-drift/core";
import { hitPad, type PadSide, padAssembly, svgPoints } from "./thrust-pads";

// One gutter's thrust-pad assembly: draws the turn and burn panes, lights the
// pads it is given, and reports each pointer's pad. It never resolves actions.
interface Props {
  side: PadSide;
  /** Pads to light, from the resolved action (`litPads`). */
  lit?: readonly ThrustPad[];
  /** A pointer pressed `pad`, slid onto it, or released (`null`). */
  onpress?: (pointerId: number, pad: ThrustPad | null) => void;
}

const { side, lit = [], onpress }: Props = $props();

// Two-line markings: arrow and action, then the engines it fires.
const MARKINGS: Record<ThrustPad, readonly [string, string]> = {
  leftUpper: ["◀ TURN", "LEFT ENGINE"],
  leftLower: ["▲ BURN", "BOTH ENGINES"],
  rightUpper: ["▶ TURN", "RIGHT ENGINE"],
  rightLower: ["▲ BURN", "BOTH ENGINES"],
};
const NAMES: Record<ThrustPad, string> = {
  leftUpper: "Left turn pad",
  leftLower: "Left burn pad",
  rightUpper: "Right turn pad",
  rightLower: "Right burn pad",
};

let host: HTMLDivElement;
let width = $state(0);
let height = $state(0);
const assembly = $derived(padAssembly(side, width, height));

// Pointers this assembly owns, with the pad each one holds.
const held = new Map<number, ThrustPad>();

function padAt(event: PointerEvent) {
  const box = host.getBoundingClientRect();
  return hitPad(assembly, event.clientX - box.left, event.clientY - box.top);
}

function release(event: PointerEvent) {
  if (!held.delete(event.pointerId)) return;
  onpress?.(event.pointerId, null);
}

function down(event: PointerEvent) {
  const pad = padAt(event);
  if (!pad || !(event.target instanceof Element)) return;
  event.preventDefault();
  // Capture keeps a sliding thumb reporting after it leaves the pane it hit.
  event.target.setPointerCapture(event.pointerId);
  held.set(event.pointerId, pad);
  onpress?.(event.pointerId, pad);
}

function move(event: PointerEvent) {
  const current = held.get(event.pointerId);
  if (current === undefined) return;
  const pad = padAt(event);
  if (pad === current) return;
  if (pad === null) {
    // Leaving the assembly releases the press.
    release(event);
    if (event.target instanceof Element)
      event.target.releasePointerCapture(event.pointerId);
    return;
  }
  held.set(event.pointerId, pad);
  onpress?.(event.pointerId, pad);
}

// A long press must not open a context menu over the pads; on unmount every
// held pointer is released.
$effect(() => {
  const block = (event: Event) => event.preventDefault();
  host.addEventListener("contextmenu", block);
  return () => {
    host.removeEventListener("contextmenu", block);
    for (const id of held.keys()) onpress?.(id, null);
    held.clear();
  };
});
</script>

<div
  class="thrust-pads"
  data-side={side}
  bind:this={host}
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  <svg
    viewBox={`0 0 ${assembly.width} ${assembly.height}`}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={release}
    onpointercancel={release}
    onlostpointercapture={release}
  >
    <title>{side === "left" ? "Left thrust pads" : "Right thrust pads"}</title>
    {#each assembly.panes as pane (pane.pad)}
      <polygon
        class={["pane", pane.role, lit.includes(pane.pad) && "lit"]}
        points={svgPoints(pane.points)}
        data-pad={pane.pad}
        data-lit={lit.includes(pane.pad)}
      >
        <title>{NAMES[pane.pad]}</title>
      </polygon>
    {/each}
    {#each assembly.panes as pane (pane.pad)}
      {@const [x, y] = pane.mark}
      {@const [code, caption] = MARKINGS[pane.pad]}
      <text class="mark" {x} {y} aria-hidden="true">
        <tspan class="mark-code" {x} dy="-0.6em">{code}</tspan>
        <tspan {x} dy="1.2em">{caption}</tspan>
      </text>
    {/each}
  </svg>
</div>

<style>
/* The box is the gutter; only the panes take pointers, so whatever the box
   covers above the sloped top stays reachable. */
.thrust-pads {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

svg {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.pane {
  pointer-events: auto;
  touch-action: none;
}

.turn {
  fill: var(--color-pad-turn);
}

.burn {
  fill: var(--color-pad-burn);
}

.turn.lit {
  fill: var(--color-pad-turn-lit);
}

.burn.lit {
  fill: var(--color-pad-burn-lit);
}

.mark {
  fill: var(--color-text);
  font-family: var(--font-family-ui);
  font-size: var(--font-size-caption);
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

.mark-code {
  font-weight: var(--font-weight-bold);
}
</style>
