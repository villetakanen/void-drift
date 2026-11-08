<script lang="ts">
import CapacityDrawing from "./CapacityDrawing.svelte";
import { CAPACITY_VIEW } from "./connected-form";
import {
  WINDOW_LENGTH,
  WINDOW_WIDTH,
  type WindowDraft,
  windowOutline,
} from "./window-placement";

let {
  draft,
  view,
  onmove,
}: {
  draft: WindowDraft;
  view: string;
  onmove: (x: number, y: number) => void;
} = $props();
let overlay: SVGSVGElement;
let handle: SVGGElement;
let drag = $state<{ id: number; dx: number; dy: number } | null>(null);
const { width, height, zoom } = CAPACITY_VIEW;
const points = $derived(
  windowOutline(draft)
    .map((p) => p.join(","))
    .join(" "),
);
const hitWidth = $derived(Math.max(12, WINDOW_WIDTH * draft.scale));
const hitHeight = $derived(Math.max(14, WINDOW_LENGTH * draft.scale));
function point(event: PointerEvent) {
  const rect = overlay.getBoundingClientRect();
  return [
    (((event.clientX - rect.left) * width) / rect.width - width / 2) / zoom,
    (((event.clientY - rect.top) * height) / rect.height - height / 2) / zoom,
  ];
}
function start(event: PointerEvent) {
  if (event.button !== 0) return;
  event.preventDefault();
  const [x, y] = point(event);
  drag = { id: event.pointerId, dx: draft.x - x, dy: draft.y - y };
  handle.focus();
  handle.setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id) return;
  const [x, y] = point(event);
  onmove(
    Math.round((x + drag.dx) * 10) / 10,
    Math.round((y + drag.dy) * 10) / 10,
  );
}
function stop(event: PointerEvent) {
  if (handle.hasPointerCapture(event.pointerId))
    handle.releasePointerCapture(event.pointerId);
  drag = null;
}
function key(event: KeyboardEvent) {
  const d = event.shiftKey ? 2 : 0.5;
  const changes: Record<string, readonly [number, number]> = {
    ArrowLeft: [-d, 0],
    ArrowRight: [d, 0],
    ArrowUp: [0, -d],
    ArrowDown: [0, d],
  };
  const change = changes[event.key];
  if (!change) return;
  event.preventDefault();
  onmove(draft.x + change[0], draft.y + change[1]);
}
</script>

<div class="editor" class:dragging={!!drag}>
  <CapacityDrawing
    ship="fiddler"
    hullScale={1.35}
    {view}
    windowDraft={draft}
    label={`Fiddler window editor, ${view.toLowerCase()} view`}
  />
  <svg
    bind:this={overlay}
    viewBox={`0 0 ${width} ${height}`}
    aria-label="Window drag controls"
  >
    <g transform={`translate(${width / 2} ${height / 2}) scale(${zoom})`}>
      <!-- biome-ignore lint/a11y/useSemanticElements: An SVG drag handle needs button semantics within the shared drawing transform. -->
      <g
        bind:this={handle}
        class="handle"
        role="button"
        tabindex="0"
        aria-label="Move window: drag or use arrow keys; Shift moves faster"
        onpointerdown={start}
        onpointermove={move}
        onpointerup={stop}
        onpointercancel={stop}
        onlostpointercapture={() => (drag = null)}
        onkeydown={key}
      >
        <rect
          x={draft.x - hitWidth / 2}
          y={draft.y - hitHeight / 2}
          width={hitWidth}
          height={hitHeight}
          fill="transparent"
        />
        <polygon {points} class="outline" />
      </g>
    </g>
  </svg>
</div>

<style>
.editor {
  position: relative;
}
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
  stroke-width: 0.45;
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
