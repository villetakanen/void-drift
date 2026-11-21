<script lang="ts">
import {
  DEFAULT_ROCK_BODY_LIGHTING,
  type HabitableAppearance,
  type RockBodyLighting,
  RockBodyLightingSchema,
} from "@void-drift/core";
import {
  type FlightLayerId,
  HABITABLE_RADIUS,
  MERCURIAL_ROCK_RADIUS,
  STEP,
} from "@void-drift/mode-a";
import { onMount, type Snippet, untrack } from "svelte";
import type { DeepReadonly } from "../../../lib/flight-scene";
import {
  type FieldBackground,
  PENDING_BACKGROUND,
} from "../../../lib/game-field";
import {
  type PlanetInspectorDocument,
  PlanetInspectorScene,
} from "../../../lib/planet-inspector";
import GameField from "../../GameField.svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import Switch from "../../inputs/Switch.svelte";
import SideSheet from "../instrument/SideSheet.svelte";
import "@void-drift/core/styles/buttons.css";

type PlanetName = PlanetInspectorDocument["planet"]["name"];
const PLANET_LABELS: Record<PlanetName, string> = {
  habitable: "Habitable",
  mercury: "Mercury",
  mercurial: "Mercurial",
  "outer-mercurial": "Outer Mercurial",
  venus: "Venus",
  cradle: "The Cradle",
  earth: "Earth",
};

let {
  doc,
  paneDoc,
  label,
  pane,
  onSelect,
}: {
  doc: PlanetInspectorDocument;
  paneDoc: DeepReadonly<PlanetInspectorDocument>;
  label: string;
  pane?: Snippet<[DeepReadonly<PlanetInspectorDocument>]>;
  onSelect: (planet: PlanetInspectorDocument["planet"]) => void;
} = $props();
const opening = untrack(() => doc.opening);
const family = untrack(() => doc.planet.kind === "family");
let radius = $state(
  untrack(() => (doc.planet.kind === "family" ? doc.planet.radius : 27)),
);
const habitable = untrack(() => doc.planet.name === "habitable");
const radiusRange = habitable ? HABITABLE_RADIUS : MERCURIAL_ROCK_RADIUS;
let ground = $state<HabitableAppearance["ground"]>(
  untrack(() =>
    doc.planet.name === "habitable" ? doc.planet.ground : "archipelago",
  ),
);
let clouds = $state<HabitableAppearance["clouds"]>(
  untrack(() =>
    doc.planet.name === "habitable" ? doc.planet.clouds : "fronts",
  ),
);
const cloudLabels = {
  fronts: "Fronts",
  "cover-20": "20%",
  "cover-40": "40%",
} as const;
function selectMaterial(next: HabitableAppearance) {
  ground = next.ground;
  clouds = next.clouds;
  playing = false;
  void scene?.setHabitableAppearance(next).then(() => invalidate());
  invalidate();
}
function selectFamily(value: string) {
  if (value === "Habitable")
    onSelect({
      kind: "family",
      name: "habitable",
      radius: HABITABLE_RADIUS.reference,
      ground: "archipelago",
      clouds: "fronts",
    });
  else
    onSelect({
      kind: "family",
      name: value === "Outer Mercurial" ? "outer-mercurial" : "mercurial",
      radius: MERCURIAL_ROCK_RADIUS.practice,
    });
}
const namedOptions = ["Mercury", "Venus", "The Cradle", "Earth"];
const id = $props.id();
let playing = $state(opening.playing);
let orbit = $state(0);
let rotation = $state(opening.rotationDegrees);
let zoom = $state(`${opening.zoom}×`);
let lighting = $state<RockBodyLighting>({ ...DEFAULT_ROCK_BODY_LIGHTING });
const pixelsPerUnit = $derived(Number.parseInt(zoom, 10) * 0.5);
let hud = $state(true);
let visibility = $state({ world: true, fx: true, lfx: true });
let status = $state("Loading planet material…");
let lightingError = $state("");
let passTime = $state(0);
let redrawRate = $state(0);
let rendered = $state(false);
let drawnTick = $state(0);
let sceneWidth = $state(1440);
let sceneHeight = $state(900);
let host: HTMLElement;
let canvases = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>>({});
let scene: PlanetInspectorScene | undefined;
let background = $state<FieldBackground>(PENDING_BACKGROUND);
let skyX = $state(960),
  skyY = $state(540);
