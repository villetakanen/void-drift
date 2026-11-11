<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.1: the row as a console pane. Four part lists stand
// side by side, each one case of the question. Parts, their classes, mass and
// descriptions, the compatibility rule and the drawings are production.
// Fixture: each list has its own mount and fitting, kept only on this page;
// nothing here reads or writes the Hangar's ship.
import "@void-drift/core/styles/buttons.css";
import {
  PARTS,
  type PartId,
  type SlotType,
  slotAccepts,
} from "@void-drift/mode-a";
import PartDrawing from "./PartDrawing.svelte";

type Case = {
  id: string;
  title: string;
  note: string;
  playground: boolean;
  mount: string;
  type: SlotType;
  required: boolean;
  start: PartId | null;
};

const cases: Case[] = [
  {
    id: "on",
    title: "Playground on",
    note: "Offered, fitted and unsanctioned rows together.",
    playground: true,
    mount: "Weapon mount",
    type: "weapon",
    required: false,
    start: "light-ion-cannon",
  },
  {
    id: "on-fitted",
    title: "Playground on, unsanctioned part fitted",
    note: "Fitted and unsanctioned on one row. It is permitted here.",
    playground: true,
    mount: "Weapon mount",
    type: "weapon",
    required: false,
    start: "rail",
  },
  {
    id: "off",
    title: "Playground off, forbidden part",
    note: "The other unsanctioned part is hidden. The mount can be emptied.",
    playground: false,
    mount: "Weapon mount",
    type: "weapon",
    required: false,
    start: "rail",
  },
  {
    id: "off-engine",
    title: "Playground off, forbidden required engine",
    note: "The mount cannot be left empty, so the part has to be replaced.",
    playground: false,
    mount: "Required engine",
    type: "engine",
    required: true,
    start: "plasma",
  },
];

let fitted = $state<Record<string, PartId | null>>(
  Object.fromEntries(cases.map((entry) => [entry.id, entry.start])),
);

const all = Object.values(PARTS);

function rows(entry: Case) {
  const current = fitted[entry.id];
  return all.filter(
    (part) =>
      slotAccepts(entry.type, part.category) &&
      (entry.playground ||
        part.releaseClass === "scored" ||
        part.id === current),
  );
}

function fact(part: (typeof all)[number]) {
  if (part.category === "E") return `${part.thrust.toLocaleString()} thrust`;
  if (part.capacity > 0) return `+${part.capacity} energy`;
  return "";
}

function reset() {
  for (const entry of cases) fitted[entry.id] = entry.start;
}
</script>

