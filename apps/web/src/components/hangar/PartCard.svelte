<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import { PARTS, type PartId, partFigures } from "@void-drift/mode-a";
import { FIGURE_GLYPH } from "./figure-glyphs";
import PartDrawing from "./PartDrawing.svelte";

let {
  id,
  fitted,
  playground,
  onchoose,
}: { id: PartId; fitted: boolean; playground: boolean; onchoose: () => void } =
  $props();
const descriptionId = $props.id();
const part = $derived(PARTS[id]);
const unsanctioned = $derived(part.releaseClass === "preview");
const blocked = $derived(fitted && unsanctioned && !playground);
const locked = $derived(unsanctioned && !playground);
</script>
<button
  type="button"
  class="btn btn-normal btn-card card"
  class:fitted={fitted && !blocked}
  class:blocked
  aria-pressed={fitted}
  aria-disabled={locked ? "true" : undefined}
  aria-describedby={unsanctioned ? descriptionId : undefined}
  onclick={() => {
    if (!locked && !blocked) onchoose();
  }}
>
  {#if unsanctioned}
    <span hidden id={descriptionId}
      >{blocked
        ? "Unsanctioned. Remove or replace this part, or turn Playground on to launch."
        : unsanctioned
          ? "Unsanctioned"
          : undefined}</span
    >
  {/if}
  <span class="drawing"><PartDrawing {id} /></span>
  <span class="text">
    <span class="name">{part.name}</span>
    <span class="prose">{part.fluff || part.description}</span>
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
  {#if unsanctioned}
    <span class="unsanctioned-band" aria-hidden="true"></span>
  {/if}
</button>
<style>
/* No body: the button's pane is left out, so the surface under the card
   shows through. The tint while held is kept. */
.card.btn-normal:not(.fitted, .blocked, [aria-disabled="true"]):active {
  --_fill: color-mix(in srgb, var(--color-action) 28%, transparent);
}
/* The layout inside the button. Everything about the pane, its cut, its
   brackets and its pointer, focus and held states is the shared button's. */
.card.btn {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: start;
  justify-content: stretch;
  gap: var(--spacing-xs);
  width: 300px;
  min-height: 0;
  /* 4 around the drawing; on the right, room for the band, which is as wide
     as the corner cut. */
  padding: var(--spacing-xs) calc(var(--spacing-xs) + var(--button-cut-size))
    var(--spacing-xs) var(--spacing-xs);
  font-size: inherit;
  line-height: inherit;
  text-align: left;
  /* The shared button marks a pressed button with a lime bar along its
     bottom. The card does not use it. */
}
/* Fitted: black behind the card, as in the Hangar today, and the brackets
   stay lit. */
.card.btn-normal.fitted {
  --btn-edge: var(--color-selected);
  --_fill: var(--color-void);
  cursor: default;
}
/* Unsanctioned and still fitted with Playground off: red brackets and band,
   and a faint red tint behind the card. */
.card.btn-normal.blocked {
  --btn-edge: var(--color-red);
  --_fill: color-mix(in srgb, var(--color-red) 10%, transparent);
  cursor: default;
}
@media (prefers-reduced-motion: reduce) {
  .card.btn,
  .card.btn::before {
    transition: none;
  }
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
  display: grid;
  grid-template-columns: 5ch repeat(3, minmax(max-content, 1fr));
  gap: var(--spacing-sm);
  /* 16 from the left and right edges, 8 above and below. */
  margin: var(--spacing-xs)
    calc(var(--spacing-md) - var(--spacing-xs) - var(--button-cut-size))
    var(--spacing-xs) calc(3 * var(--spacing-xs));
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
/* Unsanctioned with Playground off: listed, and it cannot be pressed. The
   whole card is faded to a quarter of its strength and nothing in it is
   recoloured. The shared button's muted text for an unavailable button is
   set back. */
.card.btn-normal[aria-disabled="true"]:not(.blocked) {
  opacity: 0.25;
  color: var(--color-text);
}
</style>
