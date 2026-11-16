<script lang="ts">
import {
  PRACTICE_VENUS_ORBIT,
  PRACTICE_VENUS_TRAVEL_SPEED,
  starterLoadout,
} from "@void-drift/mode-a";
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
let sceneKind = $state("Wrecks");
let starColour = $state("Stock");
const starAppearance = $derived(
  starColour === "Stock"
    ? undefined
    : {
        color: starColour === "Warm" ? "#ff7d24" : "#718fff",
        glowColor: starColour === "Warm" ? "#ff7d24" : "#718fff",
      },
);
const planetDoc = FlightSceneDocumentSchema.parse({
  loadout: starterLoadout("wasp"),
  planet: { reference: "practice-venus", orbitAngle: 0 },
  start: {
    x: 960 + PRACTICE_VENUS_ORBIT - 90,
    y: 440,
    rotation: Math.PI / 2,
    velocity: { x: 0, y: 230 + PRACTICE_VENUS_TRAVEL_SPEED },
  },
  follow: { near: 0.8, far: 4 },
  opening: { burn: "course", view: "follow", tick: 30 },
});
let planetApproach = $state("Reference");
const stagedStart = $derived(
  sceneKind === "Planet" && planetDoc.start
    ? {
        ...planetDoc.start,
        x: planetDoc.start.x + (planetApproach === "Deeper" ? 2 : 0),
      }
    : undefined,
);
const activeDoc = $derived(sceneKind === "Planet" ? planetDoc : doc);
const modes = $derived(targetModes(activeDoc));

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

{#key sceneKind}
  <FlightSceneInstrument
    config={activeDoc}
    targets={sceneKind === "Planet" ? "none" : targets}
    {layers}
    {starAppearance}
    start={stagedStart}
    light={lit ? EXAMPLE_LIGHT : undefined}
  >
    {#snippet pane()}
      <p>Scene</p>
      <Toggle
        label="Scene"
        options={["Wrecks", "Planet"]}
        bind:value={sceneKind}
      />
      {#if sceneKind === "Planet"}
        <p>Approach · changing start preserves the selected burn and time</p>
        <Toggle
          label="Planet approach"
          options={["Reference", "Deeper"]}
          bind:value={planetApproach}
        />
        <p>
          Current Practice Venus staged beside a Wasp. Fixed burns and timeline;
          production body drawing.
        </p>
      {/if}
      <p>Star colour · presentation only</p>
      <Toggle
        label="Star colour"
        options={["Stock", "Warm", "Cool"]}
        bind:value={starColour}
      />
      <p>
        Warm/Cool use the standard star body and glow; gravity, collection,
        damage, radius and replay are unchanged.
      </p>
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
{/key}

<style>
.rows {
  display: grid;
  grid-template-columns: max-content max-content;
  align-items: center;
  gap: var(--spacing-sm) var(--spacing-md);
}
</style>
