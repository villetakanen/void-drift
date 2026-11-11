<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.14: how the box looks in its states. One answer: the
// card borrows from the slot on the ship drawing. The content, sizes and
// spacing are as settled up to 02.13. Three short lists of weapons show the
// states: Playground on with a sanctioned part fitted, Playground on with an
// unsanctioned part fitted, and Playground off with an unsanctioned part
// still fitted. Parts, classes and figures are the game's. Fixture: each list
// keeps its own fitting on this page; pressing a card fits it there only. In
// the third list the unsanctioned part that is not fitted is hidden, as the
// study's hypothesis has it.
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
            class="card"
            class:fitted={isFitted && !blocked}
            class:blocked
            class:band={unsanctioned}
            aria-pressed={isFitted}
            aria-label={unsanctioned ? `${part.name}, Unsanctioned` : undefined}
            onclick={() => {
              fitted[entry.id] = id;
            }}
          >
            {#if isFitted}
              <span class="brackets" aria-hidden="true"></span>
            {/if}
            <span class="drawing"><PartDrawing {id} /></span>
            <span class="text">
              <span class="head">
                <span class="name">{part.name}</span>
                {#if isFitted}
                  <span class="word"
                    >{blocked ? "Unsanctioned" : "Fitted"}</span
                  >
                {/if}
              </span>
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
          </button>
        {/each}
      </div>
    </section>
  {/each}
</div>
<p class="reset">
  <button type="button" class="again" onclick={reset}>
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
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
}
/* Available: a quiet edge on the void. The edge colour is one variable, and
   the hatched band and the corner brackets take it. */
.card {
  --_edge: var(--color-elev-3);
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: start;
  gap: var(--spacing-xs);
  position: relative;
  padding: var(--spacing-xs) calc(var(--spacing-xs) + var(--spacing-sm))
    var(--spacing-xs) var(--spacing-xs);
  border: 1px solid var(--_edge);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.card:not(.fitted, .blocked):hover {
  background: color-mix(in srgb, var(--color-action) 12%, transparent);
}
.card:active {
  filter: brightness(var(--state-held-brightness));
}
.card:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: calc(-1 * var(--focus-ring-width) - 2px);
}
/* Fitted: the lime edge of a filled slot, with the selected slot's corner
   brackets around it. */
.card.fitted {
  --_edge: var(--color-selected);
  cursor: default;
}
/* Unsanctioned and fitted with Playground off: the same shape in the status
   red. */
.card.blocked {
  --_edge: var(--color-red);
  cursor: default;
}
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
.brackets {
  --_arm: 10px;
  --_w: 2px;
  position: absolute;
  inset: -5px;
  pointer-events: none;
  background:
    linear-gradient(var(--_edge), var(--_edge)) top left / var(--_arm) var(--_w)
    no-repeat,
    linear-gradient(var(--_edge), var(--_edge)) top left / var(--_w) var(--_arm)
    no-repeat,
    linear-gradient(var(--_edge), var(--_edge)) top right / var(--_arm)
    var(--_w) no-repeat,
    linear-gradient(var(--_edge), var(--_edge)) top right / var(--_w)
    var(--_arm) no-repeat,
    linear-gradient(var(--_edge), var(--_edge)) bottom left / var(--_arm)
    var(--_w) no-repeat,
    linear-gradient(var(--_edge), var(--_edge)) bottom left / var(--_w)
    var(--_arm) no-repeat,
    linear-gradient(var(--_edge), var(--_edge)) bottom right / var(--_arm)
    var(--_w) no-repeat,
    linear-gradient(var(--_edge), var(--_edge)) bottom right / var(--_w)
    var(--_arm) no-repeat;
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
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-sm);
}
.name {
  font-size: var(--font-control-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.word {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--_edge);
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
.again {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-action);
  font: inherit;
  font-size: var(--font-size-label);
  cursor: pointer;
}
</style>
