<script lang="ts">
// Actions study, 02.2: the quiet button at rest, and nothing else. The pane
// from 02.1 stands in a slice of the title screen and a slice of the Hangar,
// among the production logomark, tabs, switch and call to action. Versions
// differ in one property each. Only the quiet button is scoped to this
// component. Fixture: ship facts are sample values and no action does
// anything; the quiet buttons have no pointer, held or unavailable design
// yet, so Gauntlet is only dimmed.
import "@void-drift/core/styles/buttons.css";
import "@void-drift/core/styles/surfaces.css";
import Switch from "../inputs/Switch.svelte";
import Tabs, { type TabItem } from "../inputs/Tabs.svelte";
import Logo from "../Logo.svelte";

let {
  label = "The quiet button at rest, in three versions",
}: { label?: string } = $props();

const variants = [
  {
    id: "plain",
    name: "Pane",
    note: "As taken forward from 02.1. The reference.",
  },
  {
    id: "bold",
    name: "1 / Heavier label",
    note: "Only the label changes: the bold weight of the interface face, as the switch's ON and OFF use.",
  },
  {
    id: "lift",
    name: "2 / Even lift",
    note: "Only the surface changes. On the void a pane stands two elevation steps above its background, on a panel only one; here it stands two steps above both, by the elevation rule.",
  },
  {
    id: "both",
    name: "3 / Both",
    note: "The heavier label on the evenly lifted surface.",
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

<section class="rest" aria-label={label}>
  {#each variants as variant, index}
    <article class={`variant v-${variant.id}`} aria-label={variant.name}>
      <header>
        <h3>{variant.name}</h3>
        <p>{variant.note}</p>
      </header>
      <div class="scenes">
        <div class="scene on-panel">
          <p class="caption">Title screen</p>
          <div class="panel title-panel">
            <div class="identity">
              <Logo size="sm" />
              <p class="wordmark">VOID DRIFT</p>
            </div>
            <div class="button-group button-group--vertical">
              <button type="button" class="btn btn-filled">PRESS START</button>
              {#each menu as item}
                <button type="button" class="q">{item}</button>
              {/each}
            </div>
            <p class="version">ACTIVE SHIP · WASP</p>
          </div>
        </div>
        <div class="scene on-void hangar">
          <p class="caption">Hangar: header, ship tabs and launch row</p>
          <div class="hangar-header">
            <p class="hangar-title">Hangar</p>
            <label class="playground" for={`rest-playground-${index}`}>
              <span>Playground</span>
              <Switch
                id={`rest-playground-${index}`}
                bind:checked={playground}
              />
            </label>
          </div>
          <Tabs
            label={`${variant.name}: choose chassis`}
            tabs={ships}
            stretch
            activation="manual"
            bind:value={ship}
          >
            {#snippet panel(tab)}
              <p class="workbench">{tab.label} workbench</p>
            {/snippet}
          </Tabs>
          <div class="launch-row">
            <button type="button" class="q">Practice</button>
            <button type="button" class="q">Derelicts</button>
            <button type="button" class="q" disabled>Gauntlet</button>
            <button type="button" class="btn btn-filled">Survival</button>
          </div>
        </div>
      </div>
    </article>
  {/each}
</section>

<style>
.rest {
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
  flex: 0 0 11rem;
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
  grid-template-columns: minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
  padding-top: var(--spacing-md);
}
.caption {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}

/* A slice of the title screen's panel. */
.title-panel {
  width: 20rem;
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
}
.identity {
  display: grid;
  justify-items: center;
  gap: var(--spacing-sm);
  color: var(--color-brand);
}
.wordmark {
  margin: 0;
  color: var(--color-text);
  font: var(--font-weight-bold) var(--font-size-heading) var(--font-family-ui);
}
.version {
  margin: 0;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
  letter-spacing: var(--tracking-eyebrow);
  text-align: center;
}

/* A slice of the Hangar: its header, tabs and footer row. */
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
  padding: var(--spacing-lg) var(--spacing-md);
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
}
.launch-row {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-subtle);
}
.launch-row :is(.btn, .q) {
  flex: 1 1 0;
  max-width: 180px;
}

/* The quiet button at rest: a cut surface and a label. */
.on-void {
  --step: var(--color-elev-2);
}
.on-panel {
  --step: var(--color-elev-3);
}
.q {
  --_cut: var(--cut-size-md);
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
.q::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: var(--layer-under);
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
/* Not designs: a stand-in so the row shows an unavailable action, and a
   plain outline so keyboard focus can be seen. */
.q:disabled {
  opacity: var(--state-disabled-opacity);
}
.q:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: 2px;
}

:is(.v-bold, .v-both) .q {
  font-weight: var(--font-weight-bold);
}
/* One elevation step above elevation 3: lightness +5.5, chroma +5, hue 290. */
:is(.v-lift, .v-both) .on-panel {
  --step: lch(22% 25 290);
}
</style>
