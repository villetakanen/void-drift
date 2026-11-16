<script lang="ts">
import { onMount } from "svelte";
import { loadAuthoredRockMaterials } from "../../../lib/assets/rock-planets/authored-materials";
import type { PlanetAppearance } from "../../../lib/flight-scene";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";
import FlightSceneInstrument from "../../lab/flight-scene/FlightSceneInstrument.svelte";
import { makeRockAppearances } from "./appearance";
import { AIR_DEPTH, type AirBoundary, DRAG_RATE } from "./atmosphere";
import { ROCK_ATMOSPHERE_SCENE as config } from "./fixture";
import { starColour } from "./star-colour";

let { label = "Air around rock worlds" }: { label?: string } = $props();
const names = ["Mineral", "Highlands", "Impact"];
const fullNames = ["Mineral mosaic", "Ancient highlands", "Impact palimpsest"];
let shadowIntensity = $state(1.45);
const atmosphereTreatment = "Cloud banks";
const airLighting = "Separate air";
const coverage = "02.5";
const opacity = "Opaque";
const boundary: AirBoundary = "Dayward";
let kelvin = $state(5800);
const response = "Fixed blue";
const colour = $derived(starColour(kelvin));
const starAppearance = $derived({ color: colour, glowColor: colour });
let material = $state(names[2]),
  treatment = $state("Air + drag");
let appearances = $state<PlanetAppearance[][]>([]),
  failed = $state("");
const planet = $derived({
  reference: "practice-venus" as const,
  orbitAngle: 0,
  ...(treatment === "Air + drag"
    ? { atmosphere: { depth: AIR_DEPTH, dragRate: DRAG_RATE } }
    : {}),
});
const appearance = $derived.by(() => {
  const chosen =
    appearances[names.indexOf(material)]?.[treatment === "Air + drag" ? 1 : 0];
  return chosen
    ? {
        ...chosen,
        label: `${chosen.label} · ${boundary} · ${kelvin} K · ${response}`,
      }
    : undefined;
});
onMount(() => {
  let disposed = false;
  loadAuthoredRockMaterials()
    .then((materials) => {
      if (!disposed)
        appearances = makeRockAppearances(
          materials,
          () => shadowIntensity,
          () => atmosphereTreatment,
          () => airLighting,
          () => coverage,
          () => opacity,
          () => boundary,
          () => "#ffffff",
        );
    })
    .catch((error) => {
      if (!disposed) failed = String(error);
    });
  return () => {
    disposed = true;
  };
});
</script>

{#if appearances.length}
  <FlightSceneInstrument
    {config}
    {label}
    {planet}
    {starAppearance}
    planetAppearance={appearance}
  >
    {#snippet pane()}
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
      <p>
        The star body and glow change; rock, clouds and low haze retain their
        existing lighting. This isolates the rim response, not whole-scene
        colour grading.
      </p>
      <p>
        Fixed: 02.5 cloud footprint / Opaque, Separate air lighting, pale colour
        and cloud rotation. Compare at 1.45× before changing the reference
        controls.
      </p>
      <p>Rock material · {fullNames[names.indexOf(material)]}</p>
      <Toggle label="Rock material" options={names} bind:value={material} />
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
      <Toggle
        label="Atmosphere"
        options={["Bare rock", "Air + drag"]}
        bind:value={treatment}
      />
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
  <p role="status">{failed || "Loading the three original rock materials…"}</p>
{/if}
