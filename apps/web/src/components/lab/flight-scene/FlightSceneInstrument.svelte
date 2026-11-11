<script lang="ts">
import type { FlightLayerContexts } from "@void-drift/mode-a";
import { onMount, type Snippet, untrack } from "svelte";
import {
  type DeepReadonly,
  defaultTargets,
  FlightScene,
  type FlightSceneDocument,
  FlightSceneDocumentSchema,
  type FlightView,
  type PartTuning,
  readOnlyCopy,
  type StudyLight,
  type TargetMode,
} from "../../../lib/flight-scene";
import {
  type BurnId,
  SECONDS,
  TICK_RATE,
  TOTAL_TICKS,
} from "../../../lib/instrument";
import FlightLayers from "../../FlightLayers.svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import BurnRow from "../instrument/BurnRow.svelte";
import OverlayPane from "../instrument/OverlayPane.svelte";
import "@void-drift/core/styles/buttons.css";

// Flight scene instrument (study flight-scene-instrument-2026-11-10): one ship
// flying the Motion instrument's burns through the production simulation and
// the game's own layers. The scene is the whole 1440 × 900 screen; burn and
// time float over its lower edge, the view switch is top-left, the values menu
// top-right.
let {
  config,
  label = "Flight scene: a burn in the game’s layers",
  pane,
  light,
  targets,
  layers = { world: true, fx: true, lfx: true },
  tuning,
}: {
  /** The configuration document; parsed here, so it may come from anywhere. */
  config: unknown;
  label?: string;
  /**
   * The menu's content: the controls of the study or Lab page that mounts the
   * instrument. The instrument has none of its own; without a pane there is no
   * menu. It receives a read-only copy of the document.
   */
  pane?: Snippet<[DeepReadonly<FlightSceneDocument>]>;
  /**
   * A study's own light for some engines, painted in place of the game's plume
   * for them. Another light, or none, flies the burn again to the same instant.
   */
  light?: StudyLight;
  /** Which targets are staged; the document's default when absent. */
  targets?: TargetMode;
  /** Which layers are shown; hiding one keeps its history. */
  layers?: Record<"world" | "fx" | "lfx", boolean>;
  /**
   * Tuning of the delayed and pulsed engine parts for this flight; the game's
   * values when absent. Other values fly the burn again to the same instant.
   */
  tuning?: PartTuning;
} = $props();

// The document is read once; the designer's changes are view state. The engine
// keeps this parsed document; a pane is given a frozen copy of its own.
const parsed = untrack(() => FlightSceneDocumentSchema.safeParse(config));
const doc = parsed.success ? parsed.data : null;
const paneDoc = doc ? readOnlyCopy(doc) : null;
const issues = parsed.success ? [] : parsed.error.issues;

const SCREEN = { w: 1440, h: 900 };
// 16:10 at the game's 1080 height; the game varies its render width the same way.
const RENDER_WIDTH = 1728;

const VIEW_LABELS: Record<FlightView, string> = {
  game: "Game",
  follow: "Follow",
  "follow-far": `Follow ${doc?.follow.far ?? 4}×`,
};
const viewOptions = Object.values(VIEW_LABELS);

let burn = $state<BurnId>(doc?.opening.burn ?? "course");
let tick = $state(doc?.opening.tick ?? 0);
let playing = $state(false);
let view = $state<FlightView>(doc?.opening.view ?? "follow");
const staged = $derived<TargetMode>(
  targets ?? (doc ? defaultTargets(doc) : "none"),
);
let rendered = $state(false);
let drawnTick = $state(-1);
let drawnView = $state("");
let drawnBurn = $state("");
let lost = $state<{ seconds: number; cause?: string | null } | null>(null);
let hostW = $state(SCREEN.w);
let hostH = $state(SCREEN.h);
const scale = $derived(Math.min(hostW / SCREEN.w, hostH / SCREEN.h));
let canvases = $state<
  Partial<Record<"world" | "fx" | "lfx", HTMLCanvasElement>>
>({});

