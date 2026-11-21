<script lang="ts">
import {
  type HeldDirections,
  holdPad,
  type InputAction,
  litPads,
  resolveAction,
  type ThrustPad,
} from "@void-drift/core";
import { PRACTICE_BACKGROUND } from "../../lib/game-field";
import { GAME_GUTTER_PX } from "../../lib/game-screen";
import ThrustPads from "../controls/ThrustPads.svelte";
import GameField from "../GameField.svelte";
import SegmentedControl from "../inputs/SegmentedControl.svelte";

// Both gutters' pads over the Practice sky: a selector shows each lit
// state, and live presses resolve through the real input rules.
let { label = "Flight controls" }: { label?: string } = $props();
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

let stageWidth = $state(0);
let stageHeight = $state(0);
</script>

<section aria-labelledby="thrust-pads-heading" aria-label={label}>
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
    <SegmentedControl
      label="Thrust pad state"
      options={[...STATES]}
      bind:value={shown}
    />
    <div
      class="stage"
      data-action={action ?? "none"}
      style:--gutter={`${GAME_GUTTER_PX.side}px`}
      bind:clientWidth={stageWidth}
      bind:clientHeight={stageHeight}
    >
      <GameField
        skyOnly
        background={PRACTICE_BACKGROUND}
        label="Stationary Practice sky"
        width={stageHeight ? (stageWidth / stageHeight) * 1080 : 1920}
      />
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