<div class="bench">
  {#each cases as entry (entry.id)}
    {@const current = fitted[entry.id]}
    <section class="case" aria-labelledby="case-{entry.id}">
      <h4 id="case-{entry.id}">{entry.title}</h4>
      <p class="note">{entry.note}</p>
      <p class="mount">{entry.mount}</p>
      <ul class="list">
        {#each rows(entry) as part (part.id)}
          {@const isFitted = part.id === current}
          {@const unsanctioned = part.releaseClass === "preview"}
          {@const forbidden = isFitted && unsanctioned && !entry.playground}
          <li>
            <button
              type="button"
              class="row"
              class:fitted={isFitted && !forbidden}
              class:unsanctioned
              class:forbidden
              aria-pressed={isFitted}
              aria-disabled={forbidden ? "true" : undefined}
              onclick={() => {
                if (!forbidden) fitted[entry.id] = part.id;
              }}
            >
              <span class="window" aria-hidden="true">
                <PartDrawing id={part.id} />
              </span>
              <span class="body">
                <span class="name">{part.name}</span>
                {#if forbidden}
                  <span class="status"
                    >Unsanctioned ·
                    {entry.required
                      ? "replace to launch"
                      : "remove to launch"}</span
                  >
                {:else if unsanctioned}
                  <span class="status">Unsanctioned · no score</span>
                {:else if part.description}
                  <span class="what">{part.description}</span>
                {/if}
              </span>
              <span class="facts">
                {#if isFitted}
                  <span class="tag">Fitted</span>
                {/if}
                <span>{part.mass} mass</span>
                {#if !isFitted && fact(part)}
                  <span>{fact(part)}</span>
                {/if}
              </span>
              {#if unsanctioned}
                <span class="hatch" aria-hidden="true"></span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
      {#if !entry.required}
        <button
          type="button"
          class="btn btn-normal"
          disabled={!current}
          onclick={() => {
            fitted[entry.id] = null;
          }}
        >
          Remove fitting
        </button>
      {/if}
    </section>
  {/each}
</div>
<p class="reset">
  <button type="button" class="btn btn-link" onclick={reset}>
    Reset the four lists
  </button>
</p>

<style>
.bench {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.case {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: var(--spacing-sm);
  min-width: 0;
}
h4 {
  margin: 0;
  font-size: var(--font-size-label);
}
.note,
.mount {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
.mount {
  margin-top: var(--spacing-sm);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}
.list {
  display: grid;
  gap: var(--spacing-xs);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}
/* The row is a pane of the console: the surface the tabs, toggle and switch
   stand on, cut at the top left and bottom right, with no outline. */
.row {
  --_cut: var(--cut-size-md);
  --_ink: var(--color-text);
  --_quiet: var(--color-text-muted);
  --_hatch: var(--color-text-muted);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--spacing-md);
  position: relative;
  width: 100%;
  min-height: 64px;
  padding: var(--spacing-xs) var(--spacing-lg) var(--spacing-xs)
    var(--spacing-xs);
  border: 0;
  background: var(--color-elev-2);
  color: var(--_ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: var(--button-transition);
  clip-path: polygon(
    var(--_cut) 0%,
    100% 0%,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0% 100%,
    0% var(--_cut)
  );
}
.row:not(.fitted, .forbidden):hover {
  --_quiet: var(--color-text);
  background: color-mix(in srgb, var(--color-action) 28%, var(--color-elev-2));
}
.row:not(.forbidden):active {
  filter: brightness(var(--state-held-brightness));
}
.row:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
/* Fitted is the selected pane, filled like the selected tab. */
.row.fitted {
  --_ink: var(--color-on-brand);
  --_quiet: var(--color-on-brand);
  --_hatch: var(--color-on-brand);
  background: var(--color-selected);
  cursor: default;
}
/* Forbidden is fitted without the fill: an empty frame in the status red,
   which cannot be pressed. */
.row.forbidden {
  --_quiet: var(--color-red);
  --_hatch: var(--color-red);
  background: transparent;
  box-shadow: inset 0 0 0 var(--border-width-control) var(--color-red);
  cursor: not-allowed;
}
/* The drawing stays on the void in every state, so its colours hold. */
.window {
  display: grid;
  place-items: center;
  width: 64px;
  height: 56px;
  background: var(--color-void);
  clip-path: polygon(
    var(--cut-size-sm) 0%,
    100% 0%,
    100% 100%,
    0% 100%,
    0% var(--cut-size-sm)
  );
}
.window :global(svg) {
  width: 52px;
  height: 44px;
}
.body {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.name {
  font-size: var(--font-control-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.what,
.status {
  font-size: var(--font-size-caption);
  line-height: 1.3;
  color: var(--_quiet);
}
.what {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.status {
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
}
.facts {
  display: grid;
  justify-items: end;
  font-size: var(--font-size-caption);
  line-height: var(--line-height-heading);
  color: var(--_quiet);
  white-space: nowrap;
}
.tag {
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--_ink);
}
/* Unsanctioned: a hatched band closes the row, in the row's quiet colour. */
.hatch {
  position: absolute;
  inset: 0 0 0 auto;
  width: var(--spacing-md);
  background: repeating-linear-gradient(
    -45deg,
    var(--_hatch) 0 2px,
    transparent 2px 6px
  );
}
.reset {
  margin: 0;
}
@media (prefers-reduced-motion: reduce) {
  .row {
    transition: none;
  }
}
</style>
