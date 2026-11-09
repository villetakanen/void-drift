<script lang="ts">
import {
  type HeldDirections,
  holdPad,
  type InputAction,
  litPads,
  Renderer,
  resolveAction,
  type ThrustPad,
} from "@void-drift/core";
import { GAME_GUTTER_PX, GAME_HEIGHT } from "../../lib/game-screen";
import ThrustPads from "../inputs/ThrustPads.svelte";
import Toggle from "../inputs/Toggle.svelte";

// Both gutters' pads over the seeded starfield: a selector shows each lit
// state, and live presses resolve through the real input rules.
const STATES = ["none", "L", "R", "LR", "LF", "RF"] as const;
let shown = $state<string>("none");
let pointers = $state<Record<number, ThrustPad>>({});

const live = $derived.by(() => {
  const held: HeldDirections = { left: false, right: false, forward: false };
  for (const pad of Object.values(pointers)) holdPad(held, pad);
  return resolveAction(held);
});
const pressing = $derived(Object.keys(pointers).length > 0);
const action = $derived<InputAction | null>(
  pressing ? live : shown === "none" ? null : (shown as InputAction),
);
const lit = $derived(litPads(action));

function press(pointerId: number, pad: ThrustPad | null) {
  const next = { ...pointers };
  if (pad) next[pointerId] = pad;
  else delete next[pointerId];
  pointers = next;
}

let canvas: HTMLCanvasElement;
let stageWidth = $state(0);
let stageHeight = $state(0);

$effect(() => {
  const width = Math.round(stageWidth);
  const height = Math.round(stageHeight);
  if (!canvas || width === 0 || height === 0) return;
  const renderer = new Renderer(canvas);
  renderer.resize(width, height);
  renderer.clear();
  // The game's framing scale: the stage height shows the logical height.
  const scale = height / GAME_HEIGHT;
  const context = canvas.getContext("2d");
  context?.setTransform(scale, 0, 0, scale, 0, 0);
  renderer.drawBackground({
    x: 0,
    y: 0,
    width: width / scale,
    height: height / scale,
  });
  context?.setTransform(1, 0, 0, 1, 0, 0);
});
</script>

<section aria-labelledby="thrust-pads-heading">
  <h2 id="thrust-pads-heading">Thrust pads</h2>
  <p>
    Each side gutter holds one assembly: an upper turn pad and a burn pad nested
    in the bottom corner, split by a seam sloping down from the screen edge
    inward. The panes are borderless translucent glass, blue at rest and a thin
    yellow wash when lit, the burn pad denser in both. Press the pads with a
    pointer, or pick a state; pads light for the resolved action.
    <a href="/lab/studies/in-game-controllers#part-02-6">Study →</a>
  </p>
  <div class="example">
    <span class="caption">Lit state</span>
    <Toggle label="Thrust pad state" options={[...STATES]} bind:value={shown} />
    <div
      class="stage"
      data-action={action ?? "none"}
      style:--gutter={`${GAME_GUTTER_PX.side}px`}
      bind:clientWidth={stageWidth}
      bind:clientHeight={stageHeight}
    >
      <canvas bind:this={canvas} aria-hidden="true"></canvas>
      <div class="gutter left">
        <ThrustPads side="left" {lit} onpress={press} />
      </div>
      <div class="gutter right">
        <ThrustPads side="right" {lit} onpress={press} />
      </div>
      <p class="readout">
        {pressing ? "Pressed" : "Shown"}: {action ?? "none"}
      </p>
    </div>
  </div>
  <p>
    <code>ThrustPads</code>: <code>side</code> (<code>left</code>
    or
    <code>right</code>), <code>lit</code> pads from <code>litPads</code>, and
    <code>onpress(pointerId, pad)</code>
    for each pointer's pad, <code>null</code> on release, cancel, lost capture
    or leaving the assembly. It fills the width and height its host gives it;
    the host resolves actions.
  </p>
</section>

<style>
.example {
  justify-items: stretch;
}

.stage {
  position: relative;
  height: 680px;
  overflow: hidden;
  background: var(--color-void);
}

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.gutter {
  position: absolute;
  bottom: 0;
  width: var(--gutter);
  height: 320px;
  z-index: var(--layer-hud);
}

.gutter.left {
  left: 0;
}

.gutter.right {
  right: 0;
}

.readout {
  position: absolute;
  margin: 0;
  top: var(--spacing-md);
  left: 50%;
  translate: -50% 0;
  color: var(--color-text);
  font: var(--font-size-label) var(--font-family-ui);
}
</style>
