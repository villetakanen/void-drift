<script lang="ts">
import { onMount } from "svelte";
import { loadAuthoredRockMaterials } from "../../../lib/assets/rock-planets/authored-materials";
import type { PlanetAppearance } from "../../../lib/flight-scene";
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import { makeRockAppearances } from "./appearance";
import {
  AIR_DEPTH,
  AIR_LIGHTING,
  type AirBoundary,
  type AirLighting,
  ATMOSPHERE_TREATMENTS,
  type AtmosphereTreatment,
  DRAG_RATE,
} from "./atmosphere";
import {
  CLOUD_MATERIALS,
  COVERAGE_MATERIALS,
  loadCloudMaterials,
} from "./cloud-materials";
import {
  CLOUD_COVERAGE,
  CLOUD_OPACITY,
  CLOUD_SHADOWS,
  type CloudCoverage,
  type CloudOpacity,
} from "./clouds";
import {
  ROCK_HEAT_SCENE as config,
  HEAT_APPROACHES,
  heatStart,
} from "./fixture";
import { HEAT_STAMPS, heatSourceStamp, makeHeatLight } from "./heat";
import { starColour } from "./star-colour";

let { label = "Air around rock worlds" }: { label?: string } = $props();
const names = ["Mineral", "Highlands", "Impact"];
const fullNames = ["Mineral mosaic", "Ancient highlands", "Impact palimpsest"];
let approach = $state("Skim");
let heatMode = $state("Heat envelope");
let contactShape = $state("Soft glow");
let heatSource = $state("Curved band");
let bandBrightness = $state(180);
let bandWidth = $state(150);
let sourceReady = $state(false);
let sourceImages = $state<Record<string, string>>({});
onMount(() => {
  sourceReady = true;
});
$effect(() => {
  if (!sourceReady) return;
  sourceImages = Object.fromEntries(
    HEAT_STAMPS.map((kind) => [
      kind,
      heatSourceStamp(kind, 1, bandWidth / 100).toDataURL(),
    ]),
  );
});
const start = $derived(heatStart(approach));
const light = $derived(
  heatMode === "Heat envelope"
    ? makeHeatLight(
        contactShape,
        heatSource,
        bandBrightness / 100,
        bandWidth / 100,
      )
    : undefined,
);
let shadowIntensity = $state(1.45);
let preparedShadowIntensity = $state(1.45);
let atmosphereTreatment = $state<AtmosphereTreatment>("Cloud banks");
let airLighting = $state<AirLighting>("Separate air");
let coverage = $state<CloudCoverage>("02.5");
let opacity = $state<CloudOpacity>("Opaque");
let cloudShadowPercent = $state(42);
let cloudDayPercent = $state(91);
let cloudMaterial = $state("Cirrus");
let cloudFace = $state("Bright face");
const shadowPresets: Record<string, number> = {
  "02.11 shadow": 42,
  "Readable night": 18,
  "Deep night": 4,
};
const cloudShadow = $derived(
  Object.keys(shadowPresets).find(
    (name) => shadowPresets[name] === cloudShadowPercent,
  ) ?? "",
);
function selectCloudShadow(name: string) {
  if (name in shadowPresets) cloudShadowPercent = shadowPresets[name];
}
let sunlight = $state("Shared sunlight");
const boundary: AirBoundary = "Dayward";
let kelvin = $state(5800);
const colour = $derived(starColour(kelvin));
const starAppearance = $derived({ color: colour, glowColor: colour });
let material = $state(names[2]),
  treatment = $state("Air + drag");
let appearances = $state<PlanetAppearance[][]>([]),
  failed = $state("");
