<script lang="ts">
import { type FlightLayerContexts, LoadoutSchema } from "@void-drift/mode-a";
import { onMount } from "svelte";
import {
  type BurnId,
  SECONDS,
  TICK_RATE,
  TOTAL_TICKS,
} from "../../lib/instrument";
import RingSlider from "../inputs/RingSlider.svelte";
import Toggle from "../inputs/Toggle.svelte";
import BurnRow from "../lab/instrument/BurnRow.svelte";
import { FlightScene, type FlightSceneView } from "./flight-scene";
import StudyFlightLayers from "./StudyFlightLayers.svelte";
import { studyStarterWasp } from "./starter-wasp-fixture";
import "@void-drift/core/styles/buttons.css";

// Flight scene study, 02.2: the 02.1 screen with the accepted time model (a
// jump flies the burn again and paints the whole flight's light) and the three
// accepted ways of looking at the scene, switched on the scene itself.
let {
  label = "Flight scene: a burn in the game’s layers",
}: { label?: string } = $props();

const VIEWS: Record<string, FlightSceneView> = {
  Game: { follow: null },
  Follow: { follow: 1.6 },
  "Follow 4×": { follow: 4 },
};

const SCREEN = { w: 1440, h: 900 };
const PAD = 32;
const GAP = 32;
const COL = (SCREEN.w - 2 * PAD - GAP) / 2;
const SCENE = { w: SCREEN.w - 2 * PAD, h: ((SCREEN.w - 2 * PAD) * 9) / 16 };
const CONTROL = 44;
const CONTROL_GAP = 24;
const TOP =
  Math.floor((SCREEN.h - SCENE.h - CONTROL_GAP - CONTROL) / 2 / 4) * 4;

let burn = $state<BurnId>("course");
let tick = $state(3 * TICK_RATE);
let playing = $state(false);
let view = $state("Game");
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

const build = studyStarterWasp();
build.hull[0] = "light-ion-cannon";
const loadout = LoadoutSchema.parse(build);

onMount(() => {
  const world = canvases.world?.getContext("2d");
  const fx = canvases.fx?.getContext("2d");
  const lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) return;
  // Two wrecks ahead of the start heading, so the cannon has something to fire at.
  const scene = new FlightScene(
    { world, fx, lfx } satisfies FlightLayerContexts,
    {
      loadout,
      targets: [
        { x: 460, y: 340 },
        { x: 520, y: 120 },
      ],
    },
  );
  let shown = { burn: "", tick: -1, view: "" };
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
    if (shown.burn !== burn || shown.tick !== tick || shown.view !== view) {
      if (shown.view !== view) scene.restart(burn, VIEWS[view]);
      scene.seek(burn, tick, Infinity);
      rendered = true;
      drawnTick = tick;
      drawnView = view;
      drawnBurn = burn;
      shown = { burn, tick, view };
      lost = scene.lost;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
});
</script>

<figure
  class="host"
  data-rendered={rendered}
  data-drawn-tick={drawnTick}
  data-drawn-view={drawnView}
  data-drawn-burn={drawnBurn}
  data-burn={burn}
  data-playing={playing}
  data-tick={tick}
  bind:clientWidth={hostW}
  bind:clientHeight={hostH}
  aria-label={label}
>
  <div
    class="screen"
    style={`width:${SCREEN.w}px;height:${SCREEN.h}px;transform:translate(-50%,-50%) scale(${scale})`}
  >
    <div
      class="slot"
      style={`left:${PAD}px;top:${TOP}px;width:${SCENE.w}px;height:${SCENE.h}px`}
    >
      <StudyFlightLayers
        bind:canvases
        label="The game’s layers at the current time"
        displayScale={scale}
      />
      <p class="fx-trial">
        Study trial · FX Screen + Expand 4px · LFX Hard light
      </p>
      <div class="view">
        <Toggle
          compact
          label="View"
          options={Object.keys(VIEWS)}
          bind:value={view}
        />
      </div>
      {#if lost}
        <p class="lost" role="status">
          Ship lost at {lost.seconds.toFixed(2)} s{lost.cause
            ? ` · ${lost.cause}`
            : ""}
        </p>
      {/if}
    </div>
    <div
      class="slot"
      style={`left:${PAD}px;top:${TOP + SCENE.h + CONTROL_GAP}px;width:${COL}px`}
    >
      <BurnRow bind:burn {tick} />
    </div>
    <div
      class="slot time"
      style={`left:${PAD + COL + GAP}px;top:${TOP + SCENE.h + CONTROL_GAP}px;width:${COL}px;height:${CONTROL}px`}
    >
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
</figure>

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
.fx-trial {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  margin: 0;
  padding: 4px 7px;
  background: rgb(0 0 0 / 65%);
  color: var(--color-text);
  font-size: 11px;
  line-height: 1.2;
  pointer-events: none;
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
.lost {
  position: absolute;
  left: 16px;
  bottom: 16px;
  margin: 0;
  color: var(--color-caution-tape);
  font-size: 13px;
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
</style>
