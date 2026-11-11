<script lang="ts">
// Actions study, 02.6: what a pointer does to the quiet button. The button
// at rest is settled (the pane, a regular label, brackets at lch(25% 32 290))
// and is the same in every version. Four title groups stand side by side on
// narrowed panels and four launch rows under one slice of the Hangar; in each,
// one button is forced into its pointer state, and every button answers a
// real pointer. The logomark, tabs, switch and call to action are production;
// only the quiet button is scoped to this component. Fixture: ship facts are
// sample values and no action does anything; held, focus and unavailable are
// not designed yet, so Gauntlet is only dimmed.
import "@void-drift/core/styles/buttons.css";
import "@void-drift/core/styles/surfaces.css";
import Switch from "../inputs/Switch.svelte";
import Tabs, { type TabItem } from "../inputs/Tabs.svelte";
import Logo from "../Logo.svelte";

let {
  label = "Four answers for the quiet button under a pointer",
}: { label?: string } = $props();

const variants = [
  {
    id: "tint",
    name: "0 / As the tabs do",
    note: "The pane takes the faint lime tint a tab or toggle part takes. The brackets do not change.",
  },
  {
    id: "close",
    name: "1 / Brackets close",
    note: "The two brackets reach across the gap and meet: the frame completes around the button. No lime.",
  },
  {
    id: "light",
    name: "2 / Brackets light",
    note: "The brackets keep their gap and turn lime, the colour of what can be acted on. The pane does not change.",
  },
  {
    id: "lock",
    name: "3 / Close and light",
    note: "The brackets meet and turn lime together.",
  },
] as const;

const ships: TabItem[] = [
  { id: "wasp", label: "Wasp", facts: ["3 slots", "40 mass"] },
  { id: "scout", label: "Scout", facts: ["5 slots", "60 mass"] },
  { id: "fighter", label: "Fighter", facts: ["6 slots", "95 mass"] },
  { id: "corvette", label: "Corvette", facts: ["8 slots", "140 mass"] },
  { id: "fiddler", label: "Fiddler", facts: ["9 slots", "187 mass"] },
];
const menu = ["HANGAR", "TOP SCORES", "SETTINGS", "CREDITS"];
let ship = $state("wasp");
let playground = $state(false);
</script>

<section class="pointer" aria-label={label}>
  <dl class="key">
    {#each variants as variant}
      <div>
        <dt>{variant.name}</dt>
        <dd>{variant.note}</dd>
      </div>
    {/each}
  </dl>

  <div class="scene on-panel">
    <p class="caption">
      Title screen, four times, on narrowed panels. TOP SCORES is held in its
      pointer state; the others answer a real pointer.
    </p>
    <div class="panels">
      {#each variants as variant}
        <div class={`column v-${variant.id}`}>
          <p class="step">{variant.name}</p>
          <div class="panel title-panel">
            <div class="identity">
              <Logo size="sm" />
            </div>
            <div class="group">
              <button type="button" class="btn btn-filled">PRESS START</button>
              {#each menu as item}
                <button
                  type="button"
                  class="q"
                  class:is-pointer={item === "TOP SCORES"}
                >
                  {item}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="scene on-void">
    <p class="caption">
      Hangar: header and ship tabs, then the launch row four times. Derelicts is
      held in its pointer state. The tabs show the production tint under a
      pointer.
    </p>
    <div class="hangar-header">
      <p class="hangar-title">Hangar</p>
      <label class="playground" for="pointer-playground">
        <span>Playground</span>
        <Switch id="pointer-playground" bind:checked={playground} />
      </label>
    </div>
    <Tabs
      label="Choose chassis"
      tabs={ships}
      stretch
      activation="manual"
      bind:value={ship}
    >
      {#snippet panel(tab)}
        <p class="workbench">{tab.label} workbench</p>
      {/snippet}
    </Tabs>
    {#each variants as variant}
      <div class={`launch-row v-${variant.id}`}>
        <p class="step">{variant.name}</p>
        <button type="button" class="q">Practice</button>
        <button type="button" class="q is-pointer">Derelicts</button>
        <button type="button" class="q" disabled>Gauntlet</button>
        <button type="button" class="btn btn-filled">Survival</button>
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

.pointer {
  display: grid;
  gap: var(--spacing-xl);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.key {
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
.caption {
  margin: 0 0 var(--spacing-sm);
  max-width: none;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
.step {
  margin: 0 0 var(--spacing-xs);
  color: var(--color-text);
  font: var(--font-weight-bold) var(--font-size-label) var(--font-family-ui);
}
.panels {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-md);
}
.title-panel {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}
.identity {
  display: grid;
  justify-items: center;
  color: var(--color-brand);
}
.group {
  display: grid;
  gap: var(--spacing-sm);
}
.hangar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
.hangar-title {
  margin: 0;
  font: var(--font-weight-bold) var(--font-size-heading) var(--font-family-ui);
}
.playground {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-label);
}
.workbench {
  margin: 0;
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
.launch-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  padding-block: var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
}
.launch-row .step {
  margin: 0 auto 0 0;
}
.launch-row :is(.btn, .q) {
  flex: 0 0 180px;
}

/* The quiet button at rest, as settled in 02.5. */
.on-void {
  --step: var(--color-elev-2);
}
.on-panel {
  --step: var(--color-elev-3);
}
.q {
  --_cut: var(--cut-size-md);
  --_w: 1px;
  --_i: calc(var(--_cut) + 0.4142 * var(--_w));
  --_fill: var(--step);
  --act-arm: 30%;
  --act-edge: lch(25% 32 290);
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
  color: var(--color-text);
  font:
    var(--font-weight-regular) var(--font-control-size) / 1
    var(--font-family-ui);
  white-space: nowrap;
  cursor: pointer;
  appearance: none;
  transition:
    --act-arm var(--duration-fast) var(--ease-standard),
    --act-edge var(--duration-fast) var(--ease-standard);
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
.q::after {
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
/* Not designs: a stand-in so the row shows an unavailable action, and a
   plain outline so keyboard focus can be seen. */
.q:disabled {
  opacity: var(--state-disabled-opacity);
  cursor: not-allowed;
}
.q:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* Under a pointer. */
.v-tint .q:is(:hover, .is-pointer):not(:disabled) {
  --_fill: color-mix(in srgb, var(--color-action) 28%, transparent);
}
.v-close .q:is(:hover, .is-pointer):not(:disabled) {
  --act-arm: 50%;
}
.v-light .q:is(:hover, .is-pointer):not(:disabled) {
  --act-edge: var(--color-action);
}
.v-lock .q:is(:hover, .is-pointer):not(:disabled) {
  --act-arm: 50%;
  --act-edge: var(--color-action);
}
@media (prefers-reduced-motion: reduce) {
  .q,
  .q::before {
    transition: none;
  }
}
</style>