let disposeAppearances = $state<() => void>(() => {});
let prepareAppearanceIntensity = $state<(intensity: number) => void>(() => {});
const planet = $derived({
  reference: "practice-venus" as const,
  orbitAngle: 0,
  ...(treatment === "Air + drag"
    ? { atmosphere: { depth: AIR_DEPTH, dragRate: DRAG_RATE } }
    : {}),
});
const appearance = $derived.by(() => {
  // Each appearance tool requests a redraw at the same simulation instant.
  void [
    atmosphereTreatment,
    airLighting,
    coverage,
    opacity,
    preparedShadowIntensity,
    cloudShadowPercent,
    cloudMaterial,
    cloudFace,
    cloudDayPercent,
    heatMode,
    sunlight,
    kelvin,
  ];
  const chosen =
    appearances[names.indexOf(material)]?.[treatment === "Air + drag" ? 1 : 0];
  return chosen
    ? {
        ...chosen,
        label: `${material} · Dayward blue`,
      }
    : undefined;
});
onMount(() => {
  let disposed = false;
  Promise.all([loadAuthoredRockMaterials(), loadCloudMaterials()])
    .then(([materials, cloudFields]) => {
      if (!disposed) {
        const next = makeRockAppearances(
          materials,
          () => preparedShadowIntensity,
          () => atmosphereTreatment,
          () => airLighting,
          () => coverage,
          () => opacity,
          () => boundary,
          () => "#ffffff",
          () => sunlight === "Shared sunlight",
          () => cloudShadowPercent / 100,
          cloudFields,
          () => cloudMaterial,
          () => cloudFace === "Bright face",
          () => cloudDayPercent / 100,
          () => heatMode === "Airflow",
        );
        disposeAppearances();
        appearances = next.appearances;
        disposeAppearances = next.dispose;
        prepareAppearanceIntensity = next.prepareShadowIntensity;
      }
    })
    .catch((error) => {
      if (!disposed) failed = String(error);
    });
  return () => {
    disposed = true;
    disposeAppearances();
  };
});
$effect(() => {
  try {
    prepareAppearanceIntensity(shadowIntensity);
    preparedShadowIntensity = shadowIntensity;
  } catch (error) {
    failed = String(error);
  }
});
</script>

