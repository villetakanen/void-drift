<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.2: the list as one display on a console. Rows are lines
// of the list, not separate buttons. The drawing leaves the row for a readout
// above the list, which shows the line under the pointer or focus and falls
// back to the fitted part. The hatched band from 02.1 is kept. Parts, classes,
// mass, descriptions, compatibility and drawings are production. Fixture:
// each list has its own mount and fitting, kept only on this page.
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
    title: "Playground on, a long list",
    note: "A universal mount accepts every part, so the display scrolls.",
    playground: true,
    mount: "Universal mount",
    type: "universal",
    required: false,
    start: "light-ion-cannon",
  },
  {
    id: "on-fitted",
    title: "Playground on, unsanctioned part fitted",
    note: "Fitted and unsanctioned on one line. It is permitted here.",
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
let peek = $state<Record<string, PartId | null>>({});

const all = Object.values(PARTS);

function lines(entry: Case) {
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
    {@const shownId = peek[entry.id] ?? current}
    {@const shown = shownId ? PARTS[shownId] : null}
    {@const shownForbidden =
      !!shown &&
      shown.id === current &&
      shown.releaseClass === "preview" &&
      !entry.playground}
    <section class="case" aria-labelledby="case022-{entry.id}">
      <h4 id="case022-{entry.id}">{entry.title}</h4>
      <p class="note">{entry.note}</p>
      <div class="console">
        <p class="mount">{entry.mount}</p>
        <div class="readout" aria-live="polite">
          <div class="drawing">
            {#if shown}
              <PartDrawing id={shown.id} />
            {/if}
          </div>
          <div class="about">
            {#if shown}
              <p class="name">{shown.name}</p>
              {#if shownForbidden}
                <p class="status alert">
                  Unsanctioned ·
                  {entry.required ? "replace to launch" : "remove to launch"}
                </p>
              {:else if shown.releaseClass === "preview"}
                <p class="status">Unsanctioned · no score</p>
              {/if}
              {#if shown.description}
                <p class="what">{shown.description}</p>
              {/if}
              <p class="facts">
                {shown.mass}
                mass{fact(shown) ? ` · ${fact(shown)}` : ""}
              </p>
            {:else}
              <p class="name">Empty mount</p>
            {/if}
          </div>
        </div>
        <ul class="display">
          {#each lines(entry) as part (part.id)}
            {@const isFitted = part.id === current}
            {@const unsanctioned = part.releaseClass === "preview"}
            {@const forbidden = isFitted && unsanctioned && !entry.playground}
            <li>
              <button
                type="button"
                class="line"
                class:fitted={isFitted && !forbidden}
                class:forbidden
                aria-pressed={isFitted}
                aria-disabled={forbidden ? "true" : undefined}
                aria-label={unsanctioned
                  ? `${part.name}, Unsanctioned`
                  : undefined}
                onpointerenter={() => {
                  peek[entry.id] = part.id;
                }}
                onpointerleave={() => {
                  peek[entry.id] = null;
                }}
                onfocus={() => {
                  peek[entry.id] = part.id;
                }}
                onblur={() => {
                  peek[entry.id] = null;
                }}
                onclick={() => {
                  if (!forbidden) fitted[entry.id] = part.id;
                }}
              >
                <span class="name">{part.name}</span>
                <span class="tail">
                  {#if forbidden}
                    {entry.required ? "Replace" : "Remove"}
                  {:else if isFitted}
                    Fitted
                  {:else}
                    {part.mass}
                    mass
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
      </div>
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
  gap: var(--spacing-sm);
  min-width: 0;
}
h4 {
  margin: 0;
  font-size: var(--font-size-label);
}
p {
  margin: 0;
}
.note {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
/* The container: one console surface holds the mount's name, the readout,
   the list display and the mount's own action. */
.console {
  --button-ground: var(--color-elev-1);
  display: grid;
  justify-items: start;
  gap: var(--spacing-md);
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
.mount {
  padding-left: var(--spacing-sm);
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-text-muted);
}
/* The readout: the drawing stands on the console with no frame of its own. */
.readout {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: var(--spacing-md);
  align-items: center;
  width: 100%;
  min-height: 104px;
}
.drawing {
  display: grid;
  place-items: center;
}
.drawing :global(svg) {
  width: 96px;
  height: 80px;
}
.about {
  display: grid;
  gap: var(--spacing-xs);
  align-content: center;
}
.about .name {
  font-size: var(--font-size-lead);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.status {
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.status.alert {
  color: var(--color-red);
}
.what,
.facts {
  font-size: var(--font-size-caption);
  line-height: 1.4;
  color: var(--color-text-muted);
}
.what {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.facts {
  color: var(--color-text);
}
/* The list is one display. It shows five lines and scrolls inside itself. */
.display {
  width: 100%;
  max-height: calc(5 * var(--control-min-height));
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  background: var(--surface-display);
  box-shadow: var(--shadow-display);
  scrollbar-width: thin;
  scrollbar-color: var(--color-elev-3) transparent;
}
.line {
  --_ink: var(--color-text);
  --_quiet: var(--color-text-muted);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--spacing-md);
  position: relative;
  width: 100%;
  min-height: var(--control-min-height);
  padding: 0 var(--spacing-lg) 0 var(--spacing-md);
  border: 0;
  border-bottom: 1px solid var(--color-border-faint);
  background: transparent;
  color: var(--_ink);
  font: inherit;
  font-size: var(--font-control-size);
  text-align: left;
  cursor: pointer;
}
li:last-child .line {
  border-bottom: 0;
}
.line:not(.fitted, .forbidden):hover {
  background: color-mix(in srgb, var(--color-action) 16%, transparent);
}
.line:not(.forbidden):active {
  filter: brightness(var(--state-held-brightness));
}
.line:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: calc(-1 * var(--focus-ring-width));
}
/* Fitted is the lit line of the display: lime, with dark text. */
.line.fitted {
  --_ink: var(--color-on-brand);
  --_quiet: var(--color-on-brand);
  background: var(--color-selected);
  cursor: default;
}
.line.forbidden {
  --_ink: var(--color-red);
  --_quiet: var(--color-red);
  box-shadow: inset var(--state-selected-indicator-width) 0 0 var(--color-red);
  cursor: not-allowed;
}
.tail {
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--_quiet);
  white-space: nowrap;
}
.line.fitted .tail,
.line.forbidden .tail {
  font-weight: var(--font-weight-bold);
}
/* Unsanctioned, kept from 02.1: a hatched band closes the line. */
.hatch {
  position: absolute;
  inset: 0 0 0 auto;
  width: var(--spacing-md);
  background: repeating-linear-gradient(
    -45deg,
    var(--_quiet) 0 2px,
    transparent 2px 6px
  );
}
.reset {
  margin: 0;
}
</style>
