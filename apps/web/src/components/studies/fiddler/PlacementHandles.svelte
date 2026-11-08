<script lang="ts">
import { CAPACITY_VIEW } from "./connected-form";

let {
  handles,
  label,
  onmove,
  onselect,
}: {
  handles: { id: string; x: number; y: number; label: string }[];
  label: string;
  onmove: (id: string, x: number, y: number) => void;
  onselect: (id: string) => void;
} = $props();
const { width, height, zoom } = CAPACITY_VIEW;
let overlay: SVGSVGElement;
let drag = $state<{
  pointer: number;
  id: string;
  dx: number;
  dy: number;
} | null>(null);
function point(event: PointerEvent) {
  const rect = overlay.getBoundingClientRect();
  return [
    (((event.clientX - rect.left) * width) / rect.width - width / 2) / zoom,
    (((event.clientY - rect.top) * height) / rect.height - height / 2) / zoom,
  ];
}
function start(event: PointerEvent, handle: (typeof handles)[number]) {
  if (event.button !== 0) return;
  event.preventDefault();
  const [x, y] = point(event);
  drag = {
    pointer: event.pointerId,
    id: handle.id,
    dx: handle.x - x,
    dy: handle.y - y,
  };
  onselect(handle.id);
  if (event.currentTarget instanceof SVGGElement) {
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
  }
}
function move(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointer) return;
  const [x, y] = point(event);
  onmove(
    drag.id,
    Math.round((x + drag.dx) * 10) / 10,
    Math.round((y + drag.dy) * 10) / 10,
  );
}
function stop(event: PointerEvent) {
  if (
    event.currentTarget instanceof SVGGElement &&
    event.currentTarget.hasPointerCapture(event.pointerId)
  )
    event.currentTarget.releasePointerCapture(event.pointerId);
  drag = null;
}
function key(event: KeyboardEvent, handle: (typeof handles)[number]) {
  const d = event.shiftKey ? 2 : 0.5;
  const delta: Record<string, readonly [number, number]> = {
    ArrowLeft: [-d, 0],
    ArrowRight: [d, 0],
    ArrowUp: [0, -d],
    ArrowDown: [0, d],
  };
  const change = delta[event.key];
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onselect(handle.id);
  }
  if (!change) return;
  event.preventDefault();
  onselect(handle.id);
  onmove(handle.id, handle.x + change[0], handle.y + change[1]);
}
</script>

<svg
  bind:this={overlay}
  viewBox={`0 0 ${width} ${height}`}
  aria-label={label}
  class:dragging={!!drag}
>
  <g transform={`translate(${width / 2} ${height / 2}) scale(${zoom})`}>
    {#each handles as handle (handle.id)}
      <!-- biome-ignore lint/a11y/useSemanticElements: An SVG drag handle needs button semantics within the shared drawing transform. -->
      <g
        class="handle"
        role="button"
        tabindex="0"
        aria-label={handle.label}
        onpointerdown={(event) => start(event, handle)}
        onpointermove={move}
        onpointerup={stop}
        onpointercancel={stop}
        onlostpointercapture={() => (drag = null)}
        onfocus={() => onselect(handle.id)}
        onkeydown={(event) => key(event, handle)}
      >
        <circle cx={handle.x} cy={handle.y} r="6" fill="transparent" />
        <circle class="outline" cx={handle.x} cy={handle.y} r="4.4" />
      </g>
    {/each}
  </g>
</svg>

<style>
svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.handle {
  pointer-events: all;
  cursor: grab;
  touch-action: none;
  outline: none;
}
.outline {
  fill: none;
  stroke: var(--color-action);
  stroke-width: 0.35;
  opacity: 0;
}
.handle:hover .outline,
.handle:focus-visible .outline,
.dragging .handle:focus .outline {
  opacity: 1;
}
.dragging .handle {
  cursor: grabbing;
}
</style>
