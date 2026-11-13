<script lang="ts">
import {
  CloudBodyPainter,
  COLOR,
  canvasFont,
  RockBodyPainter,
} from "@void-drift/core";
import { onMount } from "svelte";
import { loadPracticeMercury } from "../../../lib/assets/rock-planets/authored-materials";
import { SphericalSurface } from "../../../lib/assets/rock-planets/spherical-surface";
import { cloudAtlas } from "./cloud-material";

let {
  label = "Quiet ivory envelope with a narrow lit rim, enlarged and at flight scale beside Practice Mercury",
  structure = false,
  rimWidth = 0.018,
  lightStrength = 1,
  palette = "ivory",
}: {
  label?: string;
  structure?: boolean;
  rimWidth?: number;
  lightStrength?: number;
  palette?: "ivory" | "amber" | "orange";
} = $props();
let canvas: HTMLCanvasElement;
let failure = $state("");

onMount(() => {
  let disposed = false;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    failure = "Comparison canvas unavailable";
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 336 * dpr;
  canvas.height = 440 * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLOR.void;
  ctx.fillRect(0, 0, 336, 440);
  const surface = new SphericalSurface(cloudAtlas(structure, palette), "atlas");
  surface.draw(0);
  const painter = new CloudBodyPainter([surface.canvas]);
  const globe = (
    body: RockBodyPainter,
    x: number,
    y: number,
    r: number,
    atmosphere = false,
  ) => {
    body.body(ctx, 0, x, y, r);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = atmosphere ? lightStrength : 1;
    body.light(ctx, x, y, r, x - 400, y - 160);
    ctx.restore();
    if (atmosphere) {
      painter.atmosphere(ctx, x, y, r, x - 400, y - 160, 1, rimWidth);
    }
  };
  const label = (text: string, x: number, y: number) => {
    ctx.fillStyle = COLOR.textMuted;
    ctx.font = canvasFont(12);
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
  };
  globe(painter, 168, 137, 96, true);
  label("ENLARGED · 3.2 px/u", 168, 264);
  ctx.strokeStyle = COLOR.border;
  ctx.beginPath();
  ctx.moveTo(20, 286);
  ctx.lineTo(316, 286);
  ctx.stroke();
  globe(painter, 105, 345, 21, true);
  label("Venus · r 30u", 105, 393);
  label("Mercury · r 27u", 238, 393);
  label("FLIGHT SCALE · 0.7 px/u", 168, 427);
  loadPracticeMercury()
    .then((mercury) => {
      if (disposed) return;
      // Snapshot the shared material: do not advance the cached Practice surface.
      const frozen = document.createElement("canvas");
      frozen.width = frozen.height = 192;
      frozen.getContext("2d")?.drawImage(mercury.surface.canvas, 0, 0);
      globe(new RockBodyPainter([frozen]), 238, 345, 18.9);
    })
    .catch((error: unknown) => {
      if (!disposed)
        failure =
          error instanceof Error
            ? error.message
            : "Mercury reference unavailable";
    });
  return () => {
    disposed = true;
  };
});
</script>

<canvas bind:this={canvas} aria-label={label}>
  Cloud-covered Venus proposal under upper-left light, with a small-scale
  Mercury comparison.
</canvas>
{#if failure}
  <p role="alert">{failure}</p>
{/if}

<style>
canvas {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 336 / 440;
  border: 1px solid var(--color-border);
}
</style>
