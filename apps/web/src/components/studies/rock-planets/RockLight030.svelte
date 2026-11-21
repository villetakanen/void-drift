<script lang="ts">
import {
  COLOR,
  canvasFont,
  drawStar,
  drawSunFields,
  yellowStarPalette,
} from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  type FlightLayerId,
  Simulation,
  starterLoadout,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount, untrack } from "svelte";
import FlightLayers from "../../FlightLayers.svelte";
import frame from "./art-030-framing.json";
import {
  enhanceRockStructure,
  makeRegionalRockMaterial,
  type RockRecipe,
} from "./regional-material";

let {
  round = "comparison",
  materialPath = "/studies/mercury-2026-11-12/art-030-neutral.png",
}: {
  materialPath?: string;
  round?: "comparison" | "tuning" | "transfer" | "contrast" | "family";
} = $props();

const modes = untrack(() =>
  round === "family"
    ? [
        {
          label: "A · Mineral-rich stone",
          kind: "lfx",
          floor: 0.29,
          warmth: 0,
        },
        {
          label: "B · Basalt & highlands",
          kind: "lfx",
          floor: 0.29,
          warmth: 0,
        },
        { label: "C · Scarred ironstone", kind: "lfx", floor: 0.29, warmth: 0 },
      ]
    : round === "contrast"
      ? [
          {
            label: "A · Retained image reference",
            kind: "lfx",
            floor: 0.29,
            warmth: 0,
          },
          {
            label: "B · Generated highlands · unchanged",
            kind: "lfx",
            floor: 0.29,
            warmth: 0,
          },
          {
            label: "C · Same highlands · local contrast",
            kind: "lfx",
            floor: 0.29,
            warmth: 0,
          },
        ]
      : round === "transfer"
        ? [
            {
              label: "A · Retained image reference",
              kind: "lfx",
              floor: 0.29,
              warmth: 0,
            },
            {
              label: "B · Generated stone regions",
              kind: "lfx",
              floor: 0.29,
              warmth: 0,
            },
          ]
        : round === "tuning"
          ? [
              {
                label: "A · Current LFX · neutral",
                kind: "lfx",
                floor: 0.29,
                warmth: 0,
              },
              {
                label: "B · Deeper shadow · neutral",
                kind: "lfx",
                floor: 0.25,
                warmth: 0,
              },
              {
                label: "C · Current shadow · Sun-coloured",
                kind: "lfx",
                floor: 0.29,
                warmth: 0.12,
              },
              {
                label: "D · Deeper shadow · Sun-coloured",
                kind: "lfx",
                floor: 0.25,
                warmth: 0.12,
              },
            ]
          : [
              {
                label: "A · Fixed left light",
                kind: "fixed",
                floor: 0.29,
                warmth: 0,
              },
              {
                label: "B · Sun-facing body shade",
                kind: "body",
                floor: 0.29,
                warmth: 0,
              },
              {
                label: "C · Sun-facing LFX hard-light",
                kind: "lfx",
                floor: 0.29,
                warmth: 0,
              },
            ],
);
const columns = untrack(() =>
  round === "comparison" || round === "contrast" || round === "family" ? 3 : 2,
);
const panelWidth = columns === 3 ? 344 : 516;
let layerSets = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>[]>(
  modes.map(() => ({})),
);
let failed = $state(false);

// One common illumination field. B multiplies material values by twice the
// field; C sends the field to the real LFX hard-light blend. Neutral is 0.5.
function shade(
  image: HTMLCanvasElement,
  angle: number,
  floor = 0.29,
  warmth = 0,
  sunColour = "#ffaa00",
) {
  const rgb = [1, 3, 5].map(
    (start) => Number.parseInt(sunColour.slice(start, start + 2), 16) / 255,
  );
  const mean = (rgb[0] + rgb[1] + rgb[2]) / 3;
  const size = 192;
  const surface = document.createElement("canvas");
  surface.width = surface.height = size;
  const mask = document.createElement("canvas");
  mask.width = mask.height = size;
  const ctx = surface.getContext("2d");
  const maskCtx = mask.getContext("2d");
  if (!ctx || !maskCtx) return { surface, mask };
  ctx.drawImage(image, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size);
  const light = maskCtx.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = ((x + 0.5) * 2) / size - 1;
      const ny = ((y + 0.5) * 2) / size - 1;
      const r2 = nx * nx + ny * ny;
      const at = (y * size + x) * 4;
      if (r2 >= 1) {
        pixels.data[at + 3] = 0;
        continue;
      }
      const diffuse = Math.max(
        0,
        nx * Math.cos(angle) * 0.88 +
          ny * Math.sin(angle) * 0.88 +
          Math.sqrt(1 - r2) * 0.475,
      );
      const field = floor + (0.65 - floor) * Math.sqrt(diffuse);
      const litWeight = Math.max(0, Math.min(1, (field - 0.5) / 0.15));
      for (let channel = 0; channel < 3; channel++) {
        light.data[at + channel] =
          (field + warmth * (rgb[channel] - mean) * litWeight) * 255;
        pixels.data[at + channel] *= 2 * field;
      }
      light.data[at + 3] = pixels.data[at + 3];
    }
  ctx.putImageData(pixels, 0, 0);
  maskCtx.putImageData(light, 0, 0);
  return { surface, mask };
}

