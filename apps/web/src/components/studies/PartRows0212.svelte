<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.12: room around the figures. The card and its prose are
// as in 02.11, with the figures in four columns as settled there. Only one
// thing changes between the three examples: how far the line of figures
// stands from the card's left, right and bottom edges, and from the prose
// above it. The drawing keeps its 4 pixels. Still a plain card: no fitted
// state, nothing decided about colours or edges.
import { PARTS, type PartId } from "@void-drift/mode-a";
import Toggle from "../inputs/Toggle.svelte";
import PartDrawing from "./PartDrawing.svelte";
import { FIGURE_GLYPH, partFigures } from "./part-figures";
import { PART_PROSE } from "./part-prose";

const ids: PartId[] = [
  "ion",
  "plasma",
  "light-ion-cannon",
  "rail",
  "battery",
  "gravity-coil",
];
const spacings = [
  {
    id: "d8",
    name: "8 from the edges",
    note: "As in 02.11. 4 above the figures.",
  },
  {
    id: "d12",
    name: "12 from the edges",
    note: "8 above the figures.",
  },
  {
    id: "d16",
    name: "16 from the edges",
    note: "12 above the figures.",
  },
] as const;
const widths = { "299 wide": 299, "222 wide": 222, "400 wide": 400 } as const;
let widthName = $state<string>("299 wide");
const width = $derived(widths[widthName as keyof typeof widths]);
</script>

<div class="bench">
  <Toggle
    options={Object.keys(widths)}
    bind:value={widthName}
    label="Width of the parts column"
  />
  <div class="row">
    {#each spacings as spacing (spacing.id)}
      <section class="version" style:width="{width}px">
        <h4>{spacing.name}</h4>
        <p class="note">{spacing.note}</p>
        <div class="list {spacing.id}">
          {#each ids as id (id)}
            {@const part = PARTS[id]}
            <div class="card" class:band={part.releaseClass === "preview"}>
              <span class="drawing"><PartDrawing {id} /></span>
              <span class="text">
                <span class="name">{part.name}</span>
                <span class="prose">{PART_PROSE[id]}</span>
              </span>
              <span class="line">
                {#each partFigures(id) as figure}
                  <span class="stat" title={figure.label}>
                    <svg class="glyph" viewBox="0 0 12 12" aria-hidden="true">
                      <path d={FIGURE_GLYPH[figure.icon]} />
                    </svg>
                    <span class="sr">{figure.label}</span>{figure.value}
                  </span>
                {/each}
              </span>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>

<style>
.bench {
  display: grid;
  gap: var(--spacing-md);
  justify-items: start;
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg) var(--spacing-md);
  align-items: start;
}
.version {
  display: grid;
  gap: var(--spacing-xs);
}
h4,
p {
  margin: 0;
}
h4 {
  font-size: var(--font-size-label);
}
.note {
  min-height: 2.8em;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
.list {
  display: grid;
  gap: var(--spacing-xs);
}
.card {
  --_edge: var(--color-border);
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: start;
  gap: var(--spacing-xs);
  position: relative;
  /* 4px around the drawing; the right side leaves room for the band. */
  padding: var(--spacing-xs) calc(var(--spacing-xs) + var(--spacing-sm))
    var(--spacing-xs) var(--spacing-xs);
  border: 1px solid var(--_edge);
}
/* The settled mark: a hatched band in the colour of the card's border. */
.card.band::after {
  content: "";
  position: absolute;
  inset: 0 0 0 auto;
  width: var(--spacing-sm);
  background: repeating-linear-gradient(
    -45deg,
    var(--_edge) 0 2px,
    transparent 2px 6px
  );
}
.drawing {
  display: grid;
  place-items: center;
  height: 56px;
}
.drawing :global(svg) {
  width: 72px;
  height: 56px;
}
.text {
  display: grid;
  gap: 3px;
  align-self: center;
  min-width: 0;
}
.name {
  font-size: var(--font-control-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.prose {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: var(--font-size-caption);
  line-height: 1.35;
  color: var(--color-text-muted);
}
.line {
  grid-column: 1 / -1;
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
.stat {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  white-space: nowrap;
}
.glyph {
  width: 10px;
  height: 10px;
  fill: var(--color-text-muted);
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
/* Four columns, as settled in 02.11. The card's own padding is 4, so the
   line's margin is the distance from the edge less 4. */
.line {
  display: grid;
  grid-template-columns: 5ch repeat(3, minmax(max-content, 1fr));
  gap: var(--spacing-sm);
}
.d8 .line {
  margin: 0 var(--spacing-xs) var(--spacing-xs);
}
.d12 .line {
  margin: var(--spacing-xs) var(--spacing-sm) var(--spacing-sm);
}
.d16 .line {
  margin: var(--spacing-sm) calc(3 * var(--spacing-xs))
    calc(3 * var(--spacing-xs));
}
</style>
