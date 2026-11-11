<script lang="ts">
import "./catalog.css";

let { label = "Actions design system" }: { label?: string } = $props();

// The actions reference: the normal button, the call to action and the link
// from the shared button styles, every state on the void and on a panel.
// Pointer, held and focus are forced with `data-lab-state`, which the shared
// rules read; unavailable is the real attribute. Nothing here does anything.
type State = {
  name: string;
  force?: "pointer" | "held" | "focus";
  unavailable?: boolean;
};
const buttonStates: State[] = [
  { name: "rest" },
  { name: "pointer", force: "pointer" },
  { name: "held", force: "held" },
  { name: "focus", force: "focus" },
  { name: "unavailable", unavailable: true },
];
const linkStates: State[] = [
  { name: "rest" },
  { name: "pointer and focus", force: "pointer" },
  { name: "held", force: "held" },
  { name: "unavailable", unavailable: true },
];
const grounds = [
  { name: "On the void", id: "void", panel: false },
  { name: "On a panel", id: "panel", panel: true },
];

let message = $state("Interactive examples only; nothing is changed.");
</script>

<section class="catalog" aria-label={label}>
  <p>
    One lit call among normal buttons, and links for words inside a sentence.
    <a class="text-link" href="/lab/studies/buttons-2026-11-11#whole"
      >Accepted study and its reference sheet</a
    >.
  </p>

  <section>
    <h2>Every state</h2>
    <p>
      A normal button is a pane one step above what it stands on, with a bracket
      around each end. The call to action is the one lime fill. A link is lime
      words on a faint lime line. States are forced so they can be compared; the
      examples below them are live.
    </p>
    {#each grounds as ground}
      <div
        class={ground.panel ? "ground panel" : "ground on-void"}
        data-testid={`actions-${ground.id}`}
        aria-hidden="true"
      >
        <span class="caption">{ground.name}</span>
        <div class="line">
          <span class="kind">Normal button</span>
          {#each buttonStates as state}
            <div class="state">
              <span
                class="btn btn-normal specimen"
                data-lab-state={state.force}
                aria-disabled={state.unavailable ? "true" : undefined}
                >Settings</span
              >
              <span class="caption">{state.name}</span>
            </div>
          {/each}
        </div>
        <div class="line">
          <span class="kind">Call to action</span>
          {#each buttonStates as state}
            <div class="state">
              <span
                class="btn btn-filled specimen"
                data-lab-state={state.force}
                aria-disabled={state.unavailable ? "true" : undefined}
                >Survival</span
              >
              <span class="caption">{state.name}</span>
            </div>
          {/each}
        </div>
        <div class="line">
          <span class="kind">Link</span>
          {#each linkStates as state}
            <div class="state">
              <span
                class="text-link"
                data-lab-state={state.force}
                aria-disabled={state.unavailable ? "true" : undefined}
                >How scoring works</span
              >
              <span class="caption">{state.name}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </section>

  <section>
    <h2>Live</h2>
    <p>
      Point at, press and tab through these. Focus on a normal button looks as a
      pointer does; on the call to action it is dark brackets inside the fill.
      An unavailable button does not answer a pointer.
    </p>
    <div class="live">
      <div class="ground on-void" data-testid="actions-live-void">
        <span class="caption">On the void</span>
        <div class="row">
          <button
            type="button"
            class="btn btn-normal"
            onclick={() => (message = "Practice selected.")}
          >
            Practice
          </button>
          <button type="button" class="btn btn-normal" disabled>
            Gauntlet
          </button>
          <button
            type="button"
            class="btn btn-filled"
            onclick={() => (message = "Survival selected.")}
          >
            Survival
          </button>
          <button type="button" class="btn btn-filled" disabled>Launch</button>
        </div>
        <p class="sentence">
          Casual, client-reported scores.
          <a class="text-link" href="#scoring">How scoring works</a>.
          Unavailable:
          <span class="text-link" aria-disabled="true">Past seasons</span>.
        </p>
      </div>
      <div class="ground panel" data-testid="actions-live-panel">
        <span class="caption">On a panel</span>
        <div class="button-group button-group--vertical">
          <button
            type="button"
            class="btn btn-filled"
            onclick={() => (message = "Press start selected.")}
          >
            PRESS START
          </button>
          <button
            type="button"
            class="btn btn-normal"
            onclick={() => (message = "Hangar selected.")}
          >
            HANGAR
          </button>
          <button
            type="button"
            class="btn btn-normal"
            onclick={() => (message = "Settings selected.")}
          >
            SETTINGS
          </button>
          <button type="button" class="btn btn-normal" disabled>CREDITS</button>
        </div>
      </div>
    </div>
    <p role="status" id="scoring">{message}</p>
  </section>

  <section>
    <h2>Classes and properties</h2>
    <ul>
      <li>
        <code>.btn.btn-normal</code>: the normal button. Its pane is
        <code>--button-ground</code>, elevation 2 by default and elevation 3
        inside a <code>.panel</code>; its brackets are
        <code>--color-bracket</code>
        at rest and
        <code>--color-action</code>
        under a pointer, held and on focus.
      </li>
      <li>
        <code>.btn.btn-filled</code>: the call to action. Held dims the fill to
        <code>--state-held-brightness</code>; focus draws 2px brackets in
        <code>--color-on-brand</code>, 3px inside the fill. Unavailable, it is
        an empty lime frame: the one place lime marks something that cannot be
        acted on.
      </li>
      <li>
        <code>.text-link</code>, on an anchor or a <code>.btn</code>: lime words
        on a 1px line at 20%, full lime under a pointer and on focus; muted
        words and no line when unavailable.
      </li>
      <li>
        Unavailable is native <code>disabled</code> or
        <code>aria-disabled="true"</code>; a disabled link must also suppress
        its activation. Bracket colour eases over
        <code>--duration-fast</code>; reduced motion removes the easing.
      </li>
    </ul>
  </section>
</section>

<section aria-label="Part card brackets and sanction band">
  <h2>Part card frame</h2>
  <p>
    Cards use the action frame without a raised fill or pressed bar. The band
    follows the edge.
  </p>
  <button type="button" class="btn btn-normal btn-card">
    Unsanctioned<span class="unsanctioned-band" aria-hidden="true"></span>
  </button>
  <button
    type="button"
    class="btn btn-normal btn-card"
    data-lab-state="pointer"
  >
    Lit edge<span class="unsanctioned-band" aria-hidden="true"></span>
  </button>
  <button
    type="button"
    class="btn btn-normal btn-card"
    style="--btn-edge: var(--color-red)"
  >
    Must come off<span class="unsanctioned-band" aria-hidden="true"></span>
  </button>
</section>
<style>
.ground {
  display: grid;
  gap: var(--spacing-md);
  margin-block-end: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.ground.on-void {
  padding: var(--spacing-md) 0;
  background: var(--color-void);
}
.ground.panel {
  padding: var(--spacing-md);
}
.line {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  gap: var(--spacing-md);
}
.kind {
  /* Narrow enough that five production-width buttons share a line on a
     panel at 1280px. */
  flex: 0 0 6rem;
  align-self: center;
  font: var(--font-weight-bold) var(--font-size-label) var(--font-family-ui);
}
.state {
  display: grid;
  gap: var(--spacing-xs);
  justify-items: start;
}
.specimen {
  min-width: 8.5rem;
  cursor: default;
}
.text-link {
  font-size: var(--font-size-label);
  line-height: var(--line-height-ui);
}
.live {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
}
.row {
  display: flex;
  gap: var(--spacing-md);
}
.sentence {
  margin: 0;
  color: var(--color-text);
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
}
</style>
