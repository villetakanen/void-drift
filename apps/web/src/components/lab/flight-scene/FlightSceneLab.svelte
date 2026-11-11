<script lang="ts">
import { untrack } from "svelte";
import {
  defaultTargets,
  FlightSceneDocumentSchema,
  STARTER_FLIGHT_SCENE,
  type StudyLight,
  type TargetMode,
  targetModes,
} from "../../../lib/flight-scene";
import Switch from "../../inputs/Switch.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import FlightSceneInstrument from "./FlightSceneInstrument.svelte";

// The Lab's reference use of the Flight scene instrument. The instrument has
// no menu controls of its own; these are this page's, and show what a study
// can put in the menu: the staged targets, the layers shown, and a light of
// its own.
let { config = STARTER_FLIGHT_SCENE }: { config?: unknown } = $props();
const doc = untrack(() => FlightSceneDocumentSchema.parse(config));
const LABELS: Record<TargetMode, string> = {
  none: "None",
  placed: "Placed",
  held: "Held ahead",
};
const modes = targetModes(doc);

/** A plain marker at each firing main engine, to show where a study paints. */
const EXAMPLE_LIGHT: StudyLight = {
  label: "Example marker",
  replaces: [],
  lfx(ctx, { engines }) {
    for (const engine of engines) {
      if (!(engine.output > 0)) continue;
      ctx.save();
      ctx.translate(engine.x, engine.y);
      ctx.rotate(engine.angle);
      ctx.strokeStyle = "rgb(255,244,214)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-7, -3, 6, 6);
      ctx.restore();
    }
  },
};

let targets = $state<TargetMode>(defaultTargets(doc));
let layers = $state({ world: true, fx: true, lfx: true });
let lit = $state(false);
const id = $props.id();
</script>

<FlightSceneInstrument
  {config}
  {targets}
  {layers}
  light={lit ? EXAMPLE_LIGHT : undefined}
>
  {#snippet pane()}
    <p>Targets</p>
    <Toggle
      stretch
      label="Targets"
      options={modes.map((mode) => LABELS[mode])}
      bind:value={
        () => LABELS[targets],
        (v) => {
  targets = modes.find((mode) => LABELS[mode] === v) ?? targets;
}
      }
    />
    <p>Layers</p>
    <div class="rows">
      <label for={`${id}-world`}>World</label>
      <Switch id={`${id}-world`} bind:checked={layers.world} />
      <label for={`${id}-fx`}>FX</label>
      <Switch id={`${id}-fx`} bind:checked={layers.fx} />
      <label for={`${id}-lfx`}>LFX</label>
      <Switch id={`${id}-lfx`} bind:checked={layers.lfx} />
    </div>
    <p>Study light</p>
    <div class="rows">
      <label for={`${id}-light`}>{EXAMPLE_LIGHT.label}</label>
      <Switch id={`${id}-light`} bind:checked={lit} />
    </div>
  {/snippet}
</FlightSceneInstrument>

<style>
.rows {
  display: grid;
  grid-template-columns: max-content max-content;
  align-items: center;
  gap: var(--spacing-sm) var(--spacing-md);
}
</style>