onMount(() => {
  const world = canvases.world?.getContext("2d");
  const fx = canvases.fx?.getContext("2d");
  const lfx = canvases.lfx?.getContext("2d");
  if (!doc || !world || !fx || !lfx) return;
  const scene = new FlightScene(
    { world, fx, lfx } satisfies FlightLayerContexts,
    doc,
    RENDER_WIDTH,
    untrack(() => staged),
    untrack(() => light),
    untrack(() => tuning),
  );
  // The constructor already flew the opening burn in the opening view and the
  // chosen targets, so the first frame only seeks.
  let drawn = {
    burn: burn as string,
    tick: -1,
    view: view as string,
    targets: untrack(() => staged) as string,
    light: untrack(() => light),
    tuning: untrack(() => JSON.stringify(tuning ?? {})),
  };
  let previous = performance.now(),
    accumulator = 0,
    raf = 0;
  function frame(now: number) {
    if (playing) {
      accumulator += Math.min((now - previous) / 1000, 0.1);
      const steps = Math.floor(accumulator * TICK_RATE);
      accumulator -= steps / TICK_RATE;
      tick = Math.min(TOTAL_TICKS, tick + steps);
      if (tick === TOTAL_TICKS) playing = false;
    } else accumulator = 0;
    previous = now;
    const shownLight = light;
    const tuned = JSON.stringify(tuning ?? {});
    const targets = staged;
    if (
      doc &&
      (drawn.burn !== burn ||
        drawn.tick !== tick ||
        drawn.view !== view ||
        drawn.targets !== targets ||
        drawn.light !== shownLight ||
        drawn.tuning !== tuned)
    ) {
      if (drawn.tuning !== tuned) scene.setTuning(tuning);
      if (drawn.light !== shownLight) scene.setLight(shownLight);
      if (drawn.targets !== targets) scene.configure(doc, targets);
      if (drawn.view !== view) scene.restart(burn, view);
      scene.seek(burn, tick, Infinity);
      rendered = true;
      drawnTick = tick;
      drawnView = view;
      drawnBurn = burn;
      drawn = { burn, tick, view, targets, light: shownLight, tuning: tuned };
      lost = scene.lost;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
});
</script>

{#if doc}
  <figure
    class="host"
    data-rendered={rendered}
    data-drawn-tick={drawnTick}
    data-drawn-view={drawnView}
    data-drawn-burn={drawnBurn}
    data-burn={burn}
    data-playing={playing}
    data-tick={tick}
    data-study-light={light ? "true" : undefined}
    bind:clientWidth={hostW}
    bind:clientHeight={hostH}
    aria-label={label}
  >
    <div
      class="screen"
      style={`width:${SCREEN.w}px;height:${SCREEN.h}px;transform:translate(-50%,-50%) scale(${scale})`}
    >
      <div class="slot scene">
        <FlightLayers
          bind:canvases
          label="The game’s layers at the current time"
          visibility={layers}
        />
        <div class="view">
          <Toggle
            compact
            label="View"
            options={viewOptions}
            bind:value={
              () => VIEW_LABELS[view],
              (v) => {
  view =
    (Object.keys(VIEW_LABELS) as FlightView[]).find(
      (id) => VIEW_LABELS[id] === v,
    ) ?? view;
}
            }
          />
        </div>
        {#if light}
          <p class="study-light">Study light: {light.label}</p>
        {/if}
        {#if lost}
          <p class="lost" role="status">
            Ship lost at {lost.seconds.toFixed(2)} s{lost.cause
              ? ` · ${lost.cause}`
              : ""}
          </p>
        {/if}
      </div>
      <div class="slot controls">
        <div class="burns"><BurnRow bind:burn {tick} /></div>
        <div class="time">
          <button
            type="button"
            class="btn"
            onclick={() => {
              if (!playing && tick === TOTAL_TICKS) tick = 0;
              playing = !playing;
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <div class="slider">
            <RingSlider
              compact
              label="Time"
              unit="s"
              digits={2}
              min={0}
              max={SECONDS}
              step={1 / TICK_RATE}
              bind:value={
                () => tick / TICK_RATE,
                (v) => {
  playing = false;
  tick = Math.round(v * TICK_RATE);
}
              }
            />
          </div>
          <span class="readout">{(tick / TICK_RATE).toFixed(2)} s</span>
        </div>
      </div>
    </div>

    {#if pane && paneDoc}
      <OverlayPane>
        <div class="value">{@render pane(paneDoc)}</div>
      </OverlayPane>
    {/if}
  </figure>
{:else}
  <figure class="host failed" aria-label={label}>
    <div class="issues" role="alert">
      <p>The flight scene document is not valid.</p>
      <ul>
        {#each issues as issue}
          <li>
            <code>{issue.path.join(".") || "(document)"}</code> {issue.message}
          </li>
        {/each}
      </ul>
    </div>
  </figure>
{/if}

<style>
.host {
  position: relative;
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-elev-1);
  color: var(--color-text);
  font-family: var(--font-family-ui);
}
.failed {
  display: grid;
  place-items: center;
}
.issues {
  max-width: 60ch;
  padding: var(--spacing-lg);
  color: var(--color-caution-tape);
  font-size: 13px;
}
.issues p {
  margin: 0 0 var(--spacing-sm);
}
.issues ul {
  margin: 0;
  padding-left: var(--spacing-lg);
}
.screen {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center;
}
.slot {
  position: absolute;
  box-sizing: border-box;
}
.slot :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
.slot :global(canvas) {
  width: 100%;
  height: 100%;
}
.view {
  position: absolute;
  left: 16px;
  top: 16px;
}
.study-light {
  position: absolute;
  right: 80px;
  top: 16px;
  margin: 0;
  padding: 8px 12px;
  background: rgb(0 0 0 / 65%);
  color: var(--color-text-muted);
  font-size: 13px;
}
.lost {
  position: absolute;
  left: 32px;
  bottom: 124px;
  margin: 0;
  color: var(--color-caution-tape);
  font-size: 13px;
}
.scene {
  inset: 0;
}
/* Floats over the scene's lower edge. */
.controls {
  left: 32px;
  right: 32px;
  bottom: 32px;
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 12px 16px;
  background: rgb(0 0 0 / 65%);
}
.burns,
.time {
  flex: 1;
  min-width: 0;
}
.time {
  display: flex;
  align-items: center;
  gap: 24px;
}
.slider {
  flex: 1;
}
.readout {
  width: 56px;
  text-align: right;
  color: var(--color-text-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.value {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}
.value :global(p) {
  margin: 0;
}
.value > :global(*) {
  min-width: 0;
}
</style>
