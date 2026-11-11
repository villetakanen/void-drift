<script lang="ts">
// Actions study, 02.14: everything settled in 02.1 to 02.13, assembled. The
// quiet button, the call to action and the link are each shown in every
// state, forced, on the void and on a panel; then the two arrangements are
// shown live: a column in the title screen's group and a row on a band. Four
// specimens are marked "proposed": they complete the set and have not been
// judged. The logomark is production; the buttons and links are scoped
// copies built without clipping. Fixture: the scores and sentences are
// sample values and no action does anything.
import "@void-drift/core/styles/surfaces.css";
import Logo from "../Logo.svelte";

let {
  label = "The settled action in every state and arrangement",
}: { label?: string } = $props();

const buttonStates = [
  ["rest", "", false],
  ["pointer", "is-pointer", false],
  ["held", "is-held", false],
  ["focus", "is-focus", false],
  ["unavailable", "is-unavailable", false],
] as const;
const ctaStates = [
  ["rest", "", false],
  ["pointer", "is-pointer", false],
  ["held", "is-held", true],
  ["focus", "is-focus", false],
  ["unavailable", "is-unavailable", false],
] as const;
const linkStates = [
  ["rest", "", false],
  ["pointer and focus", "is-pointer", false],
  ["held", "is-pointer", true],
  ["unavailable", "is-unavailable", true],
] as const;
const grounds = [
  ["on the void", "on-void"],
  ["on a panel", "on-panel panel"],
] as const;
const menu = ["HANGAR", "TOP SCORES", "SETTINGS", "CREDITS"];
</script>

