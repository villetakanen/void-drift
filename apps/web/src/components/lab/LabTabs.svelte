<script lang="ts">
import "./catalog.css";
import { CHASSIS, SHIP_IDENTITY } from "@void-drift/mode-a";
import Switch from "../inputs/Switch.svelte";
import Tabs, { type TabItem } from "../inputs/Tabs.svelte";
import Toggle from "../inputs/Toggle.svelte";

let { label = "Tabs design system" }: { label?: string } = $props();

// The Tabs reference. Every example is the shared component over the ship
// catalog; all state is local to this page.
type ShipId = keyof typeof CHASSIS & keyof typeof SHIP_IDENTITY;
const fleet: ShipId[] = ["wasp", "scout", "fighter", "corvette", "fiddler"];
const three = fleet.slice(0, 3);
const four = fleet.slice(0, 4);

const slots = (id: ShipId) =>
  (id === "wasp" ? 1 : 2) + CHASSIS[id].hull + CHASSIS[id].aft;
const facts = (id: ShipId) => [
  `${slots(id)} slots`,
  `${CHASSIS[id].mass} mass`,
];
const factTabs = (ids: ShipId[]): TabItem[] =>
  ids.map((id) => ({
    id,
    label: SHIP_IDENTITY[id].shortName,
    facts: facts(id),
  }));
const plainTabs = (ids: ShipId[]): TabItem[] =>
  ids.map((id) => ({ id, label: SHIP_IDENTITY[id].shortName }));

let first = $state<string>("scout");
let plain = $state<string>("scout");
let detailed = $state<string>("scout");
let manual = $state<string>("wasp");
let narrow = $state<string>("wasp");
let stretched = $state<string>("fighter");
let lastAvailable = $state(false);

let compareTab = $state<string>("scout");
let compareToggle = $state("Plan");
let compareSwitch = $state(true);

const detailedTabs = $derived<TabItem[]>(
  four.map((id, index) => {
    const unavailable = index === four.length - 1 && !lastAvailable;
    return {
      id,
      label: SHIP_IDENTITY[id].shortName,
      facts: facts(id),
      unavailable,
    };
  }),
);
</script>

