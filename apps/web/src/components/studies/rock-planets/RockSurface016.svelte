<script lang="ts">
import {
  COLOR,
  canvasFont,
  drawStar,
  drawSunFields,
  RockBodyPainter,
  updatePlanetOrbit,
} from "@void-drift/core";
import {
  type FlightLayerContexts,
  type FlightLayerId,
  Simulation,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount, untrack } from "svelte";
import FlightLayers from "../../FlightLayers.svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import {
  loadAuthoredRockMaterials,
  loadMercuryReferenceAtlas,
} from "./authored-materials";
import { quiltMineralMaterial } from "./quilted-material";
import { SphericalSurface } from "./spherical-surface";
import { makeStructuredMaterial } from "./structured-material";
import "@void-drift/core/styles/buttons.css";

let {
  label = "Fixed face versus a surface turning on a sphere",
  mode = "surface",
  seed = 71,
  variation = "placement",
  referenceSource = "hybrid",
}: {
  label?: string;
  mode?:
    | "surface"
    | "pace"
    | "selected"
    | "family"
    | "methods"
    | "variations"
    | "mercurial"
    | "reference"
    | "quilting";
  referenceSource?: "hybrid" | "mineral";
  seed?: number;
  variation?: "placement" | "scale";
} = $props();
let layerSets = $state<Partial<Record<FlightLayerId, HTMLCanvasElement>>[]>(
  untrack(() =>
    Array.from(
      {
        length:
          mode === "family" ||
          mode === "methods" ||
          mode === "variations" ||
          mode === "mercurial" ||
          mode === "quilting"
            ? 3
            : 2,
      },
      () => ({}),
    ),
  ),
);
let seconds = $state(0),
  playing = $state(false),
  ready = $state(false),
  failed = $state("");
