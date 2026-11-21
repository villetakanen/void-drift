<script lang="ts">
import { SkySeedSchema } from "@void-drift/core";
import { type SkySightline, SOL_SKY, systemSky } from "@void-drift/mode-a";
import { prepare } from "../../../lib/assets/flight-sky/prepare";
import RingSlider from "../../inputs/RingSlider.svelte";
import SkyView from "./SkyView.svelte";

let _props: { "client:load"?: boolean } = $props();
const samples = [0, 0.25, 0.5, 0.75, 1];
const names = [
  "Narrows",
  "Narrow reach",
  "Practice breadth",
  "Wide reach",
  "Broad reach",
];
let reach = $state(SOL_SKY.reach),
  dust = $state(SOL_SKY.dustSeed),
  heading = $state(SOL_SKY.heading);
let scale = $state(100),
  travel = $state(0),
  offsetX = $state(SOL_SKY.offsetX),
  offsetY = $state(SOL_SKY.offsetY);
let systemInput = $state<number | undefined>(2026),
  dustInput = $state<number | undefined>(SOL_SKY.dustSeed);
let origin = $state("Sol"),
  systemError = $state(""),
  dustError = $state("");
let url = $state(""),
  strip = $state<string[]>([]),
  status = $state("Preparing sky…"),
  stripError = $state("");
const id = $props.id();

function setSightline(sky: SkySightline, name: string) {
  reach = sky.reach;
  dust = sky.dustSeed;
  dustInput = dust;
  heading = sky.heading;
  scale = 100 * sky.scale;
  offsetX = sky.offsetX;
  offsetY = sky.offsetY;
  travel = 0;
  origin = name;
  systemError = "";
  dustError = "";
}
function loadSystem() {
  const result = SkySeedSchema.safeParse(systemInput);
  if (!result.success) {
    systemError = "Use a whole number from 1 to 2147483647.";
    return;
  }
  setSightline(systemSky(result.data), `System ${result.data}`);
}
function applyDust() {
  const result = SkySeedSchema.safeParse(dustInput);
  if (!result.success) {
    dustError = "Use a whole number from 1 to 2147483647.";
    return;
  }
  dust = result.data;
  dustError = "";
}
$effect(() => {
  const request = { dustSeed: dust, reaches: [reach], size: 1536 as const };
  url = "";
  status = "Preparing sky…";
  return prepare(
    request,
    (urls) => {
      url = urls[0];
      status = "";
    },
    (message) => {
      url = "";
      status = message;
    },
    60,
  );
});
$effect(() => {
  const request = { dustSeed: dust, reaches: samples, size: 384 as const };
  stripError = "";
  strip = [];
  return prepare(
    request,
    (urls) => {
      strip = urls;
    },
    (message) => {
      stripError = message;
    },
    60,
  );
});
</script>

