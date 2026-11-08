<script lang="ts">
import { onMount } from "svelte";
import Dialog from "../Dialog.svelte";
import "./catalog.css";

// Reference for the surface foundations (core tokens.css and surfaces.css):
// elevation, corner cuts, panels, layers, the scrim and dialog behaviour.
let { label = "Surfaces design system" }: { label?: string } = $props();

const steps = [
  { token: "--color-elev-1", value: "lch(5.5% 10 290)", use: "Console" },
  { token: "--color-elev-2", value: "lch(11% 15 290)", use: "Display" },
  { token: "--color-elev-3", value: "lch(16.5% 20 290)", use: "Overlay pane" },
];
const cuts = [
  { token: "--cut-size-sm", use: "Small controls" },
  { token: "--cut-size-md", use: "Buttons, toggle, engine pads" },
  { token: "--cut-size-lg", use: "Panels" },
];
const layers = [
  { token: "--layer-toast", use: "Status messages over everything" },
  { token: "--layer-overlay", use: "Dialogs and their scrim" },
  { token: "--layer-hud", use: "HUD and engine pads" },
  { token: "--layer-raised", use: "Sticky footers; a pane over its backdrop" },
  { token: "--layer-base", use: "The stage and page content" },
  { token: "--layer-under", use: "Behind content inside an isolated part" },
];

// Values come from the loaded production CSS, not from this file.
let values = $state<Record<string, string>>({});
onMount(() => {
  const root = getComputedStyle(document.documentElement);
  for (const t of [...cuts, ...layers])
    values[t.token] = root.getPropertyValue(t.token).trim();
});

let open = $state(false);
let closable = $state(true);
</script>

