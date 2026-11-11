<script lang="ts">
// Actions study, 02.12: what a text link is made of. The buttons are settled
// in every state, with their gaps and the band behind a row, and are the
// same in every version. Each version shows a link in three places: in a
// sentence on a panel, standing alone in the title screen's group in place
// of a button, and in a sentence on the void beside a band. The first of
// each pair is at rest and the second is held in its pointer state; every
// link also answers a real pointer and the keyboard. The logomark is
// production; the buttons are scoped copies. Fixture: the sentences are
// sample wording, making CREDITS a link is part of the example and not a
// decision, and no link goes anywhere.
import "@void-drift/core/styles/surfaces.css";
import Logo from "../Logo.svelte";

let { label = "Three materials for a text link" }: { label?: string } =
  $props();

const variants = [
  {
    id: "plain",
    name: "0 / Today's link",
    note: "Lime words with no line under them, turning pale under a pointer. The reference: the link button the Lab uses.",
  },
  {
    id: "under",
    name: "1 / Lime, underlined",
    note: "Lime words on a dim lime line. Under a pointer the line lights, as a button's brackets do.",
  },
  {
    id: "line",
    name: "2 / Pale, lime line",
    note: "Words in the colour of the text around them, on a dim lime line. Only the line says the words can be pressed; under a pointer it lights.",
  },
] as const;

const menu = ["HANGAR", "TOP SCORES", "SETTINGS"];
</script>

<section class="links" aria-label={label}>
  <dl class="key">
    {#each variants as variant}
      <div>
        <dt>{variant.name}</dt>
        <dd>{variant.note}</dd>
      </div>
    {/each}
  </dl>

  <div class="columns">
    {#each variants as variant}
      <div class={`column v-${variant.id}`}>
        <p class="step">{variant.name}</p>

        <div class="panel title-panel on-panel">
          <div class="identity"><Logo size="sm" /></div>
          <div class="group">
            <button type="button" class="act cta">PRESS START</button>
            {#each menu as item}
              <button type="button" class="act q">{item}</button>
            {/each}
            <a class="link alone" href="#links">CREDITS</a>
          </div>
          <p class="sentence">
            Fonts under the Open Font License.
            <a class="link" href="#links">Read the licences</a>
            or
            <a class="link is-pointer" href="#links">see the credits</a>.
          </p>
        </div>

        <div class="on-void">
          <p class="sentence">
            Practice flies a repeatable star system.
            <a class="link" href="#links">How modes differ</a>
            and
            <a class="link is-pointer" href="#links">how scoring works</a>.
          </p>
          <div class="band">
            <button type="button" class="act q">Refresh</button>
            <button type="button" class="act cta">Return to title</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
/* Registered so the arm length and the edge colour can ease between states. */
@property --act-arm {
  syntax: "<percentage>";
  inherits: true;
  initial-value: 30%;
}
@property --act-edge {
  syntax: "<color>";
  inherits: true;
  initial-value: transparent;
}

.links {
  display: grid;
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.key,
.columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin: 0;
  max-width: none;
}
.key dt {
  margin: 0;
  font: var(--font-weight-bold) var(--font-size-label) var(--font-family-ui);
}
.key dd {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-muted);
  font: var(--font-size-caption) / var(--line-height-ui) var(--font-family-ui);
}
.column {
  display: grid;
  gap: var(--spacing-md);
  align-content: start;
}
.step {
  margin: 0;
  color: var(--color-text);
  font: var(--font-weight-bold) var(--font-size-label) var(--font-family-ui);
}
.title-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}
.identity {
  display: grid;
  justify-items: center;
  color: var(--color-brand);
}
/* Top to bottom the gap is 8px, as settled in 02.10. */
.group {
  display: grid;
  gap: var(--spacing-sm);
}
.sentence {
  margin: 0;
  max-width: none;
  color: var(--color-text);
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
}
.on-void {
  display: grid;
  gap: var(--spacing-md);
}
/* The band as settled in 02.11: the void, a single row, 8px above and below
   and 16px at each end and between buttons. */
.band {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-void);
}

/* The link under study. */
.link {
  --_line: color-mix(in srgb, var(--color-action) 40%, transparent);
  color: var(--color-action);
  text-decoration: none;
  outline: none;
  transition:
    color var(--duration-fast) var(--ease-standard),
    text-decoration-color var(--duration-fast) var(--ease-standard);
}
.link.alone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-min-height);
  font:
    var(--font-weight-regular) var(--font-control-size) / 1
    var(--font-family-ui);
}
.v-plain .link:is(:hover, :focus-visible, .is-pointer) {
  color: var(--color-text);
}
:is(.v-under, .v-line) .link {
  text-decoration: underline;
  text-decoration-color: var(--_line);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.35em;
}
:is(.v-under, .v-line) .link:is(:hover, :focus-visible, .is-pointer) {
  text-decoration-color: var(--color-action);
}
.v-line .link {
  color: var(--color-text);
}

/* Both buttons: an unclipped element, a fill on ::before and an edge on
   ::after, each following the cut. */
.on-void {
  --step: var(--color-elev-2);
}
.on-panel {
  --step: var(--color-elev-3);
}
.act {
  --_cut: var(--cut-size-md);
  --_w: 1px;
  --_inset: 0px;
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
  transition:
    --act-arm var(--duration-fast) var(--ease-standard),
    --act-edge var(--duration-fast) var(--ease-standard);
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
    var(--act-edge) 0 var(--act-arm),
    transparent var(--act-arm) calc(100% - var(--act-arm)),
    var(--act-edge) calc(100% - var(--act-arm))
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

.band .act {
  padding-inline: var(--spacing-sm);
  font-size: var(--font-size-label);
}

/* The quiet button as settled: rest, pointer and held. */
.q {
  --_fill: var(--step);
  --act-arm: 30%;
  --act-edge: lch(25% 32 290);
  color: var(--color-text);
}
.q:is(:hover, :active):not(:disabled) {
  --act-edge: var(--color-action);
}
.q:active:not(:disabled) {
  --_fill: color-mix(in srgb, var(--color-action) 28%, transparent);
}
/* The call to action: the production look, rebuilt unclipped. */
.cta {
  --_fill: var(--color-action);
  --act-arm: 30%;
  --act-edge: transparent;
  color: var(--color-on-brand);
  font-weight: var(--font-weight-medium);
}
.cta:hover:not(:disabled) {
  filter: brightness(var(--state-hover-brightness));
}

/* Focus as settled in 02.8: as a pointer. */
.q:focus-visible:not(:disabled) {
  --act-edge: var(--color-action);
}
.cta:focus-visible:not(:disabled) {
  --act-edge: var(--color-on-brand);
  --_inset: 3px;
  --_w: 2px;
}

/* Unavailable, as settled in 02.9: an empty frame. The call to action's
   frame is lime. */
.act:disabled {
  --_fill: transparent;
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.q:disabled {
  --act-edge: lch(25% 32 290);
}
.cta:disabled {
  --act-edge: var(--color-action);
}

@media (prefers-reduced-motion: reduce) {
  .act,
  .act::before,
  .link {
    transition: none;
  }
}
</style>
