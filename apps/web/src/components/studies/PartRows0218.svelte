<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.18: the card from 02.17 with three additions. The list
// opens with a short card that says Keep empty; pressing it empties the slot. A
// card's change of state fades, using the shared button's own timing. With
// Playground off, unsanctioned parts stay in the list, after the sanctioned
// ones, faded as a whole, and cannot be pressed. Parts, classes and figures are the game's.
// The card is 300 pixels wide, its fixed width. Fixture: each list keeps its
// own fitting on this page only.
import "@void-drift/core/styles/buttons.css";
import { PARTS, type PartId } from "@void-drift/mode-a";
import PartCard from "../hangar/PartCard.svelte";

// Sanctioned parts first, then unsanctioned, each in catalog order.
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
    note: "The build cannot launch until this part is replaced or removed. The other unsanctioned part stays listed and cannot be fitted.",
    playground: false,
    start: "rail",
  },
] as const;

let fitted = $state<Record<string, PartId | null>>(
  Object.fromEntries(cases.map((entry) => [entry.id, entry.start])),
);

const ordered = [
  ...weapons.filter((id) => PARTS[id].releaseClass === "scored"),
  ...weapons.filter((id) => PARTS[id].releaseClass === "preview"),
];

function reset() {
  for (const entry of cases) fitted[entry.id] = entry.start;
}
</script>

<div class="bench">
  {#each cases as entry (entry.id)}
    <section class="case">
      <h4>{entry.title}</h4>
      <p class="note">{entry.note}</p>
      <div class="list pane">
        <button
          type="button"
          class="btn btn-normal btn-card empty"
          class:fitted={fitted[entry.id] === null}
          aria-pressed={fitted[entry.id] === null}
          onclick={() => {
            fitted[entry.id] = null;
          }}
        >
          Keep empty
        </button>
        {#each ordered as id (id)}
          <PartCard
            {id}
            fitted={id === fitted[entry.id]}
            playground={entry.playground}
            onchoose={() => {
              fitted[entry.id] = id;
            }}
          />
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
  grid-template-columns: repeat(3, 332px);
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
/* The pane the list stands on: the first surface step, cut like a panel. */
.list {
  display: grid;
  /* The gap of a vertical group of buttons. */
  gap: var(--spacing-sm);
}
.pane {
  padding: var(--spacing-md);
  background: var(--color-elev-1);
  clip-path: polygon(
    var(--cut-size-lg) 0%,
    100% 0%,
    100% calc(100% - var(--cut-size-lg)),
    calc(100% - var(--cut-size-lg)) 100%,
    0% 100%,
    0% var(--cut-size-lg)
  );
}
.empty {
  width: 300px;
  font-size: var(--font-control-size);
  font-weight: var(--font-weight-medium);
}
.empty.fitted {
  --btn-edge: var(--color-selected);
  --_fill: var(--color-void);
}
.reset {
  margin-bottom: var(--spacing-lg);
}
</style>