<section class="catalog" aria-label={label}>
  <section>
    <h2>Elevation</h2>
    <p>
      Three steps above the background (<code>--color-void</code>, lch 1.6% 4.9
      290). Each keeps the background's hue, 290, and raises lightness by 5.5
      and chroma by 5, so raised surfaces stay blue-violet rather than greying.
      <a href="/lab/studies/lab-instrument-2026-11-01#look">Study →</a>
    </p>
    <div class="steps">
      {#each steps as s, i}
        <div class="step" style={`background: var(${s.token}); --_i:${i}`}>
          <strong>{s.use}</strong>
          <code>{s.token}</code>
          <span>{s.value}</span>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Corner cuts</h2>
    <p>
      One corner language: every surface and control cuts its top-left and
      bottom-right corners, as buttons do. Text fields keep
      <code>--radius-sm</code>; nothing else is rounded.
    </p>
    <div class="example cuts">
      {#each cuts as c}
        <div class="cut-sample">
          <div class="cut-surface" style={`--_cut: var(${c.token})`}></div>
          <p class="caption">
            <code>{c.token}</code>
            {values[c.token] ?? ""}
            · {c.use}
          </p>
        </div>
      {/each}
      <div class="cut-sample">
        <button type="button" class="btn btn-ghost">Button</button>
        <p class="caption"><code>.btn</code> · md</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Panels</h2>
    <p>
      Elevation 2 on the console form: a 1px <code>--color-border</code> edge
      that follows the cut, and the display's drop shadow outside the shape.
      <code>.panel--flat</code>
      drops the shadow, for a surface on the live game such as a status message.
    </p>
    <div class="feed panels">
      <div class="star" aria-hidden="true"></div>
      <div class="panel">
        <p class="eyebrow">.panel</p>
        <p>Dialogs over the stage.</p>
        <p class="muted">Muted text on the shade.</p>
      </div>
      <div class="panel panel--flat">
        <p class="eyebrow">.panel--flat</p>
        <p>Status messages.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Layers</h2>
    <p>
      The only <code>z-index</code> values in shared UI. Gaps between steps
      leave room for a later layer; a part that needs its own order inside (a
      button's fill behind its label) isolates itself and uses
      <code>--layer-under</code>.
    </p>
    <table class="layers">
      <thead>
        <tr>
          <th>Token</th>
          <th>Value</th>
          <th>Use</th>
        </tr>
      </thead>
      <tbody>
        {#each layers as l}
          <tr>
            <td><code>{l.token}</code></td>
            <td>{values[l.token] ?? ""}</td>
            <td>{l.use}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section>
    <h2>Dialogs and the scrim</h2>
    <p>
      A live dialog using the game's <code>Dialog</code> component. Opening it
      makes the stage inert and shades it as an offline feed (a 27% pull toward
      the elevation hue, a little dimmed and blurred, with the display's
      scanlines and darkened edge); the HUD and engine pads hide. Focus moves to
      the dialog's first control and returns to the opener on close. Try it from
      the keyboard: Tab never reaches the stage while the dialog is open.
      <a href="/">Title screen →</a>
    </p>
    <label class="caption closable">
      <input type="checkbox" bind:checked={closable}>
      Escape closes it (as pause does; run complete does not)
    </label>
    <div class="feed demo-host">
      <div class="demo-stage" data-stage>
        <div class="star" aria-hidden="true"></div>
        <p class="demo-hud" data-hud>HULL 100% · POWER 100%</p>
        <div class="demo-pads" data-hud>
          <button type="button" class="pad cut-surface">◀ Left</button>
          <button
            type="button"
            class="btn btn-link"
            onclick={() => (open = true)}
          >
            Open dialog
          </button>
          <button type="button" class="pad cut-surface">Right ▶</button>
        </div>
      </div>
      {#if open}
        <Dialog
          label="Demo dialog"
          onclose={closable ? () => (open = false) : undefined}
        >
          <p class="eyebrow">DEMO</p>
          <p>The stage behind is an offline feed.</p>
          <div class="button-group button-group--vertical">
            <button
              type="button"
              class="btn btn-filled"
              data-autofocus
              onclick={() => (open = false)}
            >
              Close
            </button>
            <button type="button" class="btn btn-ghost">Another control</button>
          </div>
        </Dialog>
      {/if}
    </div>
  </section>

  <section>
    <h2>Instrument display</h2>
    <p>
      A display set into the console: elevation 2 with faint scanlines on the
      4px rhythm, a darkened edge, a thin dark bezel, and a black shadow beneath
      it (8px down, 24px blur, 70%).
    </p>
    <div class="example">
      <div class="display"></div>
      <p class="caption">
        <code>background: var(--surface-display)</code>
        ·
        <code>box-shadow: var(--shadow-display)</code>
      </p>
    </div>
  </section>

  <section>
    <h2>Backdrop</h2>
    <p>
      Dims what a Lab overlay pane covers: black at 11%, over everything outside
      the pane. Game dialogs use the scrim above instead.
    </p>
    <div class="example backdrop-demo">
      <div class="display small"></div>
      <div class="dim"></div>
      <p class="caption over">Right half: <code>--color-backdrop</code></p>
    </div>
  </section>
</section>

<style>
.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  background: var(--color-void);
  padding: var(--spacing-lg);
  gap: var(--spacing-lg);
}
.step {
  display: grid;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  min-height: 8rem;
  align-content: end;
  font-family: var(--font-family-ui);
}
.step span {
  color: var(--color-text-muted);
}
.cuts {
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  justify-items: stretch;
  align-items: end;
}
.cut-sample {
  display: grid;
  gap: var(--spacing-sm);
  justify-items: start;
}
.cut-sample .cut-surface {
  width: 148px;
  height: 64px;
}
/* A sample of the game behind a panel: the void with a star in it. */
.feed {
  position: relative;
  overflow: hidden;
  background: var(--color-void);
  font-family: var(--font-family-ui);
}
.star {
  position: absolute;
  width: 160px;
  aspect-ratio: 1;
  left: 40%;
  top: 50%;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--color-caution-tape) 0 40%,
    color-mix(in lch, var(--color-caution-tape) 30%, transparent) 55%,
    transparent 70%
  );
}
.panels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl) var(--spacing-lg);
}
.panels .panel {
  width: 16rem;
}
.panel p {
  margin: 0 0 var(--spacing-sm);
}
.eyebrow {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-eyebrow);
}
.muted {
  color: var(--color-text-muted);
}
.layers {
  border-collapse: collapse;
  font-family: var(--font-family-ui);
}
.layers th,
.layers td {
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}
.closable {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.demo-host {
  height: 22rem;
}
.demo-stage {
  position: absolute;
  inset: 0;
  background: var(--color-void);
}
.demo-hud {
  position: absolute;
  z-index: var(--layer-hud);
  inset: var(--spacing-md) var(--spacing-md) auto;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.demo-pads {
  position: absolute;
  z-index: var(--layer-hud);
  inset: auto var(--spacing-md) var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: end;
}
.pad {
  min-width: 120px;
  min-height: var(--control-min-height);
  border: 0;
  background: none;
  color: var(--color-text-muted);
  font: inherit;
}
.pad:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
.display {
  width: 448px;
  height: 256px;
  max-width: 100%;
  background: var(--surface-display);
  box-shadow: var(--shadow-display);
}
.display.small {
  width: 320px;
  height: 160px;
}
.backdrop-demo {
  position: relative;
  overflow: hidden;
}
.dim {
  position: absolute;
  inset: 0 0 0 50%;
  background: var(--color-backdrop);
}
.over {
  position: relative;
}
</style>
