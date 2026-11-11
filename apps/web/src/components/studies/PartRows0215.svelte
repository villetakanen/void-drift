<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.15: the card as a button. The card is the game's own
// normal button, made tall: the shared .btn and .btn-normal rules give it the
// pane, the cut corners, the dim brackets at its ends, and what happens under
// a pointer, on focus and when held. Only the layout inside, the bar that
// says fitted, and the hatched band are added here. Content, sizes and
// spacing are as settled up to 02.13. The three lists and the fixture are the
// same as in 02.14.
import "@void-drift/core/styles/buttons.css";
import { PARTS, type PartId } from "@void-drift/mode-a";
import PartDrawing from "./PartDrawing.svelte";
import { FIGURE_GLYPH, partFigures } from "./part-figures";
import { PART_PROSE } from "./part-prose";

const weapons: PartId[] = [
  "light-ion-cannon",
  "ion-point-defence",
  "rail",
  "laser",
];
const cases = [
  {
    id: "on",
    title: "Playground on",
    note: "Available, fitted, and unsanctioned but available.",
    playground: true,
    start: "light-ion-cannon",
  },
  {
    id: "on-unsanctioned",
    title: "Playground on, unsanctioned part fitted",
    note: "Fitted and unsanctioned. Permitted here.",
    playground: true,
    start: "rail",
  },
  {
    id: "off",
    title: "Playground off, unsanctioned part still fitted",
    note: "The build cannot launch until this part is replaced or removed.",
    playground: false,
    start: "rail",
  },
] as const;

let fitted = $state<Record<string, PartId>>(
  Object.fromEntries(cases.map((entry) => [entry.id, entry.start])),
);

function reset() {
  for (const entry of cases) fitted[entry.id] = entry.start;
}
</script>

<div class="bench">
  {#each cases as entry (entry.id)}
    <section class="case">
      <h4>{entry.title}</h4>
      <p class="note">{entry.note}</p>
      <div class="list">
        {#each weapons.filter(
          (id) =>
            entry.playground ||
            PARTS[id].releaseClass === "scored" ||
            id === fitted[entry.id],
        ) as id (id)}
          {@const part = PARTS[id]}
          {@const isFitted = id === fitted[entry.id]}
          {@const unsanctioned = part.releaseClass === "preview"}
          {@const blocked = isFitted && unsanctioned && !entry.playground}
          <button
            type="button"
            class="btn btn-normal card"
            class:fitted={isFitted && !blocked}
            class:blocked
            aria-pressed={isFitted}
            aria-label={unsanctioned ? `${part.name}, Unsanctioned` : undefined}
            onclick={() => {
              fitted[entry.id] = id;
            }}
          >
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
            {#if unsanctioned}
              <span class="hatch" aria-hidden="true"></span>
            {/if}
            {#if isFitted}
              <span class="bar" aria-hidden="true"></span>
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {/each}
</div>
<p class="reset">
  <button type="button" class="btn text-link" onclick={reset}>
    Reset the three lists
  </button>
</p>

<style>
.bench {
  display: grid;
  grid-template-columns: repeat(3, 299px);
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg) var(--spacing-md);
  font-family: var(--font-family-ui);
}
.case {
  display: grid;
  align-content: start;
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
/* The layout inside the button. Everything about the pane, its cut, its
   brackets and its pointer, focus and held states is the shared button's. */
.card.btn {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: start;
  justify-content: stretch;
  gap: var(--spacing-xs);
  width: 100%;
  min-height: 0;
  /* 4 around the drawing; 8 more on the right for the band; 4 more at the
     bottom for the bar. */
  padding: var(--spacing-xs) calc(var(--spacing-xs) + var(--spacing-sm))
    var(--spacing-sm) var(--spacing-xs);
  font-size: inherit;
  line-height: inherit;
  text-align: left;
}
/* Fitted: the brackets stay lit and a lime bar closes the card. */
.card.fitted {
  --btn-edge: var(--color-selected);
  --_state: var(--color-selected);
  cursor: default;
}
/* Unsanctioned and still fitted with Playground off: the same, in red. */
.card.blocked {
  --btn-edge: var(--color-red);
  --_state: var(--color-red);
  cursor: default;
}
.bar {
  position: absolute;
  inset: auto 0 0;
  height: var(--state-selected-indicator-width);
  background: var(--_state);
}
/* The settled mark, in the colour of the button's edge, which is its
   brackets: dim at rest, lit with them. */
.hatch {
  position: absolute;
  inset: 0 0 0 auto;
  width: var(--spacing-sm);
  background: repeating-linear-gradient(
    -45deg,
    var(--btn-edge) 0 2px,
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
  display: grid;
  grid-template-columns: 5ch repeat(3, minmax(max-content, 1fr));
  gap: var(--spacing-sm);
  margin: var(--spacing-xs) var(--spacing-xs) var(--spacing-xs)
    calc(3 * var(--spacing-xs));
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
.reset {
  margin: 0 0 var(--spacing-lg);
  font-family: var(--font-family-ui);
}
</style>
