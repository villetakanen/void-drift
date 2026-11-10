<script lang="ts">
import { type FlightLayerContexts, LoadoutSchema } from "@void-drift/mode-a";
import { onMount } from "svelte";
import {
  type BurnId,
  SECONDS,
  TICK_RATE,
  TOTAL_TICKS,
} from "../../lib/instrument";
import FlightLayers from "../FlightLayers.svelte";
import RingSlider from "../inputs/RingSlider.svelte";
import Toggle from "../inputs/Toggle.svelte";
import BurnRow from "../lab/instrument/BurnRow.svelte";
import OverlayPane from "../lab/instrument/OverlayPane.svelte";
import { FlightScene } from "./flight-scene";
import { studyStarterWasp } from "./starter-wasp-fixture";
import "@void-drift/core/styles/buttons.css";

// Flight scene study, 02.1: the Motion instrument's logical screen with the
// graphs and path pane replaced by one 16:9 game view.
let {
  label = "Flight scene: a burn in the game’s layers",
}: { label?: string } = $props();

const HISTORY = {
  "This instant": 0,
  "1 s": TICK_RATE,
  "Whole flight": Infinity,
} as const;
type History = keyof typeof HISTORY;

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
let history = $state<string>("1 s");
let rendered = $state(false);
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
  let shown = { burn: "", tick: -1, history: "" };
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
    if (
      shown.burn !== burn ||
      shown.tick !== tick ||
      shown.history !== history
    ) {
      // Another history setting shows the same instant reached again by a jump.
      if (shown.history !== history) scene.restart(burn);
      scene.seek(burn, tick, HISTORY[history as History]);
      rendered = true;
      shown = { burn, tick, history };
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
      <FlightLayers
        bind:canvases
        label="The game’s layers at the current time"
      />
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

  <OverlayPane>
    <div class="value">
      <p>Light shown after a jump in time</p>
      <Toggle
        stretch
        label="Light shown after a jump in time"
        options={Object.keys(HISTORY)}
        bind:value={history}
      />
      <p class="note">
        A jump flies the burn again from its start. The last part of that flight
        also paints its light: none of it, its final second, or all of it.
        Playing always carries the light forward.
      </p>
    </div>
  </OverlayPane>
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
.slot :global(canvas) {
  width: 100%;
  height: 100%;
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
.value {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}
.value p {
  margin: 0;
}
.note {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
</style>
