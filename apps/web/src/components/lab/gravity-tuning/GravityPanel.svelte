<script lang="ts">
import EnergyPanel from "../instrument/EnergyPanel.svelte";
import "@void-drift/core/styles/buttons.css";
import {
  MASS_WELL_G,
  MASS_WELL_G_2D,
  massWellPull,
  massWellReach,
} from "@void-drift/core";
import {
  DEFAULT_DOCUMENT,
  editGravityTuning,
  GravityTuningConfig,
  SETTINGS,
  type SettingKey,
  setSetting,
  settingValue,
} from "../../../lib/gravity-tuning";
import Toggle from "../../inputs/Toggle.svelte";

// Gravity tuning's pane (docs/specs/gravity-tuning.md, "Views"): the
// settings as value rows like the instrument's, the default shown once a value
// changes, then the document to copy back or to load. A refused value keeps the
// previous one and says why.
let {
  config = $bindable(),
  ships = [],
}: {
  config: GravityTuningConfig;
  /** Each ship's thrust, for the surface pull as a multiple of it. */
  ships?: { label: string; color: string; thrust: number }[];
} = $props();

let error = $state("");
let copied = $state(false);
let draft = $state("");
let loadError = $state("");
const text = $derived(JSON.stringify($state.snapshot(config), null, 2));
const reach = $derived(
  massWellReach(config.well.strength, config.well.cutoff, config.well.falloff),
);
const surfacePull = $derived(
  massWellPull(config.well.radius, config.well.strength, config.well.falloff),
);

function set(key: SettingKey, raw: string) {
  const value = raw === "" ? settingValue(DEFAULT_DOCUMENT, key) : Number(raw);
  const result = editGravityTuning($state.snapshot(config), (d) =>
    setSetting(d, key, value),
  );
  if (result.ok) {
    config = result.doc;
    error = "";
  } else error = result.message;
  return result.ok;
}
async function copy() {
  await navigator.clipboard.writeText(text);
  copied = true;
  setTimeout(() => (copied = false), 1500);
}
function load() {
  try {
    const parsed = GravityTuningConfig.safeParse(JSON.parse(draft));
    if (!parsed.success) {
      loadError = parsed.error.issues
        .map((i) => `${i.path.join(".") || "document"}: ${i.message}`)
        .join("; ");
      return;
    }
    config = parsed.data;
    loadError = "";
    draft = "";
  } catch {
    loadError = "Not valid JSON.";
  }
}
</script>
<EnergyPanel bind:energy={config.energy} />

<section aria-labelledby="gravity-settings">
  <h4 id="gravity-settings">Settings</h4>
  {#each SETTINGS as setting}
    {@const value = settingValue(config, setting.key)}
    {@const base = settingValue(DEFAULT_DOCUMENT, setting.key)}
    {@const id = `gt-${setting.key.replace(".", "-")}`}
    <div class="param" class:changed={value !== base}>
      <label for={id}>{setting.label}</label>
      <input
        {id}
        type="number"
        step="any"
        {value}
        onchange={(e) => {
          const field = e.currentTarget;
          if (!set(setting.key, field.value)) field.value = String(value);
        }}
      >
      {#if value !== base}
        <button
          type="button"
          class="reset"
          aria-label={`Reset ${setting.label} to ${base}`}
          onclick={() => set(setting.key, "")}
        >
          ↺
        </button>
      {/if}
      <span class="unit">
        {setting.unit}{value !== base ? ` · default ${base}` : ""}
      </span>
    </div>
  {/each}
  <div
    class="param"
    class:changed={config.well.falloff !== DEFAULT_DOCUMENT.well.falloff}
  >
    <Toggle
      compact
      label="Falloff"
      options={["inverse-square", "inverse"]}
      bind:value={
        () => config.well.falloff,
        (v) => {
  const result = editGravityTuning($state.snapshot(config), (d) => {
    d.well.falloff = v as typeof d.well.falloff;
  });
  if (result.ok) {
    config = result.doc;
    error = "";
  } else error = result.message;
}
      }
    />
    <span class="unit">
      falloff: 1/d² (G = {MASS_WELL_G}) or flat-world 1/d (G =
      {MASS_WELL_G_2D}); equal at {MASS_WELL_G / MASS_WELL_G_2D} u
    </span>
  </div>
  <p class="unit">
    Reach {Math.round(reach)} u (where the pull falls to the cut-off) · surface
    pull {Math.round(surfacePull)} u/s² at the body's radius
  </p>
  {#if ships.length}
    <ul class="ratios" aria-label="Surface pull against each ship's thrust">
      {#each ships as ship}
        <li>
          <i style={`background:${ship.color}`}></i>{ship.label}
          <b>{(surfacePull / ship.thrust).toFixed(2)}× thrust</b>
        </li>
      {/each}
    </ul>
  {/if}
  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</section>

<section aria-labelledby="gravity-document">
  <h4 id="gravity-document">Document</h4>
  <button type="button" class="btn btn-ghost" onclick={copy}>
    {copied ? "Copied" : "Copy JSON"}
  </button>
  <pre>{text}</pre>
  <details>
    <summary>Load a document</summary>
    <textarea
      bind:value={draft}
      rows="6"
      aria-label="Gravity tuning document to load"
      placeholder="Paste JSON from the agent"
    ></textarea>
    <button
      type="button"
      class="btn btn-ghost"
      onclick={load}
      disabled={!draft.trim()}
    >
      Load
    </button>
    {#if loadError}
      <p class="error" role="alert">{loadError}</p>
    {/if}
  </details>
</section>

<style>
/* The instrument pane's value rows (DocumentPanel), for the bench's settings. */
section {
  margin-top: var(--spacing-md);
}
h4 {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: normal;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.param {
  display: grid;
  grid-template-columns: 1fr 7rem 2.5rem;
  align-items: center;
  gap: 2px var(--spacing-sm);
  padding: 2px 0 2px var(--spacing-sm);
  border-left: 3px solid transparent;
}
.param.changed {
  border-left-color: var(--color-selected);
}
.param input {
  min-height: 36px;
  width: 100%;
  box-sizing: border-box;
  padding: 2px 6px;
  background: var(--color-void);
  color: var(--color-text);
  border: 1px solid var(--color-text-muted);
  font: inherit;
  text-align: right;
}
.param.changed input {
  border-color: var(--color-selected);
}
.reset {
  min-height: 36px;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text-muted);
  cursor: pointer;
}
.unit {
  grid-column: 1 / -1;
  color: var(--color-text-muted);
  font-size: 13px;
}
pre {
  max-height: 16rem;
  overflow: auto;
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-sm);
  background: var(--color-void);
  border: 1px solid var(--color-border-subtle);
  font-size: 12px;
  user-select: text;
}
textarea {
  width: 100%;
  box-sizing: border-box;
  margin: var(--spacing-sm) 0;
  background: var(--color-void);
  color: var(--color-text);
  border: 1px solid var(--color-text-muted);
  font: 12px var(--font-family-ui);
}
summary {
  cursor: pointer;
  color: var(--color-text-muted);
}
.ratios {
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-muted);
  font-size: 13px;
}
.ratios li {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.ratios i {
  display: inline-block;
  width: 16px;
  height: 3px;
}
.ratios b {
  margin-left: auto;
  color: var(--color-text);
  font-weight: normal;
}
.error {
  color: var(--color-caution-tape);
  font-size: 13px;
}
input:focus-visible,
textarea:focus-visible,
summary:focus-visible,
.reset:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
</style>