{#snippet shipPanel(tab: TabItem)}
  {@const id = tab.id as ShipId}
  <div class="ship-panel">
    <h3>{SHIP_IDENTITY[id].longName}</h3>
    <p>{SHIP_IDENTITY[id].trait}</p>
    <dl>
      <div>
        <dt>Mass</dt>
        <dd>{CHASSIS[id].mass}</dd>
      </div>
      <div>
        <dt>Base speed</dt>
        <dd>{CHASSIS[id].baseSpeed}</dd>
      </div>
      <div>
        <dt>Hull slots</dt>
        <dd>{CHASSIS[id].hull}</dd>
      </div>
      <div>
        <dt>Aft slots</dt>
        <dd>{CHASSIS[id].aft}</dd>
      </div>
    </dl>
  </div>
{/snippet}

<section class="catalog" aria-label={label}>
  <section>
    <h2>Tabs</h2>
    <p>
      The toggle's cut button, split into parts, where each part owns one panel
      shown below it. The selected part is filled lime; the others are a faint
      fill that takes a faint lime tint under a pointer. It looks like the
      toggle on purpose: the difference is what it does. Choosing a tab changes
      what is shown beneath it, not a value the host reads.
    </p>
    <div class="example" data-testid="tabs-default">
      <span class="caption"
        >Name and two facts · parts size to their content</span
      >
      <Tabs
        label="Ship"
        tabs={factTabs(four)}
        bind:value={first}
        panel={shipPanel}
      />
    </div>
  </section>

  <section>
    <h2>Tabs, Toggle or Switch</h2>
    <p>
      The three look related and answer different questions. Pick by what the
      control does, not by how many options it has or how it should look.
    </p>
    <div class="compare">
      <div class="example">
        <span class="caption">Tabs · which view am I looking at?</span>
        <Tabs
          label="Ship, comparison"
          tabs={plainTabs(three)}
          bind:value={compareTab}
        >
          {#snippet panel(tab)}
            <p class="note">
              Each tab owns a panel: {SHIP_IDENTITY[tab.id as ShipId].longName}.
            </p>
          {/snippet}
        </Tabs>
      </div>
      <div class="example">
        <span class="caption"
          >Toggle · which value does this setting have?</span
        >
        <Toggle
          label="Preview mode, comparison"
          options={["Plan", "View"]}
          bind:value={compareToggle}
        />
        <p class="note">
          One value from a set. Nothing is owned by an option; the host decides
          what the value means.
        </p>
      </div>
      <div class="example">
        <span class="caption">Switch · is this setting on?</span>
        <label class="switch-row" for="tabs-compare-switch">
          <span>Ion stabilizers</span>
          <Switch id="tabs-compare-switch" bind:checked={compareSwitch} />
        </label>
        <p class="note">One independent setting, on or off.</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">Tabs</th>
          <th scope="col">Toggle</th>
          <th scope="col">Switch</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Use for</th>
          <td>Sibling views of one area, one visible at a time</td>
          <td>One value from a small set</td>
          <td>Enabling or disabling one setting</td>
        </tr>
        <tr>
          <th scope="row">Owns content</th>
          <td>Yes: a panel per tab</td>
          <td>No</td>
          <td>No</td>
        </tr>
        <tr>
          <th scope="row">Semantics</th>
          <td><code>tablist</code>, <code>tab</code>, <code>tabpanel</code></td>
          <td>Native radio group</td>
          <td>Native checkbox</td>
        </tr>
        <tr>
          <th scope="row">Look</th>
          <td>The toggle's cut button; may carry two small facts</td>
          <td>One cut button split into filled parts</td>
          <td>Marker sliding between OFF and ON</td>
        </tr>
        <tr>
          <th scope="row">Not for</th>
          <td>Form values; commands; page navigation</td>
          <td>Swapping whole workspaces; on/off</td>
          <td>Choosing between two named values</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>Facts and unavailable tabs</h2>
    <p>
      A tab holds its name and up to two short facts. The name leads the part
      and the facts close it, set small and stacked, so the two read apart at
      any width and the row stays exactly one button tall. Nothing wraps;
      anything richer belongs in the panel. An unavailable tab is an empty frame
      in the row: no fill, muted text. It can still take keyboard focus and
      cannot be selected.
    </p>
    <div class="example" data-testid="tabs-detailed">
      <label class="switch-row" for="tabs-last-available">
        <span>Fixture: last tab available</span>
        <Switch id="tabs-last-available" bind:checked={lastAvailable} />
      </label>
      <Tabs
        label="Ship, detailed"
        tabs={detailedTabs}
        bind:value={detailed}
        panel={shipPanel}
      />
    </div>
    <p>
      Facts are the default. A row may go without them when the names say
      enough; it keeps the same height.
    </p>
    <div class="example" data-testid="tabs-plain">
      <span class="caption">Without facts</span>
      <Tabs
        label="Ship, plain"
        tabs={plainTabs(four)}
        bind:value={plain}
        panel={shipPanel}
      />
    </div>
  </section>

  <section>
    <h2>Activation</h2>
    <p>
      Activation is automatic by default: moving focus with the arrow keys shows
      that tab's panel at once, as a pointer press does. Use
      <code>activation="manual"</code>
      when showing a panel is slow or has a consequence the player should
      confirm; arrows then only move focus and Enter or Space selects.
    </p>
    <div class="example" data-testid="tabs-manual">
      <span class="caption"
        >Manual activation · arrows, then Enter or Space</span
      >
      <Tabs
        label="Ship, manual activation"
        activation="manual"
        tabs={factTabs(four)}
        bind:value={manual}
        panel={shipPanel}
      />
    </div>
    <table>
      <thead>
        <tr>
          <th scope="col">Key</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Tab</th>
          <td>
            Enters the row at the selected tab; again, moves to the panel. The
            row is one tab stop.
          </td>
        </tr>
        <tr>
          <th scope="row">← →</th>
          <td>
            Previous or next tab, wrapping at the ends. Unavailable tabs take
            focus and are never selected.
          </td>
        </tr>
        <tr>
          <th scope="row">Home · End</th>
          <td>First or last tab.</td>
        </tr>
        <tr>
          <th scope="row">Enter · Space</th>
          <td>Selects the focused tab (needed only with manual activation).</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>Width and overflow</h2>
    <p>
      Tabs size to their content and never wrap, shrink or grow taller. A row
      wider than its host scrolls sideways inside itself, and the focused tab is
      brought into view. <code>stretch</code> shares a wide host between the
      tabs. If a row scrolls at its normal width, it has too many tabs or too
      much in them: shorten the facts or use another pattern.
    </p>
    <div class="example">
      <span class="caption">Five tabs in a 360px host · the row scrolls</span>
      <div class="narrow" data-testid="tabs-narrow">
        <Tabs
          label="Ship, narrow host"
          tabs={factTabs(fleet)}
          bind:value={narrow}
          panel={shipPanel}
        />
      </div>
      <span class="caption"
        >Stretched · name at the start, facts at the end</span
      >
      <div class="full" data-testid="tabs-stretch">
        <Tabs
          stretch
          label="Ship, stretched"
          tabs={factTabs(four)}
          bind:value={stretched}
          panel={shipPanel}
        />
      </div>
    </div>
  </section>

  <section>
    <h2>Contract</h2>
    <p>
      <code>Tabs</code>: <code>tabs</code> (each an <code>id</code>,
      <code>label</code>, optional <code>facts</code> and
      <code>unavailable</code>), bindable <code>value</code> (the selected id),
      <code>label</code>
      for the row, <code>activation</code>, <code>stretch</code>, and a
      <code>panel</code>
      snippet that receives the selected tab. The component renders the panel
      element and links it to its tab; the host supplies only its content.
    </p>
    <ul>
      <li>
        One tab is always selected. The component never changes
        <code>value</code>
        on its own, so a selected tab that becomes unavailable stays selected.
      </li>
      <li>
        The label is the tab's accessible name; the facts are its description.
      </li>
      <li>
        The panel is a tab stop, so keyboard users reach content that has no
        control of its own.
      </li>
    </ul>
  </section>
</section>

<style>
.compare {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
  align-items: stretch;
}
.compare .example {
  align-content: start;
}
.note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.switch-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-height: var(--control-min-height);
  font-size: var(--font-size-label);
}
.narrow {
  width: 360px;
}
.full {
  width: 100%;
}
.ship-panel {
  display: grid;
  gap: var(--spacing-sm);
}
.ship-panel h3 {
  font-size: var(--font-size-lead);
}
.ship-panel p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-label);
}
.ship-panel dl {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-lg);
  margin: 0;
}
.ship-panel dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.ship-panel dd {
  margin: 0;
}
table {
  margin-block: var(--spacing-md);
  border-collapse: collapse;
  font: var(--font-size-label) var(--font-family-ui);
}
th,
td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border-subtle);
  text-align: start;
  vertical-align: top;
}
th {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}
</style>
