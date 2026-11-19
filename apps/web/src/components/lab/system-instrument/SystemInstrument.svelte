<script lang="ts">
import type { FlightLayerId } from "@void-drift/mode-a";
import { onMount } from "svelte";
import { systemBackground } from "../../../lib/game-field";
import {
  DEFAULT_SYSTEM_SEED,
  randomSystemSeed,
  SystemInstrumentDocumentSchema,
} from "../../../lib/system-instrument/config";
import { SystemInstrumentScene } from "../../../lib/system-instrument/scene";
import GameField from "../../GameField.svelte";

let _props: { "client:load"?: boolean } = $props();
const id = $props.id();
let draft = $state<number | undefined>(DEFAULT_SYSTEM_SEED);
let activeSeed = $state(DEFAULT_SYSTEM_SEED);
let error = $state("");
let status = $state("Loading planet materials…");
let ready = $state(false);
let stage: HTMLDivElement;
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let scene: SystemInstrumentScene | undefined;
let skyX = $state(960),
  skyY = $state(540),
  skyWidth = $state(1920);
function syncSky() {
  if (!scene) return;
  const centre = scene.camera.getViewCentre();
  skyX = centre.x;
  skyY = centre.y;
}

function generate() {
  const parsed = SystemInstrumentDocumentSchema.safeParse({ seed: draft });
  if (!parsed.success) {
    error = "Enter a whole-number seed from 1 to 2147483647.";
    return;
  }
  try {
    scene?.generate(parsed.data);
    activeSeed = parsed.data.seed;
    syncSky();
    error = "";
  } catch {
    error = "Could not generate this system. The previous system is retained.";
  }
}
function randomize() {
  draft = randomSystemSeed(activeSeed, draft);
  generate();
}
onMount(() => {
  const world = canvases.world?.getContext("2d");
  const fx = canvases.fx?.getContext("2d");
  const lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) {
    error = "System preview requires Canvas 2D.";
    return;
  }
  try {
    scene = new SystemInstrumentScene({ world, fx, lfx }, activeSeed, () => {
      status = scene?.status ?? "";
    });
  } catch {
    error = "Could not generate the opening system.";
    return;
  }
  const resize = () => {
    const bounds = stage.getBoundingClientRect();
    scene?.resize(bounds.width, bounds.height);
    skyWidth = (bounds.width / bounds.height) * 1080;
    syncSky();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  let disposed = false;
  void document.fonts.ready.then(() => {
    if (!disposed) scene?.draw();
  });
  ready = true;
  return () => {
    disposed = true;
    observer.disconnect();
    scene?.dispose();
    scene = undefined;
  };
});
</script>

<div class="system-instrument">
  <form
    class="controls"
    novalidate
    onsubmit={(event) => {
      event.preventDefault();
      generate();
    }}
  >
    <label for={`${id}-seed`}>Seed</label>
    <input
      id={`${id}-seed`}
      type="number"
      min="1"
      max="2147483647"
      step="1"
      bind:value={draft}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
    >
    <button class="btn btn-normal" type="submit" disabled={!ready}>
      Generate
    </button>
    <button
      class="btn btn-normal"
      type="button"
      onclick={randomize}
      disabled={!ready}
    >
      Randomize
    </button>
    <output aria-live="polite">Seed {activeSeed} · tick 0</output>
  </form>
  <div class="stage" bind:this={stage}>
    {#if error}
      <p id={`${id}-error`} class="message" role="alert">{error}</p>
    {/if}
    <GameField
      bind:canvases
      background={systemBackground(activeSeed)}
      cameraX={skyX}
      cameraY={skyY}
      width={skyWidth}
      label={`Generated solar system, seed ${activeSeed}`}
    />
    {#if status}
      <p class="status" role="status">{status}</p>
    {/if}
  </div>
</div>

<style>
.system-instrument {
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
}
.controls {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  right: var(--spacing-md);
  z-index: var(--layer-hud);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
label,
output {
  font-family: var(--font-family-ui);
  font-size: var(--font-size-label);
}
input {
  width: 15ch;
  min-height: var(--button-min-height);
  padding: var(--spacing-sm);
  font: inherit;
  color: var(--color-text);
  background: var(--color-void);
  border: 1px solid var(--color-border);
}
input:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
output {
  margin-left: auto;
  color: var(--color-text-muted);
}
.stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.stage :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
.message,
.status {
  margin: 0;
  padding: var(--spacing-md);
  color: var(--color-text);
  background: var(--color-elev-1);
}
.message {
  position: absolute;
  top: calc(2 * var(--spacing-md) + var(--button-min-height));
  left: var(--spacing-md);
  z-index: var(--layer-hud);
}
.status {
  position: absolute;
  left: var(--spacing-md);
  bottom: var(--spacing-md);
}
</style>
