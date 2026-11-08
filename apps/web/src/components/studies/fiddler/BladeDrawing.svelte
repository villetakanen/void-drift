<script lang="ts">
import { type BladeFace, normal } from "./blade-assembly";
import type { Point3 } from "./wasp-side";

let {
  faces,
  view,
  label,
  pair = false,
  cut = false,
}: {
  faces: readonly BladeFace[];
  view: string;
  label: string;
  pair?: boolean;
  cut?: boolean;
} = $props();

function project([x, y, z]: Point3): readonly [number, number] {
  if (view === "Top") return [x, y];
  const aft = y - 23;
  return [
    x * 0.866 - aft * 0.5,
    (x * 0.5 + aft * 0.866) * 0.62 - z * 0.785 + 24,
  ];
}
const points = (list: readonly Point3[]) =>
  list.map((p) => project(p).join(",")).join(" ");
function visible(list: readonly BladeFace[]) {
  const camera: Point3 = view === "Top" ? [0, 0, 1] : [0.3925, 0.67981, 0.62];
  const dot = (p: Point3) =>
    p[0] * camera[0] + p[1] * camera[1] + p[2] * camera[2];
  const depth = (face: BladeFace) =>
    face.points.reduce((sum, p) => sum + dot(p), 0) / face.points.length;
  return list
    .filter((face) => dot(normal(face.points)) > 0.00001)
    .sort((a, b) => depth(a) - depth(b));
}
</script>

<svg
  viewBox={pair
    ? view === "Top"
      ? "-27 -5 54 62"
      : "-35 -5 70 62"
    : view === "Top"
      ? "-13 -5 25 57"
      : "-21 -5 40 59"}
  role="img"
  aria-label={label}
>
  {#each visible(faces) as face}
    <polygon
      points={points(face.points)}
      fill={face.color}
      opacity={face.kind === "joint" ? 0.32 : 1}
    />
  {/each}
  {#if cut}
    <polyline
      class="cut"
      points={points([
        [-20, 52, 0],
        [20, 52, 0],
      ])}
    />
  {/if}
</svg>

<style>
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 390px;
}
.cut {
  stroke: var(--color-text-muted);
  stroke-width: 0.2;
  stroke-dasharray: 1 1;
  fill: none;
}
</style>
