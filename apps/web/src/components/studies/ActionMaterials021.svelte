<script lang="ts">
// Actions study, 02.1: four materials for the quiet action, each shown in the
// title screen's group, the Hangar's launch row and a strip of forced states.
// The filled call to action and "Today" use the production button classes;
// everything else is scoped to this component. Fixture: no action does anything.
import "@void-drift/core/styles/buttons.css";
import "@void-drift/core/styles/surfaces.css";

const variants = [
  {
    id: "today",
    name: "Today",
    note: "The reference: a lime outline around the void, filling solid lime under a pointer.",
  },
  {
    id: "pane",
    name: "A / Pane",
    note: "The tab's material: a surface one step above its background, pale label, no lime at rest. A pointer tints it lime.",
  },
  {
    id: "label",
    name: "B / Lit label",
    note: "The same pane, with lime moved from the edge to the label: the words are what is lit.",
  },
  {
    id: "glass",
    name: "C / Glass",
    note: "A lime-tinted translucent pane with a thin lit edge and a lime label, in the family of the thrust pads' glass.",
  },
  {
    id: "words",
    name: "D / Words",
    note: "No surface at rest: the call to action is the only shape, and a pane appears under a pointer.",
  },
] as const;

const menu = ["HANGAR", "TOP SCORES", "SETTINGS", "CREDITS"];
const states = [
  ["rest", ""],
  ["pointer", "is-pointer"],
  ["held", "is-held"],
  ["focus", "is-focus"],
  ["unavailable", "is-unavailable"],
] as const;
</script>

