<script lang="ts" module>
export type TabItem = {
  /** Stable identity; the bound value. */
  id: string;
  /** The tab's accessible name and visible label. */
  label: string;
  /** Up to two short facts, set small beside the label. */
  facts?: string[];
  /** Present and focusable, but its panel cannot be shown. */
  unavailable?: boolean;
};
</script>

<script lang="ts">
// Design-system tabs: the Toggle's cut button split into parts, where each
// part owns one panel shown below. The selected part is filled lime. A part
// holds its name and up to two small facts, and the row never grows taller
// than a button. Semantics and keys
// follow the WAI-ARIA Authoring Practices tabs pattern: one tab stop, arrows
// move between tabs, Home and End reach the ends.
import type { Snippet } from "svelte";

let {
  tabs,
  value = $bindable(),
  label,
  activation = "automatic",
  stretch = false,
  panel,
}: {
  tabs: TabItem[];
  /** Id of the tab whose panel is shown. */
  value: string;
  /** Accessible name of the tab list. */
  label: string;
  /** Automatic shows a panel when its tab takes focus; manual waits for
   *  Enter or Space. */
  activation?: "automatic" | "manual";
  /** Tabs share the host width equally instead of sizing to their content. */
  stretch?: boolean;
  /** Content of the selected tab's panel. */
  panel: Snippet<[TabItem]>;
} = $props();

const uid = $props.id();
const tabId = (id: string) => `${uid}-tab-${id}`;
const panelId = (id: string) => `${uid}-panel-${id}`;

// The panel names itself after its tab; the tab points back with aria-controls.
const panelLink = $derived({
  id: panelId(value),
  "aria-labelledby": tabId(value),
});

let list: HTMLDivElement | undefined = $state();
const selected = $derived(tabs.find((tab) => tab.id === value));

function select(tab: TabItem) {
  if (!tab.unavailable) value = tab.id;
}

function focusTab(index: number) {
  const tab = tabs[index];
  if (!tab) return;
  const node = list?.querySelector<HTMLElement>(
    `#${CSS.escape(tabId(tab.id))}`,
  );
  node?.focus();
  node?.scrollIntoView({ block: "nearest", inline: "nearest" });
  if (activation === "automatic") select(tab);
}

function onkeydown(event: KeyboardEvent, index: number) {
  const last = tabs.length - 1;
  const target =
    event.key === "ArrowRight"
      ? index === last
        ? 0
        : index + 1
      : event.key === "ArrowLeft"
        ? index === 0
          ? last
          : index - 1
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? last
            : undefined;
  if (target === undefined) return;
  event.preventDefault();
  focusTab(target);
}
</script>

<div class="tabs" class:stretch>
  <div
    class="list"
    role="tablist"
    aria-label={label}
    aria-orientation="horizontal"
    bind:this={list}
  >
    {#each tabs as tab, index (tab.id)}
      <button
        type="button"
        class="tab"
        role="tab"
        id={tabId(tab.id)}
        aria-label={tab.label}
        aria-selected={tab.id === value}
        aria-controls={tab.id === value ? panelId(tab.id) : undefined}
        aria-disabled={tab.unavailable ? "true" : undefined}
        aria-describedby={tab.facts?.length
          ? `${tabId(tab.id)}-facts`
          : undefined}
        tabindex={tab.id === (selected?.id ?? tabs[0]?.id) ? 0 : -1}
        onclick={() => select(tab)}
        onkeydown={(event) => onkeydown(event, index)}
      >
        <span class="name">{tab.label}</span>
        {#if tab.facts?.length}
          <span class="facts" id={`${tabId(tab.id)}-facts`}>
            {#each tab.facts.slice(0, 2) as fact}
              <span>{fact}</span>
            {/each}
          </span>
        {/if}
      </button>
    {/each}
  </div>
  <!-- biome-ignore lint/a11y/noNoninteractiveTabindex: The tabs pattern makes the panel a tab stop so content without its own control is reachable. -->
  <div class="tabpanel" role="tabpanel" tabindex="0" {...panelLink}>
    {#if selected}
      {@render panel(selected)}
    {/if}
  </div>
</div>

<style>
.tabs {
  display: grid;
  min-width: 0;
  width: 100%;
}
/* The outer edge is the shared button shape; the split inside is straight.
   The row is exactly one button tall. A row wider than its host scrolls
   sideways; parts never wrap or shrink below their content. */
.list {
  --_cut: var(--button-cut-size);
  display: inline-flex;
  justify-self: start;
  max-width: 100%;
  min-width: 0;
  height: var(--button-min-height);
  overflow-x: auto;
  scrollbar-width: none;
  clip-path: polygon(
    var(--_cut) 0%,
    100% 0%,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0% 100%,
    0% var(--_cut)
  );
}
.stretch .list {
  display: flex;
  justify-self: stretch;
}
.tab {
  --_facts: var(--color-text-muted);
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: 0 var(--button-padding-x);
  border: 0;
  background: var(--color-elev-2);
  color: var(--color-text);
  font: inherit;
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: var(--button-transition);
}
.stretch .tab {
  flex: 1 0 auto;
}
/* The name leads the part and two caption lines close it, inside the
   button's height. */
.facts {
  display: grid;
  justify-items: end;
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-heading);
  color: var(--_facts);
}
.tab:has(.facts) {
  padding-inline: var(--spacing-md);
}
.tab:not([aria-selected="true"], [aria-disabled="true"]):hover {
  --_facts: var(--color-text);
  background: color-mix(in srgb, var(--color-action) 28%, transparent);
}
.tab[aria-selected="true"] {
  --_facts: var(--color-on-brand);
  background: var(--color-selected);
  color: var(--color-on-brand);
  cursor: default;
}
/* An unavailable part is an empty frame in the row: no fill, a faint edge,
   muted text at full strength so it stays readable. */
.tab[aria-disabled="true"] {
  background: transparent;
  box-shadow: inset 0 0 0 var(--border-width-control) var(--color-elev-2);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.tab:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
.tabpanel {
  min-width: 0;
  padding-block-start: var(--spacing-md);
}
.tabpanel:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-width);
}
@media (prefers-reduced-motion: reduce) {
  .tab {
    transition: none;
  }
}
</style>
