<script lang="ts">
// Actions study, 02.13: the fine detail of a link. The material is settled:
// lime words on a lime line. Four columns step the line's strength at rest
// down from 40%. In each column the same link is then held in three pointer
// states, so a line strength and a pointer answer can be chosen together;
// every link also answers a real pointer and the keyboard in the first of
// the three ways. The logomark is production; the buttons are scoped copies.
// Fixture: the sentences are sample wording, CREDITS as a link is part of
// the example and not a decision, and no link goes anywhere.
import "@void-drift/core/styles/surfaces.css";
import Logo from "../Logo.svelte";

let {
  label = "A link's line at four strengths, with three pointer answers",
}: { label?: string } = $props();

const strengths = [40, 30, 20, 10];
const answers = [
  ["a", "the line lights", "is-a"],
  ["b", "the line lights and thickens", "is-b"],
  ["c", "the line brightens halfway", "is-c"],
] as const;
const menu = ["HANGAR", "TOP SCORES", "SETTINGS"];
</script>

<section class="links" aria-label={label}>
  <div class="columns">
    {#each strengths as strength}
      <div class="column" style={`--_rest: ${strength}%`}>
        <p class="step">
          Line at {strength}%{strength === 40 ? " · as in 02.12" : ""}
        </p>

        <div class="panel title-panel on-panel">
          <div class="identity"><Logo size="sm" /></div>
          <div class="group">
            <button type="button" class="act cta">PRESS START</button>
            {#each menu as item}
              <button type="button" class="act q">{item}</button>
            {/each}
            <a class="link alone" href="#line">CREDITS</a>
          </div>
          <p class="sentence">
            Fonts under the Open Font License.
            <a class="link" href="#line">Read the licences</a>.
          </p>
        </div>

        <div class="on-void">
          <p class="sentence">
            Practice flies a repeatable star system.
            <a class="link" href="#line">How modes differ</a>.
          </p>
          <dl class="answers">
            {#each answers as [letter, name, flag]}
              <div>
                <dt>{letter} / {name}</dt>
                <dd><span class={`link ${flag}`}>How scoring works</span></dd>
              </div>
            {/each}
            <div>
              <dt>unavailable, proposed</dt>
              <dd>
                <span class="link is-unavailable">How scoring works</span>
              </dd>
            </div>
          </dl>
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.answers {
  display: grid;
  gap: var(--spacing-sm);
  margin: 0;
  max-width: none;
}
.answers dt {
  margin: 0;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
.answers dd {
  margin: 0;
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
}

/* The link as settled in 02.12: lime words on a lime line. The line's
   strength at rest comes from the column. */
.link {
  color: var(--color-action);
  text-decoration: underline;
  text-decoration-color: color-mix(
    in srgb,
    var(--color-action) var(--_rest),
    transparent
  );
  text-decoration-thickness: 1px;
  text-underline-offset: 0.35em;
  outline: none;
  transition: text-decoration-color var(--duration-fast) var(--ease-standard);
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
/* Under a pointer. Live links use answer a. */
a.link:is(:hover, :focus-visible),
.link.is-a,
.link.is-b {
  text-decoration-color: var(--color-action);
}
.link.is-b {
  text-decoration-thickness: 2px;
}
.link.is-c {
  text-decoration-color: color-mix(
    in srgb,
    var(--color-action) 70%,
    transparent
  );
}
/* Proposed: muted words and no line. */
.link.is-unavailable {
  color: var(--color-text-muted);
  text-decoration: none;
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
