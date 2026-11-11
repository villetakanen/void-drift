<script lang="ts">
// Actions study, 02.8: keyboard focus, for the quiet button and for the call
// to action. Rest, pointer and held are settled and the same in every
// version. Four title groups stand side by side on narrowed panels, each with
// one quiet button forced into focus; four launch rows stand under one slice
// of the Hangar, each with the call to action forced into focus. Every button
// also takes real keyboard focus. The logomark, tabs and switch are
// production. The quiet button and the call to action are scoped copies: the
// production button clips itself to its cut shape, which would clip any
// frame drawn outside it. Fixture: ship facts are sample values and no action
// does anything; unavailable is not designed yet, so Gauntlet is only dimmed.
import "@void-drift/core/styles/surfaces.css";
import Switch from "../inputs/Switch.svelte";
import Tabs, { type TabItem } from "../inputs/Tabs.svelte";
import Logo from "../Logo.svelte";

let { label = "Four answers for keyboard focus" }: { label?: string } =
  $props();

const variants = [
  {
    id: "ring",
    name: "0 / Today's ring",
    note: "A pale ring set inside the button. The reference. On the call to action it is pale on lime and close to invisible.",
  },
  {
    id: "same",
    name: "1 / As a pointer",
    note: "Focus is the keyboard's pointer: the brackets turn lime. The call to action, which has none, shows dark brackets inside its fill.",
  },
  {
    id: "closed",
    name: "2 / Frame closes",
    note: "The brackets close into a whole frame, pale and two pixels wide. On the call to action the frame is dark, just inside the fill.",
  },
  {
    id: "sight",
    name: "3 / Sight",
    note: "A pale frame stands a few pixels outside the button, around its cut shape, like a sight on a target. It is the same on every button.",
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

<section class="focus" aria-label={label}>
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
      focused state. Press Tab to move real focus through the buttons.
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
              <button type="button" class="act cta">
                PRESS START<span class="sight" aria-hidden="true"></span>
              </button>
              {#each menu as item}
                <button
                  type="button"
                  class="act q"
                  class:is-focus={item === "TOP SCORES"}
                >
                  {item}<span class="sight" aria-hidden="true"></span>
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
      Hangar: header and ship tabs, then the launch row four times. Survival,
      the call to action, is held in its focused state.
    </p>
    <div class="hangar-header">
      <p class="hangar-title">Hangar</p>
      <label class="playground" for="focus-playground">
        <span>Playground</span>
        <Switch id="focus-playground" bind:checked={playground} />
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
        <button type="button" class="act q">
          Practice<span class="sight" aria-hidden="true"></span>
        </button>
        <button type="button" class="act q">
          Derelicts<span class="sight" aria-hidden="true"></span>
        </button>
        <button type="button" class="act q" disabled>
          Gauntlet<span class="sight" aria-hidden="true"></span>
        </button>
        <button type="button" class="act cta is-focus">
          Survival<span class="sight" aria-hidden="true"></span>
        </button>
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

.focus {
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
/* Not a design: a stand-in so the row shows an unavailable action. */
.q:disabled {
  opacity: var(--state-disabled-opacity);
  cursor: not-allowed;
}

/* The call to action: the production look, rebuilt unclipped. */
.cta {
  --_fill: var(--color-action);
  --act-arm: 30%;
  --act-edge: transparent;
  color: var(--color-on-brand);
  font-weight: var(--font-weight-medium);
}
.cta:hover {
  filter: brightness(var(--state-hover-brightness));
}

/* The sight: a closed frame outside the button, used by version 3 only. */
.sight {
  --_sw: 2px;
  --_sc: calc(var(--cut-size-md) + 2px);
  --_si: calc(var(--_sc) + 0.4142 * var(--_sw));
  position: absolute;
  inset: -4px;
  pointer-events: none;
  background: transparent;
  clip-path: polygon(
    evenodd,
    var(--_sc) 0,
    100% 0,
    100% calc(100% - var(--_sc)),
    calc(100% - var(--_sc)) 100%,
    0 100%,
    0 var(--_sc),
    var(--_sc) 0,
    var(--_si) var(--_sw),
    calc(100% - var(--_sw)) var(--_sw),
    calc(100% - var(--_sw)) calc(100% - var(--_si)),
    calc(100% - var(--_si)) calc(100% - var(--_sw)),
    var(--_sw) calc(100% - var(--_sw)),
    var(--_sw) var(--_si),
    var(--_si) var(--_sw),
    var(--_sc) 0
  );
}

/* 0: today's ring, set five pixels inside. */
.v-ring .act:is(:focus-visible, .is-focus) {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}

/* 1: focus looks like a pointer. */
.v-same .q:is(:focus-visible, .is-focus) {
  --act-edge: var(--color-action);
}
.v-same .cta:is(:focus-visible, .is-focus) {
  --act-edge: var(--color-on-brand);
  --_inset: 3px;
  --_w: 2px;
}

/* 2: the brackets close into a whole frame. */
.v-closed .q:is(:focus-visible, .is-focus) {
  --act-edge: var(--color-focus-ring);
  --act-arm: 50%;
  --_w: 2px;
}
.v-closed .cta:is(:focus-visible, .is-focus) {
  --act-edge: var(--color-on-brand);
  --act-arm: 50%;
  --_inset: 3px;
  --_w: 2px;
}

/* 3: a frame outside the button. */
.v-sight .act:is(:focus-visible, .is-focus) .sight {
  background: var(--color-focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .act,
  .act::before {
    transition: none;
  }
}
</style>
