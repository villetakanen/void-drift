<script lang="ts">
// Actions study, 02.9: an unavailable action, quiet or call to action. Rest,
// pointer, held and focus are settled and the same in every version. Four
// title groups stand side by side on narrowed panels with the call to action
// unavailable, as while the game loads; under one slice of the Hangar each
// version has two launch rows, one with Gauntlet unavailable and one where
// the ship cannot launch and all four are. The logomark, tabs and switch are
// production. The quiet button and the call to action are scoped copies
// built without clipping. Fixture: ship facts are sample values and no
// action does anything.
import "@void-drift/core/styles/surfaces.css";
import Switch from "../inputs/Switch.svelte";
import Tabs, { type TabItem } from "../inputs/Tabs.svelte";
import Logo from "../Logo.svelte";

let { label = "Four answers for keyboard focus" }: { label?: string } =
  $props();

const variants = [
  {
    id: "fade",
    name: "0 / Today's fade",
    note: "The whole button at 45% opacity. The reference. The brackets and the lime stay, only weaker.",
  },
  {
    id: "frame",
    name: "1 / Empty frame",
    note: "As an unavailable tab: the pane is gone and the brackets hold an empty place, with a muted label. The call to action loses its lime the same way.",
  },
  {
    id: "unlit",
    name: "2 / Unlit pane",
    note: "The brackets, the sign of something to press, are gone. A darker pane and a muted label remain. The call to action becomes the same unlit pane.",
  },
  {
    id: "label",
    name: "3 / Label only",
    note: "No pane and no brackets: only a muted label keeps the place.",
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

<section class="unavailable" aria-label={label}>
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
      Title screen, four times, on narrowed panels. PRESS START is unavailable,
      as while the game loads.
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
              <button type="button" class="act cta" disabled>
                PRESS START
              </button>
              {#each menu as item}
                <button type="button" class="act q">{item}</button>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="scene on-void">
    <p class="caption">
      Hangar: header and ship tabs, then two launch rows for each version: one
      with Gauntlet unavailable, one where the ship cannot launch.
    </p>
    <div class="hangar-header">
      <p class="hangar-title">Hangar</p>
      <label class="playground" for="unavailable-playground">
        <span>Playground</span>
        <Switch id="unavailable-playground" bind:checked={playground} />
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
      {#each [false, true] as blocked}
        <div class={`launch-row v-${variant.id}`}>
          <p class="step">
            {variant.name}{blocked ? " · cannot launch" : ""}
          </p>
          <button type="button" class="act q" disabled={blocked}>
            Practice
          </button>
          <button type="button" class="act q" disabled={blocked}>
            Derelicts
          </button>
          <button type="button" class="act q" disabled>Gauntlet</button>
          <button type="button" class="act cta" disabled={blocked}>
            Survival
          </button>
        </div>
      {/each}
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

.unavailable {
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

.launch-row .act {
  flex: 0 0 180px;
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

/* Unavailable. */
.act:disabled {
  cursor: not-allowed;
}
.v-fade .act:disabled {
  opacity: var(--state-disabled-opacity);
}
.v-frame .act:disabled {
  --_fill: transparent;
  --act-edge: lch(25% 32 290);
  color: var(--color-text-muted);
  filter: none;
}
.v-unlit .act:disabled {
  --_fill: color-mix(in srgb, var(--step) 50%, transparent);
  --act-edge: transparent;
  color: var(--color-text-muted);
  filter: none;
}
.v-label .act:disabled {
  --_fill: transparent;
  --act-edge: transparent;
  color: var(--color-text-muted);
  filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .act,
  .act::before {
    transition: none;
  }
}
</style>
