<script lang="ts">
// Actions study, 02.5: the bracket in the pane's hue, stepped down in
// lightness. Hue 290 and chroma 32 are held; lightness falls from 40% in
// steps of five. Five title groups stand side by side on narrowed panels,
// and five launch rows stand under one slice of the Hangar, so neighbouring
// steps can be compared directly. The logomark, tabs, switch and call to
// action are production; only the quiet button is scoped to this component.
// Fixture: ship facts are sample values and no action does anything; the
// quiet buttons have no pointer, held or unavailable design yet, so Gauntlet
// is only dimmed.
import "@void-drift/core/styles/buttons.css";
import "@void-drift/core/styles/surfaces.css";
import Switch from "../inputs/Switch.svelte";
import Tabs, { type TabItem } from "../inputs/Tabs.svelte";
import Logo from "../Logo.svelte";

let {
  label = "The bracket in the pane's hue at five lightness steps",
}: { label?: string } = $props();

const steps = [40, 35, 30, 25, 20];
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

<section class="tones" aria-label={label}>
  <div class="scene on-panel">
    <p class="caption">
      Title screen, five times, on narrowed panels. Bracket lightness, left to
      right:
    </p>
    <div class="panels">
      {#each steps as step}
        <div class="column" style={`--_edge: lch(${step}% 32 290)`}>
          <p class="step">{step}%{step === 40 ? " · as in 02.4" : ""}</p>
          <div class="panel title-panel">
            <div class="identity">
              <Logo size="sm" />
            </div>
            <div class="group">
              <button type="button" class="btn btn-filled">PRESS START</button>
              {#each menu as item}
                <button type="button" class="q">{item}</button>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="scene on-void">
    <p class="caption">
      Hangar: header and ship tabs, then the launch row five times
    </p>
    <div class="hangar-header">
      <p class="hangar-title">Hangar</p>
      <label class="playground" for="tone-playground">
        <span>Playground</span>
        <Switch id="tone-playground" bind:checked={playground} />
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
    {#each steps as step}
      <div class="launch-row" style={`--_edge: lch(${step}% 32 290)`}>
        <p class="step">{step}%</p>
        <button type="button" class="q">Practice</button>
        <button type="button" class="q">Derelicts</button>
        <button type="button" class="q" disabled>Gauntlet</button>
        <button type="button" class="btn btn-filled">Survival</button>
      </div>
    {/each}
  </div>
</section>

<style>
.tones {
  display: grid;
  gap: var(--spacing-xl);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.caption {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
.step {
  margin: 0 0 var(--spacing-xs);
  color: var(--color-text);
  font: var(--font-weight-bold) var(--font-size-label) var(--font-family-ui);
}

/* Five title panels side by side. */
.panels {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-md);
}
.title-panel {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-sm);
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
.group :is(.btn, .q) {
  padding-inline: var(--spacing-sm);
  font-size: var(--font-size-label);
}

/* A slice of the Hangar, with the launch row repeated. */
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

/* The quiet button at rest: the pane and its brackets. */
.on-void {
  --step: var(--color-elev-2);
}
.on-panel {
  --step: var(--color-elev-3);
}
.q {
  --_cut: var(--cut-size-md);
  --_w: 1px;
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
  color: var(--color-text);
  font:
    var(--font-weight-regular) var(--font-control-size) / 1
    var(--font-family-ui);
  white-space: nowrap;
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
  background: var(--step);
  clip-path: polygon(
    var(--_cut) 0,
    100% 0,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0 100%,
    0 var(--_cut)
  );
}
/* A 1px edge around the cut shape, left unpainted across the middle 40% of
   the top and bottom. */
.q::after {
  background: linear-gradient(
    to right,
    var(--_edge) 0 var(--_arm),
    transparent var(--_arm) calc(100% - var(--_arm)),
    var(--_edge) calc(100% - var(--_arm))
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
}
.q:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: 2px;
}
</style>
