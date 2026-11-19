<script lang="ts">
import { type FlightLayerId, SOL_SKY, systemSky } from "@void-drift/mode-a";
import { prepare } from "../lib/assets/flight-sky/prepare";
import { type FieldBackground, showsFieldSky } from "../lib/game-field";
import FlightLayers from "./FlightLayers.svelte";
import FlightSky from "./FlightSky.svelte";

let {
  canvases = $bindable({}),
  label,
  background,
  cameraX = 960,
  cameraY = 540,
  width = 1920,
  visibility = {},
  skyOnly = false,
}: {
  canvases?: Partial<Record<FlightLayerId, HTMLCanvasElement>>;
  label: string;
  background: FieldBackground;
  cameraX?: number;
  cameraY?: number;
  width?: number;
  visibility?: Partial<Record<FlightLayerId, boolean>>;
  skyOnly?: boolean;
} = $props();
let url = $state("");
const sourceKind = $derived(
  background.kind === "production" ? background.source.kind : "none",
);
const seed = $derived(
  background.kind === "production" && background.source.kind === "system"
    ? background.source.seed
    : undefined,
);
const sightline = $derived(seed === undefined ? SOL_SKY : systemSky(seed));
$effect(() => {
  const current = sightline;
  url = "";
  if (sourceKind === "none" || sourceKind === "pending") return;
  if (sourceKind === "practice") {
    let active = true;
    const image = new Image();
    image.src = "/skies/sol.png";
    void image
      .decode()
      .then(() => {
        if (active) url = image.src;
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }
  return prepare(
    { dustSeed: current.dustSeed, reaches: [current.reach], size: 1536 },
    (urls) => {
      url = urls[0];
    },
    () => {},
  );
});
</script>

{#if skyOnly}
  <FlightSky {url} {cameraX} {cameraY} {width} {sightline} />
{:else}
  <FlightLayers
    bind:canvases
    {label}
    {visibility}
    sky={showsFieldSky(background)
      ? { url, cameraX, cameraY, width, sightline }
      : undefined}
  />
{/if}
