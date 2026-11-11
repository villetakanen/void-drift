<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.11: the card from 02.10, version 4, with two things
// tried. The two lines of text are draft prose written for this page, not the
// catalog's description. The line of figures along the bottom is spaced three
// ways. Six parts stand for the twelve: two engines, two weapons, two support
// parts, with and without a drawing, sanctioned and unsanctioned. Still a
// plain card: no fitted state, nothing decided about colours or edges.
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
    id: "packed",
    name: "A / Packed to the left",
    note: "As in 02.10. Each figure follows the last.",
  },
  {
    id: "columns",
    name: "B / Four columns",
    note: "Mass always in the first column, so figures line up down the list.",
  },
  {
    id: "ruled",
    name: "C / Four columns under a rule",
    note: "As B, with a thin line and a little air between text and figures.",
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
.packed .line {
  display: flex;
  flex-wrap: wrap;
  gap: 2px var(--spacing-md);
}
.columns .line,
.ruled .line {
  display: grid;
  grid-template-columns: 5ch repeat(3, minmax(max-content, 1fr));
  gap: var(--spacing-sm);
  padding-inline: var(--spacing-xs);
}
.ruled .line {
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--color-border-faint);
}
</style>
