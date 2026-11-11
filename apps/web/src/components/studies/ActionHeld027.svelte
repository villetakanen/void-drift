<script lang="ts">
// Actions study, 02.7: what the quiet button shows while it is held down.
// Rest and pointer are settled (the pane, a regular label, brackets at
// lch(25% 32 290) that turn lime under a pointer) and are the same in every
// version. Four title groups stand side by side on narrowed panels and four
// launch rows under one slice of the Hangar; in each, one button is forced
// into its pointer state and one into its held state, and every button
// answers a real pointer and press. The logomark, tabs, switch and call to
// action are production; only the quiet button is scoped to this component.
// Fixture: ship facts are sample values and no action does anything; focus
// and unavailable are not designed yet, so Gauntlet is only dimmed.
import "@void-drift/core/styles/buttons.css";
import "@void-drift/core/styles/surfaces.css";
import Switch from "../inputs/Switch.svelte";
import Tabs, { type TabItem } from "../inputs/Tabs.svelte";
import Logo from "../Logo.svelte";

let {
  label = "Four answers for the quiet button held down",
}: { label?: string } = $props();

const variants = [
  {
    id: "none",
    name: "0 / No more than a pointer",
    note: "The button looks the same held as pointed at. The reference.",
  },
  {
    id: "close",
    name: "1 / Brackets close",
    note: "The lit brackets reach across the gap and meet while the button is held: the frame locks shut.",
  },
  {
    id: "tint",
    name: "2 / Pane lights",
    note: "The pane takes the faint lime tint of a tab under a pointer, inside the lit brackets.",
  },
  {
    id: "fill",
    name: "3 / Full light",
    note: "The pane fills lime with a dark label, as the call to action is at rest, for as long as it is held.",
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

<section class="held" aria-label={label}>
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
      pointer state and SETTINGS in its held state; the others answer a real
      pointer and press.
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
                  class:is-held={item === "SETTINGS"}
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
      Hangar: header and ship tabs, then the launch row four times. Practice is
      held in its pointer state and Derelicts in its held state.
    </p>
    <div class="hangar-header">
      <p class="hangar-title">Hangar</p>
      <label class="playground" for="held-playground">
        <span>Playground</span>
        <Switch id="held-playground" bind:checked={playground} />
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
        <button type="button" class="q is-pointer">Practice</button>
        <button type="button" class="q is-held">Derelicts</button>
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

.held {
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

/* Under a pointer, as settled in 02.6: the brackets turn lime. */
.q:is(:hover, .is-pointer, :active, .is-held):not(:disabled) {
  --act-edge: var(--color-action);
}

/* Held down. */
.v-close .q:is(:active, .is-held):not(:disabled) {
  --act-arm: 50%;
}
.v-tint .q:is(:active, .is-held):not(:disabled) {
  --_fill: color-mix(in srgb, var(--color-action) 28%, transparent);
}
.v-fill .q:is(:active, .is-held):not(:disabled) {
  --_fill: var(--color-action);
  color: var(--color-on-brand);
}
@media (prefers-reduced-motion: reduce) {
  .q,
  .q::before {
    transition: none;
  }
}
</style>