<section class="sheet" aria-label={label}>
  <div class="states" aria-hidden="true">
    {#each grounds as [groundName, groundClass]}
      <div class={`ground ${groundClass}`}>
        <p class="caption">{groundName}</p>
        <div class="line">
          <p class="kind">Quiet button</p>
          {#each buttonStates as [name, flag]}
            <div class="state">
              <span class={`act q ${flag}`}>Settings</span>
              <span class="caption">{name}</span>
            </div>
          {/each}
        </div>
        <div class="line">
          <p class="kind">Call to action</p>
          {#each ctaStates as [name, flag, proposed]}
            <div class="state">
              <span class={`act cta ${flag}`}>Survival</span>
              <span class="caption" class:proposed>
                {name}{proposed ? " · proposed" : ""}
              </span>
            </div>
          {/each}
        </div>
        <div class="line">
          <p class="kind">Link</p>
          {#each linkStates as [name, flag, proposed]}
            <div class="state">
              <span class={`link ${flag}`}>How scoring works</span>
              <span class="caption" class:proposed>
                {name}{proposed ? " · proposed" : ""}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="together">
    <div>
      <p class="caption">A column: 8px between buttons. Live.</p>
      <div class="panel title-panel on-panel">
        <div class="identity"><Logo size="sm" /></div>
        <div class="group">
          <button type="button" class="act cta">PRESS START</button>
          {#each menu as item}
            <button type="button" class="act q">{item}</button>
          {/each}
        </div>
      </div>
    </div>
    <div class="rows">
      <div>
        <p class="caption">
          A row on a band, gathered at the end: 16px between buttons, 8px above
          and below, 16px at each end. Live.
        </p>
        <div class="band end on-void">
          <button type="button" class="act q">Practice</button>
          <button type="button" class="act q">Derelicts</button>
          <button type="button" class="act q" disabled>Gauntlet</button>
          <button type="button" class="act cta">Survival</button>
        </div>
      </div>
      <div>
        <p class="caption">
          The same band inside a panel, its buttons pushed to the two ends, with
          a link in the sentence above. Live.
        </p>
        <div class="panel score-panel">
          <p class="sentence">
            Casual, client-reported scores.
            <a class="link" href="#whole">How scoring works</a>.
          </p>
          <div class="band on-void">
            <button type="button" class="act q">Refresh</button>
            <button type="button" class="act cta">
              Return to title screen
            </button>
          </div>
        </div>
      </div>
      <div>
        <p class="caption">A ship that cannot launch.</p>
        <div class="band end on-void">
          <button type="button" class="act q" disabled>Practice</button>
          <button type="button" class="act q" disabled>Derelicts</button>
          <button type="button" class="act q" disabled>Gauntlet</button>
          <button type="button" class="act cta" disabled>Survival</button>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
/* Registered so the edge colour can ease between states. */
@property --act-edge {
  syntax: "<color>";
  inherits: true;
  initial-value: transparent;
}

.sheet {
  display: grid;
  gap: var(--spacing-xl);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.caption {
  margin: 0 0 var(--spacing-sm);
  max-width: none;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
.proposed {
  color: var(--color-caution-tape);
}
.states {
  display: grid;
  gap: var(--spacing-lg);
}
.ground {
  display: grid;
  gap: var(--spacing-md);
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
  flex: 0 0 8rem;
  margin: 0;
  align-self: center;
  font: var(--font-weight-bold) var(--font-size-label) var(--font-family-ui);
}
.state {
  display: grid;
  gap: var(--spacing-xs);
  justify-items: start;
}
.state .caption {
  margin: 0;
}
.together {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-lg);
}
.rows {
  display: grid;
  gap: var(--spacing-lg);
}
.title-panel {
  width: 20rem;
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}
.identity {
  display: grid;
  justify-items: center;
  color: var(--color-brand);
}
.score-panel {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}
.sentence {
  margin: 0;
  max-width: none;
  color: var(--color-text);
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
}

/* A column: 8px between buttons. */
.group {
  display: grid;
  gap: var(--spacing-sm);
}
/* A row: a band of the void, always one flex row, 8px above and below, 16px
   at each end and between buttons. The host chooses the distribution. */
.band {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-void);
}
.band.end {
  justify-content: flex-end;
}

/* A pane stands one step above the panel and two above the void. */
.on-void {
  --step: var(--color-elev-2);
}
.on-panel {
  --step: var(--color-elev-3);
}

/* Both buttons: an unclipped element, a fill on ::before and brackets on
   ::after, each following the cut. The brackets are a 1px edge left open
   across the middle 40% of the top and bottom. */
.act {
  --_cut: var(--cut-size-md);
  --_w: 1px;
  --_inset: 0px;
  --_arm: 30%;
  --_i: calc(var(--_cut) + 0.4142 * var(--_w));
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: var(--control-min-height);
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 0;
  background: none;
  font:
    var(--font-weight-regular) var(--font-control-size) / 1
    var(--font-family-ui);
  white-space: nowrap;
  cursor: pointer;
  appearance: none;
  outline: none;
  transition: --act-edge var(--duration-fast) var(--ease-standard);
}
.act::before,
.act::after {
  content: "";
  position: absolute;
  z-index: var(--layer-under);
  pointer-events: none;
}
.act::before {
  inset: 0;
  background: var(--_fill);
  transition: background var(--duration-fast) var(--ease-standard);
  clip-path: polygon(
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut)
  );
}
.act::after {
  inset: var(--_inset);
  background: linear-gradient(
    to right,
    var(--act-edge) 0 var(--_arm),
    transparent var(--_arm) calc(100% - var(--_arm)),
    var(--act-edge) calc(100% - var(--_arm))
  );
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

.state .act {
  min-width: 8.5rem;
  cursor: default;
}

.band.end .act {
  flex: 0 0 180px;
}

/* The quiet button. */
.q {
  --_fill: var(--step);
  --act-edge: lch(25% 32 290);
  color: var(--color-text);
}
.q:is(:hover, :active, :focus-visible, .is-pointer, .is-held, .is-focus) {
  --act-edge: var(--color-action);
}
.q:is(:active, .is-held) {
  --_fill: color-mix(in srgb, var(--color-action) 28%, transparent);
}

/* The call to action. Rest and pointer are today's. */
.cta {
  --_fill: var(--color-action);
  --act-edge: transparent;
  color: var(--color-on-brand);
  font-weight: var(--font-weight-medium);
}
.cta:is(:hover, .is-pointer) {
  filter: brightness(var(--state-hover-brightness));
}
/* Proposed: held dims the fill a step. */
.cta:is(:active, .is-held) {
  filter: brightness(0.85);
}
.cta:is(:focus-visible, .is-focus) {
  --act-edge: var(--color-on-brand);
  --_inset: 3px;
  --_w: 2px;
}

/* Unavailable: an empty frame. Declared last so it wins over every state. */
.act:is(:disabled, .is-unavailable) {
  --_fill: transparent;
  --_inset: 0px;
  --_w: 1px;
  color: var(--color-text-muted);
  filter: none;
  cursor: not-allowed;
}
.q:is(:disabled, .is-unavailable) {
  --act-edge: lch(25% 32 290);
}
.cta:is(:disabled, .is-unavailable) {
  --act-edge: var(--color-action);
}

/* The link: lime words on a lime line at 20%; the line lights under a
   pointer and on focus. */
.link {
  color: var(--color-action);
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
  text-decoration: underline;
  text-decoration-color: color-mix(
    in srgb,
    var(--color-action) 20%,
    transparent
  );
  text-decoration-thickness: 1px;
  text-underline-offset: 0.35em;
  outline: none;
  transition: text-decoration-color var(--duration-fast) var(--ease-standard);
}
.link:is(:hover, :focus-visible, :active, .is-pointer) {
  text-decoration-color: var(--color-action);
}
/* Proposed: muted words and no line. */
.link.is-unavailable {
  color: var(--color-text-muted);
  text-decoration: none;
}

@media (prefers-reduced-motion: reduce) {
  .act,
  .act::before,
  .link {
    transition: none;
  }
}
</style>
