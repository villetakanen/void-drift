<script lang="ts">
import "./catalog.css";
import { CHASSIS, SHIP_IDENTITY } from "@void-drift/mode-a";

const ships = ["wasp", "scout", "fighter", "corvette"] as const;
let detailed = $state("Fighter");

import RingSlider from "../inputs/RingSlider.svelte";
import Switch from "../inputs/Switch.svelte";
import Toggle from "../inputs/Toggle.svelte";
import LabThrustPads from "./LabThrustPads.svelte";

// Shared control references: multi-option Toggle, binary Switch and RingSlider.
let { label = "Input design system" }: { label?: string } = $props();

let two = $state("Fit all");
let three = $state("B1");
let stretched = $state("B2");
let stabilizers = $state(true);
let linkedEngines = $state(false);
let forcedOn = $state(true);
let time = $state(7);
let thrust = $state(38000);
</script>

<section class="catalog" aria-label={label}>
  <section>
    <h2>Toggle</h2>
    <p>
      One button-shaped control split into equal parts, one per option. The
      outer edge has the buttons' cut corners; the split inside is straight. The
      selected part is filled lime; the others are a faint fill that takes a
      faint lime tint under a pointer. Arrow keys move the selection.
      <a href="/lab/studies/lab-instrument-2026-11-01#toggle">Study →</a>
    </p>
    <div class="example">
      <span class="caption">Detailed selector · full width</span>
      <div style="width:100%">
        <Toggle
          stretch
          label="Ship, detailed"
          options={ships.map((id) => SHIP_IDENTITY[id].shortName)}
          details={Object.fromEntries(
            ships.map((id) => [
              SHIP_IDENTITY[id].shortName,
              `${(id === "wasp" ? 1 : 2) + CHASSIS[id].hull + CHASSIS[id].aft} slots · ${CHASSIS[id].mass} mass`,
            ]),
          )}
          bind:value={detailed}
        />
      </div>
      <span class="caption">Two options</span>
      <Toggle
        label="Path scale"
        options={["Fit all", "Default scale"]}
        bind:value={two}
      />
      <span class="caption">Three options, compact, beside a diagram</span>
      <Toggle
        compact
        label="Burn"
        options={["B1", "B2", "B3"]}
        bind:value={three}
      />
      <span class="caption">Stretched to its container</span>
      <div style="width: 100%; max-width: 480px">
        <Toggle
          stretch
          label="Burn, stretched"
          options={["B1", "B2", "B3"]}
          bind:value={stretched}
        />
      </div>
    </div>
    <p>
      <code>Toggle</code>: <code>options</code>, bindable <code>value</code>,
      <code>label</code>
      for the group, <code>compact</code> for 8px side padding,
      <code>stretch</code>
      to fill the width. Optional <code>details</code> maps option names to
      supporting facts, arranged in wrapping inline flex segments.
    </p>
  </section>

  <section>
    <h2>Switch</h2>
    <p>
      A square marker slides between labeled states for an independent on/off
      setting. The control keeps a 44px hit area around its shorter track. It
      uses a native checkbox for keyboard behavior.
    </p>
    <div class="example switch-examples">
      <label class="switch-example" for="lab-stabilizers">
        <span class="switch-example__copy">
          <span class="switch-example__name">Ion stabilizers</span>
          <span class="switch-example__help">Assist turns and brake spin.</span>
        </span>
        <Switch id="lab-stabilizers" bind:checked={stabilizers} />
      </label>
      <label class="switch-example" for="lab-linkedEngines">
        <span class="switch-example__copy">
          <span class="switch-example__name">Linked engines</span>
          <span class="switch-example__help"
            >One input fires the aft engines.</span
          >
        </span>
        <Switch id="lab-linkedEngines" bind:checked={linkedEngines} />
      </label>
      <label class="switch-example" for="lab-forcedOn">
        <span class="switch-example__copy">
          <span class="switch-example__name">Forced on</span>
          <span class="switch-example__help"
            >Disabled, with its saved state visible.</span
          >
        </span>
        <Switch id="lab-forcedOn" bind:checked={forcedOn} disabled />
      </label>
    </div>
    <p>
      <code>Switch</code>
      exposes a bindable boolean and optional
      <code>disabled</code>
      state. The adjacent setting name labels the checkbox; ON/OFF stays visible
      in the sliding square.
    </p>
  </section>

  <section>
    <h2>Ring slider</h2>
    <p>
      A faint 2px track, lime up to the value, and a lime ring knob; the label
      and value stay neutral. Under a pointer the unfilled track takes the same
      faint lime tint. The native range input stays on top, so keys, touch and
      forms behave as usual, at a 44px touch height.
      <a href="/lab/studies/lab-instrument-2026-11-01#slider">Study →</a>
    </p>
    <div class="example" style="justify-items: stretch">
      <RingSlider
        label="Time"
        unit="s"
        digits={2}
        min={0}
        max={14}
        step={1 / 60}
        bind:value={time}
      />
      <RingSlider
        label="Plasma thrust"
        unit="force"
        min={20000}
        max={60000}
        step={500}
        bind:value={thrust}
      />
    </div>
    <p>
      <code>RingSlider</code>: <code>min</code>, <code>max</code>,
      <code>step</code>, bindable <code>value</code>, <code>label</code>,
      <code>unit</code>, <code>digits</code>; <code>compact</code> hides the
      label line where the host shows it.
    </p>
  </section>

  <LabThrustPads />
</section>

<style>
.switch-examples {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
  align-items: start;
}

.switch-example {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  min-height: var(--control-min-height);
  padding: var(--spacing-sm);
  background: var(--color-void);
}

.switch-example__copy {
  display: grid;
  gap: var(--spacing-xs);
}

.switch-example__name {
  color: var(--color-text);
  font-size: var(--font-size-label);
}

.switch-example__help {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
</style>
