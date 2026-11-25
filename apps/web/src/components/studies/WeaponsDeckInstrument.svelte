<script lang="ts">
import { type InputAction, litPads } from "@void-drift/core";
import selected from "../../../public/studies/flight-deck-weapons-2026-11-24/02-3-selected.json";
import { GAME_GUTTER_PX } from "../../lib/game-screen";
import ThrustPads from "../controls/ThrustPads.svelte";
import {
  PAD_ASSEMBLY_HEIGHT_PX,
  SEAM_SLOPE_DEG,
} from "../controls/thrust-pads";
import SegmentedControl from "../inputs/SegmentedControl.svelte";
import { FlapConfigSchema, type WeaponState } from "./weapons-deck/config";
import DeckFlap from "./weapons-deck/DeckFlap.svelte";
import "@void-drift/core/styles/flight.css";

let _props: { "client:only"?: string } = $props();
const actions: Record<string, InputAction | null> = {
  "0": null,
  L: "L",
  R: "R",
  F: "LR",
  LF: "LF",
  RF: "RF",
};
let shown = $state("0");
let weaponState = $state<WeaponState>("On");
const config = FlapConfigSchema.parse(selected);
const pauseAppearance = {
  ...config.states.On,
  tint: "Surface" as const,
  borderWidth: 0,
  stripeSide: "None" as const,
  line1: "PAUSE",
  line2: "",
};
const pauseConfig = {
  ...config,
  states: { On: pauseAppearance, Off: pauseAppearance, Alert: pauseAppearance },
};
const seamSlope = Math.tan((SEAM_SLOPE_DEG * Math.PI) / 180);
const flapBottom = $derived(
  PAD_ASSEMBLY_HEIGHT_PX -
    config.width * seamSlope -
    config.inset * seamSlope +
    config.gap,
);
const lit = $derived(litPads(actions[shown]));
</script>

<div
  id="weapons-instrument"
  class="instrument"
  style:--game-gutter={`${GAME_GUTTER_PX.side}px`}
  style:--deck-pad-height={`${PAD_ASSEMBLY_HEIGHT_PX}px`}
  data-pad-state={shown}
>
  <img class="backdrop" src="/skies/sol.png" alt="">
  <div class="deck">
    <div class="deck-instruments left">
      <div>
        <small>HULL</small><strong>100%</strong
        ><progress aria-label="Example hull" max="100" value="100"></progress>
      </div>
      <div>
        <small>POWER</small><strong>100%</strong
        ><progress aria-label="Example power" max="100" value="100"></progress>
      </div>
    </div>
    <div
      class="weapons-flap"
      style:left={`${config.inset}px`}
      style:bottom={`${flapBottom}px`}
    >
      <DeckFlap
        config={pauseConfig}
        state="On"
        side="left"
        label="Pause flap"
      />
    </div>
    <div
      class="weapons-flap"
      style:right={`${config.inset}px`}
      style:bottom={`${flapBottom}px`}
    >
      <DeckFlap {config} state={weaponState} />
    </div>
    <div class="deck-pads left"><ThrustPads side="left" {lit} /></div>
    <div class="deck-pads right"><ThrustPads side="right" {lit} /></div>
  </div>
  <div class="tools">
    <div class="tool-group">
      <span class="caption">Hold pad state</span>
      <SegmentedControl
        label="Held pad state"
        options={Object.keys(actions)}
        bind:value={shown}
      />
    </div>
    <div class="tool-group">
      <span class="caption">Weapons state</span>
      <SegmentedControl
        label="Weapons state"
        options={["On", "Off", "Alert"]}
        bind:value={weaponState}
      />
    </div>
  </div>
</div>

<style>
.instrument {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
  background: var(--color-void);
  color: var(--color-text);
  font-family: var(--font-family-ui);
}
.weapons-flap {
  position: absolute;
}
.backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.tools {
  position: absolute;
  top: var(--spacing-md);
  left: calc(var(--game-gutter) + var(--spacing-md));
  z-index: var(--layer-hud);
  display: flex;
  gap: var(--spacing-md);
}
.tool-group {
  display: grid;
  gap: var(--spacing-xs);
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
</style>
