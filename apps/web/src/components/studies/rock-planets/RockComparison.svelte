<script lang="ts">
import {
  COLOR,
  canvasFont,
  drawPlanet,
  drawStar,
  drawSunFields,
} from "@void-drift/core";
import { Simulation, stockSettings } from "@void-drift/mode-a";
import { onMount } from "svelte";
import { makeRockMaterial, type RockTreatment } from "./rock-material";

let { treatment }: { treatment: RockTreatment } = $props();
let canvas: HTMLCanvasElement;

onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 340 * dpr;
  canvas.height = 540 * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLOR.void;
  ctx.fillRect(0, 0, 340, 540);
  const texture = makeRockMaterial(treatment);
  const sim = new Simulation({ ...stockSettings(), mode: "practice" });
  const star = sim.star;
  const globe = (x: number, y: number, radius: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(texture, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 340, 380);
  ctx.clip();
  ctx.translate(40, 177);
  ctx.scale(0.7, 0.7);
  ctx.translate(-star.pos.x, -star.pos.y);
  drawSunFields(ctx, star, { collecting: true, damaging: false }, 340);
  drawStar(ctx, {
    x: star.pos.x,
    y: star.pos.y,
    radius: star.radius,
    color: star.color,
    glowColor: star.glowColor,
    appearance: star.appearance,
    time: 1800,
  });
  const radii = [18, 30, 45];
  for (const [i, angle] of [-0.65, 0, 0.65].entries()) {
    const x = star.pos.x + Math.cos(angle) * 255;
    const y = star.pos.y + Math.sin(angle) * 255;
    const radius = radii[i];
    globe(x, y, radius, angle);
    ctx.fillStyle = COLOR.textMuted;
    ctx.font = canvasFont(12 / 0.7);
    ctx.textAlign = "center";
    ctx.fillText(`r ${radius}`, x, y + radius + 19);
  }
  ctx.restore();
  ctx.fillStyle = COLOR.textMuted;
  ctx.font = canvasFont(12);
  ctx.textAlign = "center";
  ctx.fillText("FIELD VIEW · 0.7 px/u", 170, 361);
  ctx.strokeStyle = COLOR.border;
  ctx.beginPath();
  ctx.moveTo(16, 380);
  ctx.lineTo(324, 380);
  ctx.stroke();
  drawPlanet(ctx, { x: 83, y: 454, radius: 54, color: "#D0D0D0" });
  globe(257, 454, 54, 0);
  ctx.fillText("Current disc", 83, 526);
  ctx.fillText("Study · same r 30", 257, 526);
});
</script>

<canvas
  bind:this={canvas}
  aria-label={`${treatment} rock palette: three sizes inside the Practice G7 field, plus current and proposed enlarged planet drawings`}
></canvas>

<style>
canvas {
  display: block;
  width: 340px;
  max-width: 100%;
  height: auto;
  aspect-ratio: 340 / 540;
  border: 1px solid var(--color-border);
}
</style>