{#if appearances.length}
  <FlightSceneInstrument
    {config}
    {label}
    {planet}
    {starAppearance}
    {start}
    {light}
    planetAppearance={appearance}
  >
    {#snippet pane()}
      <p>02.16 · Atmospheric heat envelope</p>
      <SegmentedControl
        label="Heat cue"
        options={["None", "Airflow", "Heat envelope"]}
        bind:value={heatMode}
        details={{}}
      />
      <p>FX source · what gets stamped</p>
      <SegmentedControl
        label="Heat stamp"
        details={{}}
        options={HEAT_STAMPS}
        bind:value={heatSource}
      />
      {#if heatSource === "Curved band"}
        <RingSlider
          label="Band brightness"
          min={100}
          max={250}
          step={5}
          digits={0}
          unit="%"
          bind:value={bandBrightness}
        />
        <RingSlider
          label="Band width"
          min={100}
          max={220}
          step={5}
          digits={0}
          unit="%"
          bind:value={bandWidth}
        />
        <p>
          100% on both restores the previous band. Opening proposal: 180%
          brightness, 150% width. Width thickens the band without moving it away
          from the hull. Brightness boosts faint entry, with emission capped at
          full strength.
        </p>
      {/if}
      {#if sourceImages[heatSource]}
        <figure class="heat-source">
          <img
            src={sourceImages[heatSource]}
            width="320"
            height="256"
            alt={`${heatSource}: raw FX source mark, forward to the right`}
          >
          <figcaption>
            {heatSource}
            · forward → · before FX filtering and fading
          </figcaption>
        </figure>
      {/if}
      <p>
        This is one source mark. Flight mirrors it around the ship’s motion and
        weights the planet-facing side more brightly. The three new marks are
        static; Current envelope retains its four frames. The band controls
        change FX only; its source preview shows the width before emission gain.
      </p>
      <p>
        Soft LFX glow and planet-facing emphasis are accepted and held fixed for
        this comparison. Use the same time and burn when switching stamps.
      </p>
      <details>
        <summary>Earlier LFX comparison</summary>
        <SegmentedControl
          label="Contact light"
          options={["Soft glow", "Tapered crescent"]}
          bind:value={contactShape}
        />
        <p>
          Soft glow is selected. The crescent remains available as a reference.
        </p>
      </details>
      <p>Approach · same ship, speed, atmosphere and fixed burns</p>
      <SegmentedControl
        label="Atmospheric approach"
        options={HEAT_APPROACHES}
        bind:value={approach}
        details={{}}
      />
      <p>
        Open at 0.45s. Skim: brief shallow exposure; Deeper: stronger, longer
        exposure. Outside misses the air. 02.15 pass restores the appearance
        study’s trajectory. All offered burns avoid the rock.
      </p>
      <p>
        Warm leading-edge light and trailing flame follow atmospheric overlap
        and planet-relative speed. Shared FX history fades after exit. This is a
        proposed danger cue, not applied heat damage: hull remains unchanged by
        air. Drag is still provisional at 0.8/s. B1/B2 are firing during entry;
        these are grazing passes, not sustained engine-off coasts.
      </p>
      <p>Dayward · settled blue rim and narrow peaks, 20° toward the Sun</p>
      <RingSlider
        label="Star colour temperature"
        min={2300}
        max={12000}
        step={100}
        digits={0}
        unit="K"
        bind:value={kelvin}
      />
      <p>
        Warm orange → near-white → blue-white. 5800 K is the opening reference.
        Approximate display colours; star size, pulse and flight stay fixed.
      </p>
      <p>
        Fixed blue emission is settled. The star slider remains a context check;
        it does not change the selected rim.
      </p>
      <p>02.15 · Lit-cloud brightness</p>
      <RingSlider
        label="Lit-cloud brightness"
        min={40}
        max={100}
        step={1}
        digits={0}
        unit="%"
        bind:value={cloudDayPercent}
      />
      <p>
        100% restores the bright white reference. Lower this to soften its
        prominence without changing colour, cloud coverage or the 42% dark side.
        This control applies to Bright face; 02.13 shading remains the old
        comparison. 91% is selected; 100% retains the full-bright comparison.
      </p>
      <p>Cloud face · retained comparison</p>
      <SegmentedControl
        label="Cloud face"
        options={["02.13 shading", "Bright face"]}
        bind:value={cloudFace}
      />
      <p>
        Bright face keeps the lit cloud material near white, with subtle
        internal detail. It blends into the selected 42% dark-side appearance.
        Coverage, opacity, shared sunlight and the blue rim stay fixed. The
        shadow slider still adjusts the dark side; rotation-speed exploration is
        out of scope.
      </p>
      <p>02.13 · Cloud coverage maps</p>
      <SegmentedControl
        label="Coverage map"
        options={COVERAGE_MATERIALS}
        bind:value={cloudMaterial}
        details={{}}
      />
      <p>
        Four separately generated maps calibrated to approximate covered area.
        Compare with 02.5 footprint / Opaque first; Sparse, Broad and Thin
        remain available below but alter the displayed coverage. Cloud opacity
        and night-side brightness are separate controls.
      </p>
      <p>Cloud structure alternatives · retained first set</p>
      <SegmentedControl
        label="Cloud material"
        options={CLOUD_MATERIALS.slice(0, 3)}
        bind:value={cloudMaterial}
        details={{}}
      />
      <SegmentedControl
        label="More cloud materials"
        options={CLOUD_MATERIALS.slice(3)}
        bind:value={cloudMaterial}
        details={{}}
      />
      <p>
        Four retained Earth-style density maps and the procedural baseline.
        Generated maps replace the pattern in either cloud-bearing treatment;
        choose Procedural to compare the earlier banks and bands. Gas-only
        treatments still have no clouds. Lighting, pale colour and rotation stay
        fixed.
      </p>
      <p>Night-side brightness · 42% restored for white clouds</p>
      <SegmentedControl
        label="Cloud shadow"
        options={[...CLOUD_SHADOWS]}
        bind:value={() => cloudShadow, selectCloudShadow}
        details={{}}
      />
      <RingSlider
        label="Night-side cloud brightness"
        min={4}
        max={42}
        step={1}
        digits={0}
        unit="%"
        bind:value={cloudShadowPercent}
      />
      <p>
        {cloudShadow ||
          (cloudShadowPercent === 42 ? "Selected shadow" : "Custom shadow")}
        · 42% is now the selected reference for white clouds; 24% remains
        available on the slider. This changes material brightness, not cloud
        transparency. Earlier presets remain available for comparison.
      </p>
      <p>
        02.11 shadow preserves the accepted reference. Readable night lowers the
        unlit cloud brightness from 42% to 18%; Deep night lowers it to 4%. Both
        blend into shadow over the same narrow band. Cloud opacity, openings,
        day-side light and the blue rim stay unchanged.
      </p>
      <p>Accepted material lighting · retained comparison</p>
      <SegmentedControl
        label="Material lighting"
        options={["02.10 light", "Shared sunlight"]}
        bind:value={sunlight}
        details={{}}
      />
      <p>
        Compare the unchanged 02.10 light with a coloured sunward LFX highlight
        shared by rock and clouds. Existing shadows remain; the blue rim stays
        fixed. Start at 5800 K, then compare warm and cool stars at the same
        instant.
      </p>
      <p>
        Reference defaults: Cloud banks, 02.5 / Opaque, Separate air, shadow
        1.45×. Retained tools below remain available for secondary checks.
      </p>
      <p>Rock material · {fullNames[names.indexOf(material)]}</p>
      <SegmentedControl
        label="Rock material"
        options={names}
        bind:value={material}
      />
      <RingSlider
        label="Planet shadow intensity"
        min={0}
        max={2}
        step={0.05}
        digits={2}
        unit="×"
        bind:value={shadowIntensity}
      />
      <p>
        1.45× is this round’s default. 1× restores the 02.1 shadow. 0× removes
        its darkening; 2× doubles it. Sunlit highlights and atmospheric drawing
        stay fixed.
      </p>
      <p>Atmosphere</p>
      <SegmentedControl
        label="Atmosphere"
        options={["Bare rock", "Air + drag"]}
        bind:value={treatment}
      />
      <details open>
        <summary>Atmosphere and cloud tools</summary>
        <p>Atmosphere material</p>
        <SegmentedControl
          label="Atmosphere material"
          options={[...ATMOSPHERE_TREATMENTS]}
          bind:value={atmosphereTreatment}
          details={{}}
        />
        <p>Cloud footprint · used by Cloud banks and Cloud bands</p>
        <SegmentedControl
          label="Cloud footprint"
          options={[...CLOUD_COVERAGE]}
          bind:value={coverage}
        />
        <p>Cloud opacity · density within the covered areas</p>
        <SegmentedControl
          label="Cloud opacity"
          options={[...CLOUD_OPACITY]}
          bind:value={opacity}
        />
        <p>Underlying lighting comparison</p>
        <SegmentedControl
          label="Air lighting"
          options={[...AIR_LIGHTING]}
          bind:value={airLighting}
          details={{}}
        />
        <p>
          These tools change the reference conditions without resetting flight.
          The accepted Dayward blue rim stays selected.
        </p>
      </details>
      <p>
        Body r40.33u · air depth 10u · provisional drag 0.8/s at full density.
      </p>
      <p>
        Options preserve the burn and time. Follow is flight scale; Follow 4× is
        enlarged.
      </p>
      <p>
        Use B1–B3 and the timeline to compare approach, entry and exit. No
        atmospheric damage; solid contact retains the game's hull cost.
      </p>
    {/snippet}
  </FlightSceneInstrument>
{:else}
  <p role="status">{failed || "Loading rock materials and cloud maps…"}</p>
{/if}

<style>
.heat-source {
  margin: 0;
}
.heat-source img {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  background: #080810;
}
</style>