<div class="materials">
  {#each variants as variant}
    {@const today = variant.id === "today"}
    <article class={`variant v-${variant.id}`} aria-label={variant.name}>
      <header>
        <h3>{variant.name}</h3>
        <p>{variant.note}</p>
      </header>
      <div class="scenes">
        <div class="scene on-panel">
          <p class="caption">Title screen group, on a panel</p>
          <div class="panel title-panel">
            <p class="wordmark">VOID DRIFT</p>
            <div class="button-group button-group--vertical">
              <button type="button" class="btn btn-filled">PRESS START</button>
              {#each menu as item}
                <button type="button" class={today ? "btn btn-ghost" : "q"}>
                  {item}
                </button>
              {/each}
            </div>
          </div>
        </div>
        <div class="scene on-void">
          <p class="caption">States, forced</p>
          <div class="states" aria-hidden="true">
            {#each states as [name, flag]}
              <div class="state">
                {#if today}
                  <span
                    class={`btn ${flag === "is-pointer" || flag === "is-held" ? "btn-filled" : "btn-ghost"} ${flag}`}
                    >Settings</span
                  >
                {:else}
                  <span class={`q ${flag}`}>Settings</span>
                {/if}
                <span class="caption">{name}</span>
              </div>
            {/each}
            <div class="state">
              <span class={today ? "btn btn-link" : "link"}>Credits</span>
              <span class="caption">link</span>
            </div>
            <div class="state">
              <span
                class={today
                  ? "btn btn-link is-link-pointer"
                  : "link is-pointer"}
                >Credits</span
              >
              <span class="caption">link, pointer</span>
            </div>
          </div>
        </div>
        <div class="scene on-void wide">
          <p class="caption">Hangar launch row, on the void</p>
          <div class="launch-row">
            <button type="button" class={today ? "btn btn-ghost" : "q"}>
              Practice
            </button>
            <button type="button" class={today ? "btn btn-ghost" : "q"}>
              Derelicts
            </button>
            <button
              type="button"
              class={today ? "btn btn-ghost" : "q"}
              disabled
            >
              Gauntlet
            </button>
            <button type="button" class="btn btn-filled">Survival</button>
          </div>
        </div>
      </div>
    </article>
  {/each}
</div>

<style>
.materials {
  display: grid;
  gap: var(--spacing-xl);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.variant header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}
.variant h3 {
  flex: 0 0 9rem;
  margin: 0;
  font: var(--font-weight-bold) var(--font-size-body) var(--font-family-ui);
}
.variant header p {
  margin: 0;
  max-width: none;
  color: var(--color-text-muted);
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
}
.scenes {
  display: grid;
  grid-template-columns: 22rem minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
  padding-top: var(--spacing-md);
}
.wide {
  grid-column: 1 / -1;
}
.caption {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
.title-panel {
  padding: var(--spacing-md);
}
.wordmark {
  margin: 0 0 var(--spacing-sm);
  text-align: center;
  font: var(--font-weight-bold) var(--font-size-lead) var(--font-family-ui);
}
/* Today's Hangar footer: its own gap and minimum width, a rule above. */
.launch-row {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-subtle);
}
.launch-row :is(.btn, .q) {
  min-width: 180px;
}
.states {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}
.state {
  display: grid;
  gap: var(--spacing-xs);
  justify-items: start;
}
.state .caption {
  margin: 0;
}
.state :is(.btn, .q) {
  cursor: default;
}

/* The quiet action under study. The element is unclipped; ::before is the
   fill and ::after the edge, both following the cut, so focus can light the
   edge itself. */
.q {
  --_cut: var(--cut-size-md);
  --_fill: var(--q-fill);
  --_edge: var(--q-edge, transparent);
  --_w: var(--q-edge-width, 1px);
  --_i: calc(var(--_cut) + 0.4142 * var(--_w));
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: var(--control-min-height);
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 0;
  background: none;
  color: var(--q-text);
  font:
    var(--font-weight-medium) var(--font-control-size) / 1 var(--font-family-ui);
  white-space: nowrap;
  cursor: pointer;
  appearance: none;
}
.q::before,
.q::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: var(--layer-under);
  pointer-events: none;
}
.q::before {
  background: var(--_fill);
  clip-path: polygon(
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut)
  );
}
.q::after {
  background: var(--_edge);
  clip-path: polygon(
    evenodd,
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut),
    var(--_cut) 0,
    var(--_i) var(--_w),
    calc(100% - var(--_w)) var(--_w),
    calc(100% - var(--_w)) calc(100% - var(--_i)),
    calc(100% - var(--_i)) calc(100% - var(--_w)),
    var(--_w) calc(100% - var(--_w)),
    var(--_w) var(--_i),
    var(--_i) var(--_w),
    var(--_cut) 0
  );
}
.q:hover,
.q.is-pointer {
  --_fill: var(--qp-fill);
  --_edge: var(--qp-edge, var(--q-edge, transparent));
  color: var(--qp-text, var(--q-text));
}
.q:active,
.q.is-held {
  --_fill: var(--qh-fill);
  --_edge: var(--qh-edge, var(--qp-edge, var(--q-edge, transparent)));
  color: var(--qh-text, var(--qp-text, var(--q-text)));
}
.q:focus-visible,
.q.is-focus {
  --_edge: var(--color-focus-ring);
  --_w: 2px;
  outline: none;
}
.q:disabled,
.q.is-unavailable {
  --_fill: var(--qu-fill);
  --_edge: var(--qu-edge, transparent);
  --_w: 1px;
  color: var(--qu-text);
  cursor: not-allowed;
}

/* One step above the background a set sits on. */
.on-void {
  --step: var(--color-elev-2);
}
.on-panel {
  --step: var(--color-elev-3);
}

.v-pane .q {
  --q-fill: var(--step);
  --q-text: var(--color-text);
  --qp-fill: color-mix(in srgb, var(--color-action) 28%, transparent);
  --qh-fill: color-mix(in srgb, var(--color-action) 45%, transparent);
  --qu-fill: transparent;
  --qu-edge: var(--step);
  --qu-text: var(--color-text-muted);
}
.v-label .q {
  --q-fill: var(--step);
  --q-text: var(--color-action);
  --qp-fill: color-mix(in srgb, var(--color-action) 28%, transparent);
  --qh-fill: color-mix(in srgb, var(--color-action) 45%, transparent);
  --qh-text: var(--color-text);
  --qu-fill: color-mix(in lch, var(--step) 55%, transparent);
  --qu-text: var(--color-text-muted);
}
.v-glass .q {
  --q-fill: color-mix(in lch, var(--color-action) 9%, transparent);
  --q-edge: color-mix(in lch, var(--color-action) 40%, transparent);
  --q-text: var(--color-action);
  --qp-fill: color-mix(in lch, var(--color-action) 20%, transparent);
  --qp-edge: color-mix(in lch, var(--color-action) 75%, transparent);
  --qh-fill: color-mix(in lch, var(--color-action) 34%, transparent);
  --qh-edge: var(--color-action);
  --qu-fill: var(--color-pad-turn);
  --qu-edge: var(--color-border);
  --qu-text: var(--color-text-muted);
}
.v-words .q {
  --q-fill: transparent;
  --q-text: var(--color-action);
  --qp-fill: color-mix(in lch, var(--color-action) 16%, transparent);
  --qh-fill: color-mix(in lch, var(--color-action) 30%, transparent);
  --qu-fill: transparent;
  --qu-text: var(--color-text-muted);
}

/* Forced states for the production button, which has no state classes. */
.btn.btn-ghost.is-focus {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
.btn.btn-ghost.is-unavailable {
  opacity: var(--state-disabled-opacity);
}
.btn.is-link-pointer {
  color: var(--color-text);
}

/* The text link proposed with A to D. */
.link {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-min-height);
  color: var(--color-action);
  font:
    var(--font-weight-medium) var(--font-control-size) / 1 var(--font-family-ui);
  text-decoration: underline;
  text-decoration-color: color-mix(
    in lch,
    var(--color-action) 40%,
    transparent
  );
  text-underline-offset: 0.3em;
}
.link.is-pointer {
  text-decoration-color: var(--color-action);
  text-decoration-thickness: 2px;
}
</style>