<div class="instrument">
  <section class="main" aria-label="Sky preview">
    <header>
      <h2>Distant sky</h2>
      <span>Base sightline · {origin}</span>
    </header>
    <div class="sky">
      <SkyView
        {url}
        {heading}
        scale={scale / 100}
        {offsetX}
        {offsetY}
        {travel}
        label="Prepared Milky Way sky"
      />
      {#if status}
        <p class="status" role="status">{status}</p>
      {/if}
    </div>
    <section class="spectrum" aria-label="Reach comparison">
      <header>
        <h3>Reach comparison</h3>
        <span>Dust {dust} · fixed framing</span>
      </header>
      <div class="samples">
        {#each samples as value, i}
          <button
            type="button"
            aria-label={`Inspect ${names[i]} at ${value}`}
            aria-pressed={reach === value}
            onclick={() => (reach = value)}
          >
            <div class="thumbnail">
              <SkyView url={strip[i] ?? ""} label={names[i]} />
            </div>
            <span>{names[i]}</span><small>{value.toFixed(2)}</small>
          </button>
        {/each}
      </div>
      {#if stripError}
        <p role="alert">{stripError}</p>
      {/if}
    </section>
  </section>
  <aside aria-label="Sky controls">
    <h2>Sightline</h2>
    <form
      novalidate
      onsubmit={(event) => {
        event.preventDefault();
        loadSystem();
      }}
    >
      <label for={`${id}-system`}>System seed</label>
      <div class="row">
        <input
          id={`${id}-system`}
          type="number"
          min="1"
          max="2147483647"
          step="1"
          bind:value={systemInput}
          aria-invalid={!!systemError}
        ><button class="btn btn-normal" type="submit">Load</button>
      </div>
      {#if systemError}
        <p role="alert">{systemError}</p>
      {/if}
    </form>
    <button
      type="button"
      class="btn btn-normal"
      onclick={() => setSightline(SOL_SKY, "Sol")}
    >
      Restore Sol
    </button>
    <section>
      <h3>Galactic form</h3>
      <RingSlider
        label="Reach"
        min={0}
        max={1}
        step={0.001}
        digits={3}
        bind:value={reach}
      />
      <form
        novalidate
        onsubmit={(event) => {
          event.preventDefault();
          applyDust();
        }}
      >
        <label for={`${id}-dust`}>Dust seed</label>
        <div class="row">
          <input
            id={`${id}-dust`}
            type="number"
            min="1"
            max="2147483647"
            step="1"
            bind:value={dustInput}
            aria-invalid={!!dustError}
          ><button class="btn btn-normal" type="submit">Apply</button>
        </div>
        {#if dustError}
          <p role="alert">{dustError}</p>
        {/if}
      </form>
    </section>
    <section>
      <h3>View</h3>
      <RingSlider
        label="Heading"
        min={0}
        max={360}
        step={1}
        unit="°"
        bind:value={heading}
      />
      <RingSlider
        label="Pattern scale"
        min={80}
        max={120}
        step={1}
        unit="%"
        bind:value={scale}
      />
      <RingSlider
        label="Camera travel"
        min={-500}
        max={500}
        step={10}
        unit="u"
        bind:value={travel}
      />
    </section>
  </aside>
</div>
<style>
.instrument {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  min-height: 100%;
  flex: 1;
}
.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-md);
}
.main > header,
.spectrum,
aside {
  padding: var(--spacing-lg);
}
h2,
h3,
p {
  margin: 0;
}
h2 {
  font-size: var(--font-size-lead);
}
h3 {
  font-size: var(--font-size-label);
}
header span,
label,
small {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.sky {
  min-height: 290px;
  flex: 1;
  position: relative;
}
.sky > :global(.viewport) {
  position: absolute;
  inset: 0;
}
.status {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-md);
  font-size: var(--font-size-label);
}
.spectrum {
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: var(--spacing-md);
}
.samples {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-sm);
}
.samples button {
  min-width: 0;
  text-align: left;
  display: grid;
  gap: var(--spacing-xs);
  background: var(--color-elev-1);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: var(--spacing-xs);
  font: inherit;
  cursor: pointer;
}
.samples button[aria-pressed="true"] {
  border-color: var(--color-selected);
}
.samples span {
  font-size: var(--font-size-caption);
}
.thumbnail {
  height: 58px;
}
aside {
  padding-inline: var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-md);
  background: var(--color-elev-1);
  border-left: 1px solid var(--color-border);
}
aside section {
  display: grid;
  gap: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-lg);
}
form {
  display: grid;
  gap: var(--spacing-xs);
}
.row :global(.btn) {
  min-width: 0;
  padding-inline: var(--spacing-md);
}
.row {
  display: flex;
  gap: var(--spacing-sm);
}
input {
  min-width: 0;
  width: 100%;
  padding: var(--spacing-sm);
  background: var(--color-void);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font: inherit;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
[role="alert"] {
  font-size: var(--font-size-label);
}
</style>