onMount(() => {
  let cancelled = false;
  const image = new Image();
  image.src = materialPath;
  image
    .decode()
    .then(() => {
      if (cancelled) return;
      const star = new Simulation({ ...stockSettings(), mode: "practice" })
        .star;
      const positions = [Math.PI, -Math.PI / 2, 0];
      const labels = ["SUN RIGHT", "SUN BELOW", "SUN LEFT"];
      const material = document.createElement("canvas");
      material.width = material.height = 192;
      const materialCtx = material.getContext("2d");
      if (!materialCtx) return;
      materialCtx.beginPath();
      materialCtx.arc(96, 96, 96, 0, Math.PI * 2);
      materialCtx.clip();
      materialCtx.drawImage(
        image,
        frame.x,
        frame.y,
        frame.side,
        frame.side,
        0,
        0,
        192,
        192,
      );
      const generated =
        round === "transfer" || round === "contrast"
          ? makeRegionalRockMaterial()
          : material;
      const enhanced =
        round === "contrast" ? enhanceRockStructure(generated) : generated;
      const fixed = shade(material, Math.PI);
      layerSets.forEach((layers, column) => {
        const sourceMaterial =
          round === "contrast"
            ? column === 0
              ? material
              : column === 1
                ? generated
                : enhanced
            : round === "transfer" && column === 1
              ? generated
              : material;
        const mode = modes[column];
        const seeds = [71, 97, 153];
        const recipes: RockRecipe[] = ["mineral", "highlands", "ironstone"];
        const materials =
          round === "family"
            ? seeds.map((seed) =>
                makeRegionalRockMaterial(192, recipes[column], seed),
              )
            : positions.map(() => sourceMaterial);
        const maps = positions.map((angle, index) =>
          shade(
            materials[index],
            angle + Math.PI,
            mode.floor,
            mode.warmth,
            yellowStarPalette(star.radius).body,
          ),
        );
        const dpr = window.devicePixelRatio || 1;
        for (const canvas of Object.values(layers)) {
          canvas.width = panelWidth * dpr;
          canvas.height = 580 * dpr;
          canvas.getContext("2d")?.scale(dpr, dpr);
        }
        const world = layers.world?.getContext("2d");
        const lfx = layers.lfx?.getContext("2d");
        if (!world || !lfx) return;
        world.fillStyle = COLOR.void;
        world.fillRect(0, 0, panelWidth, 580);
        world.save();
        lfx.save();
        for (const ctx of [world, lfx]) {
          ctx.translate(panelWidth / 2, 215);
          ctx.scale(0.6, 0.6);
          ctx.translate(-star.pos.x, -star.pos.y);
        }
        drawSunFields(world, star, { collecting: true, damaging: false }, 1040);
        drawStar(world, {
          x: star.pos.x,
          y: star.pos.y,
          radius: star.radius,
          color: star.color,
          glowColor: star.glowColor,
          appearance: star.appearance,
          time: 1800,
        });
        positions.forEach((angle, index) => {
          const x = star.pos.x + Math.cos(angle) * 220;
          const y = star.pos.y + Math.sin(angle) * 220;
          world.drawImage(
            mode.kind === "lfx"
              ? materials[index]
              : mode.kind === "fixed"
                ? fixed.surface
                : maps[index].surface,
            x - 45,
            y - 45,
            90,
            90,
          );
          if (mode.kind === "lfx")
            lfx.drawImage(maps[index].mask, x - 45, y - 45, 90, 90);
          world.fillStyle = COLOR.textMuted;
          world.font = canvasFont(10 / 0.6);
          world.textAlign = "center";
          world.fillText(
            round === "family" ? `SEED ${seeds[index]}` : labels[index],
            x,
            y + 73,
          );
        });
        drawBuild(
          world,
          starterLoadout("wasp"),
          star.pos.x + 115,
          star.pos.y + 120,
          -0.3,
          BUILD_FLIGHT_SCALE,
        );
        world.restore();
        lfx.restore();
        world.fillStyle = COLOR.textMuted;
        world.font = canvasFont(11);
        world.textAlign = "center";
        world.fillText("PRACTICE G7 · 0.6 px/u · r45", panelWidth / 2, 385);
        positions.forEach((_angle, index) => {
          const x = panelWidth / 6 + (index * panelWidth) / 3;
          world.drawImage(
            mode.kind === "lfx"
              ? materials[index]
              : mode.kind === "fixed"
                ? fixed.surface
                : maps[index].surface,
            x - 40.5,
            438,
            81,
            81,
          );
          if (mode.kind === "lfx")
            lfx.drawImage(maps[index].mask, x - 40.5, 438, 81, 81);
          world.fillText(
            round === "family" ? `SEED ${seeds[index]}` : labels[index],
            x,
            547,
          );
        });
        world.fillText(
          round === "family"
            ? "81 px detail · 3 predetermined seeds"
            : "81 px detail · surface orientation fixed",
          panelWidth / 2,
          575,
        );
      });
    })
    .catch(() => {
      if (!cancelled) failed = true;
    });
  return () => {
    cancelled = true;
  };
});
</script>
{#if failed}
  <p role="alert">The lighting comparison image could not load.</p>
{/if}
<div
  class="comparison"
  style={`--columns: ${columns}; --panel-width: ${panelWidth}`}
>
  {#each modes as mode, index}
    <figure>
      <h4>{mode.label}</h4>
      <div class="stage">
        <FlightLayers
          fxGlow={false}
          bind:canvases={layerSets[index]}
          label={round === "family"
            ? `${mode.label}: seeds 71, 97 and 153 at three positions around the Sun, repeated enlarged below`
            : `${mode.label}: same rock material at three positions around the Sun`}
        />
      </div>
    </figure>
  {/each}
</div>
<style>
.comparison {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  gap: var(--spacing-sm);
  width: 1040px;
  max-width: 100%;
  margin-block: var(--spacing-lg);
}
figure {
  margin: 0;
  min-width: 0;
}
h4 {
  font-size: var(--font-size-caption);
  min-height: 3em;
}
.stage {
  aspect-ratio: var(--panel-width) / 580;
  border: 1px solid var(--color-border);
}
.stage :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
</style>