const configs = untrack(() =>
  mode === "quilting"
    ? [
        "Mineral mosaic · original",
        "Quilted mineral · seed 153",
        "Quilted mineral · seed 97",
      ].map((label) => ({
        label,
        orbit: 4 / 250,
        spin: 2 / (1 / 18 + 1 / 120),
      }))
    : mode === "reference"
      ? [
          referenceSource === "mineral"
            ? "Mineral mosaic · original material"
            : "Hybrid 153 · unchanged",
          "Mercury · NASA global map",
        ].map((label) => ({
          label,
          orbit: 4 / 250,
          spin: 2 / (1 / 18 + 1 / 120),
        }))
      : mode === "mercurial"
        ? [
            "Hybrid 153 · retained",
            "Mercurial · seed 153",
            "Mercurial · seed 97",
          ].map((label) => ({
            label,
            orbit: 4 / 250,
            spin: 2 / (1 / 18 + 1 / 120),
          }))
        : mode === "variations"
          ? (variation === "placement"
              ? [
                  "Hybrid 153 · unchanged",
                  "Placement · right 0.10",
                  "Placement · up 0.10",
                ]
              : [
                  "Hybrid 153 · unchanged",
                  "Regions · 80% scale",
                  "Regions · 120% scale",
                ]
            ).map((label) => ({
              label,
              orbit: 4 / 250,
              spin: 2 / (1 / 18 + 1 / 120),
            }))
          : mode === "methods"
            ? [
                "Image reference",
                `Procedural · seed ${seed}`,
                `Hybrid · seed ${seed}`,
              ].map((label) => ({
                label,
                orbit: 4 / 250,
                spin: 2 / (1 / 18 + 1 / 120),
              }))
            : mode === "family"
              ? [
                  "A · Mineral mosaic",
                  "B · Ancient highlands",
                  "C · Impact palimpsest",
                ].map((label) => ({
                  label,
                  orbit: 4 / 250,
                  spin: 2 / (1 / 18 + 1 / 120),
                }))
              : mode === "selected"
                ? [
                    {
                      label: "A · 3 u/s · 31.3s spin",
                      orbit: 3 / 250,
                      spin: 2 / (1 / 18 + 1 / 120),
                    },
                    {
                      label: "B · 5 u/s · 31.3s spin",
                      orbit: 5 / 250,
                      spin: 2 / (1 / 18 + 1 / 120),
                    },
                  ]
                : mode === "pace"
                  ? [
                      {
                        label: "A · Earlier pace · 8 u/s · 18s spin",
                        orbit: 0.032,
                        spin: 18,
                      },
                      {
                        label: "B · Slow travel · 1 u/s · 120s spin",
                        orbit: 0.004,
                        spin: 120,
                      },
                    ]
                  : [
                      {
                        label: "A · Fixed projected face",
                        orbit: 0.032,
                        spin: 0,
                      },
                      {
                        label: "B · Surface turns across a sphere",
                        orbit: 0.032,
                        spin: 18,
                      },
                    ],
);
const names = configs.map((config) => config.label);
const duration = untrack(() => (mode !== "surface" ? 60 : 24));
const sequenceTimes = untrack(() =>
  mode === "family" ||
  mode === "methods" ||
  mode === "variations" ||
  mode === "mercurial" ||
  mode === "reference" ||
  mode === "quilting"
    ? [0, 8, 16]
    : mode !== "surface"
      ? [0, 30, 60]
      : [0, 6, 12],
);
onMount(() => {
  let disposed = false,
    raf = 0;
  Promise.all([
    loadAuthoredRockMaterials(),
    mode === "reference" ? loadMercuryReferenceAtlas() : Promise.resolve(null),
  ])
    .then(([materials, atlas]) => {
      if (disposed) return;
      if (mode === "reference" && !atlas)
        throw new Error("Mercury atlas unavailable");
      const sources =
        mode === "quilting"
          ? [
              materials[0],
              quiltMineralMaterial(materials[0], 153),
              quiltMineralMaterial(materials[0], 97),
            ]
          : mode === "reference" && atlas
            ? [
                referenceSource === "mineral"
                  ? materials[0]
                  : makeStructuredMaterial(153, materials),
                atlas,
              ]
            : mode === "mercurial"
              ? [
                  makeStructuredMaterial(153, materials),
                  makeStructuredMaterial(
                    153,
                    materials,
                    undefined,
                    "mercurial",
                  ),
                  makeStructuredMaterial(97, materials, undefined, "mercurial"),
                ]
              : mode === "variations"
                ? [
                    makeStructuredMaterial(153, materials),
                    makeStructuredMaterial(
                      153,
                      materials,
                      variation === "placement"
                        ? { offsetX: 0.1 }
                        : { scale: 0.8 },
                    ),
                    makeStructuredMaterial(
                      153,
                      materials,
                      variation === "placement"
                        ? { offsetY: -0.1 }
                        : { scale: 1.2 },
                    ),
                  ]
                : mode === "methods"
                  ? [
                      materials[1],
                      makeStructuredMaterial(seed),
                      makeStructuredMaterial(seed, materials),
                    ]
                  : configs.map(
                      (_, column) => materials[mode === "family" ? column : 1],
                    );
      const surface = (source: HTMLCanvasElement, column: number) =>
        new SphericalSurface(
          source,
          (mode === "reference" && column === 1) ||
            (mode === "quilting" && column > 0)
            ? "atlas"
            : "tile",
        );
      const lives = sources.map(surface);
      const painters = configs.map((config, column) => {
        const source = sources[column];
        const frames = sequenceTimes.map((time) => {
          if (!config.spin) return source;
          const frame = surface(source, column);
          frame.draw((time * Math.PI * 2) / config.spin);
          return frame.canvas;
        });
        return new RockBodyPainter([
          config.spin ? lives[column].canvas : source,
          ...frames,
        ]);
      });
      const sim = new Simulation({ ...stockSettings(), mode: "practice" });
      const planet = sim.planets[0];
      planet.radius = 45;
      planet.orbitRadius = 250;
      planet.orbitSpeed = 0.032;
      planet.orbitCenter.set(sim.star.pos.x, sim.star.pos.y);
      const contexts: FlightLayerContexts[] = layerSets.map((layers) => {
        for (const canvas of Object.values(layers)) {
          canvas.width = 516;
          canvas.height = 625;
        }
        const world = layers.world?.getContext("2d"),
          fx = layers.fx?.getContext("2d"),
          lfx = layers.lfx?.getContext("2d");
        if (!world || !fx || !lfx) throw new Error("Motion layers unavailable");
        return { world, fx, lfx };
      });
      let last = performance.now(),
        drawn = -1;
      const draw = (now: number) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (playing) {
          seconds = Math.min(duration, seconds + dt);
          if (seconds >= duration) playing = false;
        }
        if (seconds !== drawn) {
          contexts.forEach(({ world, fx, lfx }, column) => {
            const config = configs[column],
              painter = painters[column];
            if (config.spin)
              lives[column].draw((seconds * Math.PI * 2) / config.spin);
            planet.orbitAngle = -0.6;
            planet.orbitSpeed = config.orbit;
            updatePlanetOrbit(planet, seconds);
            for (const ctx of [world, fx, lfx]) ctx.clearRect(0, 0, 516, 625);
            world.fillStyle = COLOR.void;
            world.fillRect(0, 0, 516, 625);
            for (const ctx of [world, lfx]) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(0, 0, 516, 420);
              ctx.clip();
              ctx.translate(258, 215);
              ctx.scale(0.7, 0.7);
              ctx.translate(-sim.star.pos.x, -sim.star.pos.y);
            }
            drawSunFields(
              world,
              sim.star,
              { collecting: true, damaging: false },
              1040,
            );
            drawStar(world, {
              x: sim.star.pos.x,
              y: sim.star.pos.y,
              radius: sim.star.radius,
              color: sim.star.color,
              glowColor: sim.star.glowColor,
              appearance: sim.star.appearance,
              time: seconds * 1000,
            });
            world.strokeStyle = COLOR.border;
            world.lineWidth = 0.7;
            world.beginPath();
            world.arc(sim.star.pos.x, sim.star.pos.y, 250, 0, Math.PI * 2);
            world.stroke();
            painter.body(world, 0, planet.pos.x, planet.pos.y, 45);
            painter.light(
              lfx,
              planet.pos.x,
              planet.pos.y,
              45,
              sim.star.pos.x,
              sim.star.pos.y,
            );
            world.restore();
            lfx.restore();
            world.fillStyle = COLOR.textMuted;
            world.font = canvasFont(12);
            world.textAlign = "center";
            world.fillText(
              mode !== "surface"
                ? `ORBIT ${config.orbit} rad/s · r45 · 0.7 px/u`
                : "SAME ORBIT · r45 · 0.7 px/u · Sun-facing LFX",
              258,
              410,
            );
            sequenceTimes.forEach((time, index) => {
              const x = 86 + index * 172;
              painter.body(world, index + 1, x, 516, 54);
              painter.light(lfx, x, 516, 54, x - 200, 516);
              world.fillText(`${time}s`, x, 595);
            });
            world.fillText(
              "SURFACE SEQUENCE · fixed left light · 108 px",
              258,
              620,
            );
          });
          drawn = seconds;
        }
        raf = requestAnimationFrame(draw);
      };
      ready = true;
      raf = requestAnimationFrame(draw);
    })
    .catch((error) => {
      if (!disposed)
        failed =
          error instanceof Error
            ? error.message
            : "Motion comparison could not load";
    });
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
  };
});
</script>
<figure
  class="surface-motion"
  data-ready={ready}
  data-seconds={seconds.toFixed(2)}
  data-playing={playing}
  aria-label={label}
