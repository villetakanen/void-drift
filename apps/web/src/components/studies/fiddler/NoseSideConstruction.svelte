<script lang="ts">
import { WASP } from "@void-drift/mode-a";
import Toggle from "../../inputs/Toggle.svelte";
import {
  WASP_SIDE as faces,
  type Point3 as Point,
  WASP_SIDE_INDICES as selected,
  waspUpright as upright,
} from "./wasp-side";

let { label = "Nose and side construction view" }: { label?: string } =
  $props();
let view = $state("Top");
const crease = faces[1].points.slice(0, 2);
const innerCorner = faces[1].points[2];
function project([x, y, z]: Point): readonly [number, number] {
  if (view === "Top") return [(x + 3.7) * 1.5, y * 1.5];
  const centred = y - 20;
  return [
    (x * 0.866 + centred * 0.5 + 3.7) * 1.5,
    ((centred * 0.866 - x * 0.5) * 0.62 - z * 0.785 + 24) * 1.5,
  ];
}
const points = (list: readonly Point[]) =>
  list.map((point) => project(point).join(",")).join(" ");
</script>

<div class="controls">
  <Toggle {label} options={["Top", "Angled"]} bind:value={view} />
  <p class="caption" aria-live="polite">
    One side only · extracted faces enlarged 1.5×
  </p>
</div>
<div class="comparison">
  <figure>
    <figcaption>Wasp / two faces on the left side</figcaption>
    <svg
      viewBox="-23 -8 46 62"
      role="img"
      aria-label="Only Wasp's left nose and left cockpit-side face highlighted"
    >
      {#each WASP.facets as face, i}
        <polygon
          points={face.points.map((p) => upright(p).join(",")).join(" ")}
          fill={face.color}
          opacity={selected.includes(i) || face.color === "#000000" ? 1 : 0.16}
        />
      {/each}
      <path class="guide" d="M -6,15 L -3,15" />
      <path class="leader" d="M -3,5 L -16,5 M -5,25 L -16,29" />
      <text x="-19" y="6">1</text>
      <text x="-19" y="30">2</text>
    </svg>
    <p>
      <strong>1 · Nose. 2 · Long side.</strong>
      These are the two original polygons to carry over. Their inner contour
      follows the cockpit opening and then the body behind it.
    </p>
  </figure>
  <figure>
    <figcaption>Isolated copy / inner and outer edges intact</figcaption>
    <svg
      viewBox="-23 -8 46 62"
      role="img"
      aria-label={`Wasp's original left nose and side polygons isolated with their inner cut-out intact, ${view.toLowerCase()} view`}
    >
      {#each faces as face}
        <polygon points={points(face.points)} fill={face.color} />
      {/each}
      <polyline class="guide" points={points(crease)} />
      <path
        class="leader"
        d={`M ${project(innerCorner).join(",")} L 8,${project(innerCorner)[1]}`}
      />
      <text x="9" y={project(innerCorner)[1] + 0.8}>inner edge</text>
    </svg>
    <p>
      The cockpit and the fuselage behind this side have been cut away. Every
      vertex of the two exposed faces remains. The complex inner edge stays
      open; the copy has not been lengthened.
    </p>
  </figure>
</div>
<p class="caption">
  Top shows an exact copy of both polygon contours, enlarged for inspection.
  Angled lifts those same polygons onto two adjoining planes; the height is
  illustrative. The dashed join is a guide. An inner wall, underside and root
  are not defined by these two surfaces.
</p>

<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md) var(--spacing-lg);
  margin-block: var(--spacing-lg);
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  max-width: var(--measure-prose);
}
.comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-xl);
}
figure {
  margin: 0;
  min-width: 0;
}
figcaption {
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
  min-height: 5em;
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 360px;
}
svg text {
  fill: var(--color-text-muted);
  font: 2.2px var(--font-family-ui);
}
.guide {
  fill: none;
  stroke: var(--color-text);
  stroke-width: 0.2;
  stroke-dasharray: 0.6 0.6;
}
.leader {
  fill: none;
  stroke: var(--color-text-muted);
  stroke-width: 0.15;
}
figure p {
  margin-block: var(--spacing-md);
}
@media (max-width: 600px) {
  .comparison {
    gap: var(--spacing-md);
  }
  figcaption {
    min-height: 6em;
    font-size: var(--font-size-caption);
  }
  figure p {
    font-size: var(--font-size-caption);
  }
}
</style>