let invalidate = () => {};
let reset = () => {};

function scrubOrbit(value: number) {
  playing = false;
  scene?.setOrbit(value);
  orbit = value;
  invalidate();
}

function scrubRotation(value: number) {
  playing = false;
  scene?.seekRotation(value);
  rotation = value;
  invalidate();
}

function scrubRadius(value: number) {
  try {
    scene?.setRadius(value);
    radius = value;
    playing = false;
    invalidate();
  } catch {
    /* Invalid edits retain the previous validated specimen. */
  }
}

function applyLighting(input: unknown) {
  try {
    const next = RockBodyLightingSchema.parse(input);
    scene?.setLighting(next);
    lighting = next;
    lightingError = "";
    invalidate();
  } catch (error) {
    lightingError = `Lighting not changed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function updateLighting(key: keyof RockBodyLighting, value: number) {
  applyLighting({ ...lighting, [key]: value });
}

function temperatureClass(kelvin: number) {
  if (kelvin < 5000) return "K · approximate";
  if (kelvin < 6000) return "G · approximate";
  if (kelvin < 7500) return "F · approximate";
  return "A · approximate";
}

$effect(() => {
  // Zoom redraws without changing the inspection clock or staged pose.
  void playing;
  void zoom;
  void hud;
  void sceneWidth;
  void sceneHeight;
  invalidate();
});

onMount(() => {
  const world = canvases.world?.getContext("2d");
  const fx = canvases.fx?.getContext("2d");
  const lfx = canvases.lfx?.getContext("2d");
  if (!world || !fx || !lfx) {
    status = "Planet Inspector could not create its rendering canvases.";
    return;
  }
  let raf = 0;
  let previous: number | undefined;
  let accumulator = 0;
  let intersecting = true;
  let disposed = false;
  let lastMeasurement = 0;
  const active = () => intersecting && !document.hidden;
  const request = () => {
    if (!disposed && active() && !raf) raf = requestAnimationFrame(frame);
  };
  const frame = (now: number) => {
    raf = 0;
    if (!active() || !scene) {
      previous = undefined;
      return;
    }
    if (playing && previous !== undefined)
      accumulator += Math.min((now - previous) / 1000, 0.1);
    previous = playing ? now : undefined;
    if (!playing) accumulator = 0;
    while (accumulator >= STEP) {
      scene.step();
      accumulator -= STEP;
    }
    try {
      scene.resize(sceneWidth, sceneHeight);
      scene.draw(pixelsPerUnit, hud);
      const centre = scene.camera.getViewCentre();
      skyX = centre.x;
      skyY = centre.y;
      if (now - lastMeasurement >= 200) {
        passTime = scene.passMilliseconds;
        redrawRate = scene.redrawsPerSecond;
        lastMeasurement = now;
      }
      orbit = scene.orbit;
      rotation = scene.rotation;
      drawnTick = scene.sim.ticks;
      status = scene.status;
      rendered = true;
    } catch (error) {
      status = `Planet Inspector could not draw: ${error instanceof Error ? error.message : String(error)}`;
      playing = false;
    }
    request();
  };
  const create = () => {
    scene?.dispose();
    scene = new PlanetInspectorScene({ world, fx, lfx }, doc, request);
    status = scene.status;
    background = scene.background;
    previous = undefined;
    accumulator = 0;
    request();
  };
  invalidate = request;
  reset = () => {
    playing = opening.playing;
    zoom = `${opening.zoom}×`;
    create();
    lighting = { ...DEFAULT_ROCK_BODY_LIGHTING };
    lightingError = "";
    radius = doc.planet.kind === "family" ? doc.planet.radius : 27;
    ground =
      doc.planet.name === "habitable" ? doc.planet.ground : "archipelago";
    clouds = doc.planet.name === "habitable" ? doc.planet.clouds : "fronts";
  };
  create();
  const suspend = () => {
    previous = undefined;
    accumulator = 0;
    if (!active() && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    request();
  };
  const observer = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    suspend();
  });
  observer.observe(host);
  document.addEventListener("visibilitychange", suspend);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    document.removeEventListener("visibilitychange", suspend);
    scene?.dispose();
    scene = undefined;
    invalidate = () => {};
  };
});
</script>

<figure
  class="inspector"
  data-rendered={rendered}
  data-playing={playing}
  data-tick={drawnTick}
  data-orbit={orbit}
  data-rotation={rotation}
  data-zoom={Number.parseInt(zoom, 10)}
  data-pixels-per-unit={pixelsPerUnit}
  data-planet={doc.planet.name}
  data-radius={family ? radius : undefined}
  data-ground={habitable ? ground : undefined}
  data-clouds={habitable ? clouds : undefined}
>
  <div
    class="scene"
    bind:this={host}
    bind:clientWidth={sceneWidth}
    bind:clientHeight={sceneHeight}
  >
    <GameField
      showFxGlow={false}
      bind:canvases
      {label}
      {visibility}
      {background}
      cameraX={skyX}
      cameraY={skyY}
      width={sceneHeight ? (sceneWidth / sceneHeight) * 1080 : 1920}
    />
    <div class="views">
      <SegmentedControl
        label="Zoom"
        options={["1×", "2×", "4×", "8×", "16×"]}
        bind:value={zoom}
      />
    </div>
    <SideSheet title="Inspector" label="Planet inspection options">
      <p>Named planet</p>
      <SegmentedControl
        label="Named planet"
        options={namedOptions}
        details={{
          Mercury: "Practice",
          Venus: "Practice",
          "The Cradle": "Practice",
          Earth: "Lab copy",
        }}
        bind:value={
          () => (family ? "" : PLANET_LABELS[doc.planet.name]),
          (value) =>
  onSelect({
    kind: "named",
    name:
      (["mercury", "venus", "cradle", "earth"] as const).find(
        (name) => PLANET_LABELS[name] === value,
      ) ?? "mercury",
  })
        }
      />
      <p>Planet family</p>
      <SegmentedControl
        label="Planet family"
        options={["Mercurial", "Outer Mercurial", "Habitable"]}
        details={{
          Mercurial: "Inner rock",
          "Outer Mercurial": "Outer rock",
          Habitable: "Air and oceans",
        }}
        bind:value={
          () => (family ? PLANET_LABELS[doc.planet.name] : ""),
          selectFamily
        }
      />
      {#if family}
        <RingSlider
          label="Radius"
          min={radiusRange.min}
          max={radiusRange.max}
          step={0.1}
          bind:value={() => radius, scrubRadius}
          unit="u"
          digits={1}
        />
      {/if}
      {#if habitable}
        <p>Ground</p>
        <SegmentedControl
          label="Habitable ground"
          options={["Archipelago", "Violet"]}
          bind:value={
            () => (ground === "violet" ? "Violet" : "Archipelago"),
            (value) =>
  selectMaterial({
    ground: value === "Violet" ? "violet" : "archipelago",
    clouds,
  })
          }
        />
        <p>Clouds</p>
        <SegmentedControl
          label="Habitable clouds"
          options={["Fronts", "20%", "40%"]}
          bind:value={
            () => cloudLabels[clouds],
            (value) =>
  selectMaterial({
    ground,
    clouds:
      value === "20%" ? "cover-20" : value === "40%" ? "cover-40" : "fronts",
  })
          }
        />
      {/if}
      <p class="caption">
        {family ? "Generated family · G7 reference" : "Practice"}
        · Production appearance
      </p>
      <RingSlider
        label="Incoming light intensity"
        min={0}
        max={2}
        step={0.05}
        bind:value={
          () => lighting.incomingIntensity,
          (value) => updateLighting("incomingIntensity", value)
        }
        digits={2}
      />
      <RingSlider
        label="Shadow intensity"
        min={0}
        max={2}
        step={0.05}
        bind:value={
          () => lighting.shadowIntensity,
          (value) => updateLighting("shadowIntensity", value)
        }
        digits={2}
      />
      <RingSlider
        label="Star-light temperature"
        min={3500}
        max={10000}
        step={50}
        bind:value={
          () => lighting.temperatureK,
          (value) => updateLighting("temperatureK", value)
        }
        unit="K"
      />
      <p class="caption">
        {temperatureClass(lighting.temperatureK)}; incident light only
      </p>
      <button
        type="button"
        class="btn btn-ghost"
        onclick={() => {
          applyLighting({ ...DEFAULT_ROCK_BODY_LIGHTING });
        }}
      >
        Reset lighting
      </button>
      {#if lightingError}
        <p class="lighting-error" role="status">{lightingError}</p>
      {/if}
      <dl class="costs">
        <div>
          <dt>Planets pass time</dt>
          <dd>{passTime.toFixed(3)} ms</dd>
        </div>
        <div>
          <dt>Surface redraws per second</dt>
          <dd>{redrawRate.toFixed(1)}</dd>
        </div>
      </dl>
      <p class="caption">{pixelsPerUnit} px/u</p>
      <label class="choice" for={`${id}-hud`}
        >World HUD <Switch id={`${id}-hud`} bind:checked={hud} /></label
      >
      {#each ["world", "fx", "lfx"] as layer}
        <label class="choice" for={`${id}-${layer}`}
          >{layer.toUpperCase()}
          <Switch
            id={`${id}-${layer}`}
            bind:checked={visibility[layer as FlightLayerId]}
          /></label
        >
      {/each}
      {#if pane}
        {@render pane(paneDoc)}
      {/if}
    </SideSheet>
    <div class="identity">
      <span>{PLANET_LABELS[doc.planet.name]}</span>
      <span class="caption"
        >{doc.planet.name === "earth"
          ? "Lab copy of The Cradle · Earth ground"
          : family
            ? habitable
              ? "Production · Habitable family"
              : "Production · Mercurial family"
            : "Production · Practice"}</span
      >
    </div>
  </div>
  {#if status}
    <p class="status" role="status">{status}</p>
  {/if}
  <figcaption class="controls">
    <div class="actions">
      <button
        type="button"
        class="btn btn-primary"
        onclick={() => {
          playing = !playing;
        }}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <button type="button" class="btn btn-ghost" onclick={() => reset()}>
        Reset
      </button>
    </div>
    <RingSlider
      label="Surface rotation"
      min={0}
      max={360}
      step={0.1}
      bind:value={() => rotation, scrubRotation}
      unit="°"
      digits={1}
    />
    <RingSlider
      label="Orbit"
      min={0}
      max={360}
      step={0.1}
      bind:value={() => orbit, scrubOrbit}
      unit="°"
      digits={1}
    />
    <span class="caption clock"
      >{(drawnTick * STEP).toFixed(2)}
      s · {playing ? "Playing" : "Paused"}</span
    >
  </figcaption>
</figure>

<style>
.inspector {
  position: relative;
  margin: 0;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-void);
}
.scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.scene :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
.views {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
}
.identity {
  position: absolute;
  left: var(--spacing-md);
  top: calc(var(--spacing-md) + var(--button-min-height) + var(--spacing-sm));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  pointer-events: none;
}
.controls {
  position: absolute;
  left: var(--spacing-lg);
  right: var(--spacing-lg);
  bottom: var(--spacing-lg);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: var(--spacing-lg);
  align-items: center;
}
.actions {
  display: flex;
  gap: var(--spacing-xs);
}
.choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-block: var(--spacing-sm);
}
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
.lighting-error {
  color: var(--color-danger, #ff6b6b);
  font-size: var(--font-size-caption);
}
.costs {
  font-size: var(--font-size-caption);
}
.costs div {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-block: var(--spacing-sm);
}
.costs dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.clock {
  white-space: nowrap;
}
.status {
  position: absolute;
  bottom: calc(
    var(--spacing-lg) +
    var(--button-min-height) +
    var(--spacing-lg)
  );
  padding: var(--spacing-sm) var(--spacing-md);
  margin: 0;
  font-size: var(--font-size-caption);
}
</style>