>
  <div class="controls">
    <button
      type="button"
      class="btn btn-filled"
      disabled={!ready}
      onclick={() => {
        if (seconds >= duration) seconds = 0;
        playing = !playing;
      }}
    >
      {playing ? "Pause motion" : "Play motion"}
    </button>
    <button
      type="button"
      class="btn btn-ghost"
      onclick={() => {
        playing = false;
        seconds = 0;
      }}
    >
      Reset motion
    </button>
    <div class="timeline">
      <RingSlider
        label="Motion time"
        unit="s"
        digits={1}
        min={0}
        max={duration}
        step={1 / 60}
        bind:value={seconds}
      />
    </div>
  </div>
  {#if failed}
    <p role="alert">{failed}</p>
  {/if}
  <div
    class="panels"
    style:grid-template-columns={`repeat(${names.length}, minmax(0, 1fr))`}
  >
    {#each names as name, index}
      <figure>
        <h4>{name}</h4>
        <div class="stage">
          <FlightLayers bind:canvases={layerSets[index]} label={name} />
        </div>
      </figure>
    {/each}
  </div>
</figure>
<style>
.surface-motion {
  width: 1040px;
  max-width: 100%;
  margin-block: var(--spacing-xl);
}
.controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-block: var(--spacing-lg);
}
.timeline {
  flex: 1;
  min-width: 0;
}
.panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-sm);
}
figure {
  margin: 0;
  min-width: 0;
}
h4 {
  min-height: 2em;
}
.stage {
  aspect-ratio: 516 / 625;
  border: 1px solid var(--color-border);
}
.stage :global(.flight-layers) {
  width: 100%;
  height: 100%;
}
</style>
