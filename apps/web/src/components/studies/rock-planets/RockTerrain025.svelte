<script lang="ts">
import { COLOR, canvasFont, drawStar, drawSunFields } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  Simulation,
  starterLoadout,
  stockSettings,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import { makeTerrainMaterial } from "./terrain-material";

let canvas: HTMLCanvasElement;
onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 1040 * dpr;
  canvas.height = 570 * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLOR.void;
  ctx.fillRect(0, 0, 1040, 570);
  const maps = [71, 97, 153].map((seed) => makeTerrainMaterial(seed));
  const sim = new Simulation({ ...stockSettings(), mode: "practice" });
  const star = sim.star,
    wasp = starterLoadout("wasp");
  const globe = (
    map: HTMLCanvasElement,
    x: number,
    y: number,
    r: number,
    a = 0,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.drawImage(map, -r, -r, r * 2, r * 2);
    ctx.restore();
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 530, 570);
  ctx.clip();
  ctx.translate(190, 285);
  ctx.scale(0.9, 0.9);
  ctx.translate(-star.pos.x, -star.pos.y);
  drawSunFields(ctx, star, { collecting: true, damaging: false }, 1040);
  drawStar(ctx, {
    x: star.pos.x,
    y: star.pos.y,
    radius: star.radius,
    color: star.color,
    glowColor: star.glowColor,
    appearance: star.appearance,
    time: 1800,
  });
  const bodies = [
    { r: 18, d: 220, a: -0.82 },
    { r: 30, d: 260, a: -0.02 },
    { r: 45, d: 330, a: 0.67 },
  ];
  for (const body of bodies) {
    const x = star.pos.x + Math.cos(body.a) * body.d,
      y = star.pos.y + Math.sin(body.a) * body.d;
    globe(maps[0], x, y, body.r, body.a);
    ctx.fillStyle = COLOR.textMuted;
    ctx.font = canvasFont(12 / 0.9);
    ctx.textAlign = "center";
    ctx.fillText(`r ${body.r}`, x, y + body.r + 20);
  }
  drawBuild(
    ctx,
    wasp,
    star.pos.x + 205,
    star.pos.y + 68,
    -0.3,
    BUILD_FLIGHT_SCALE,
  );
  ctx.restore();
  ctx.strokeStyle = COLOR.border;
  ctx.beginPath();
  ctx.moveTo(540, 18);
  ctx.lineTo(540, 552);
  ctx.stroke();
  ctx.fillStyle = COLOR.textMuted;
  ctx.font = canvasFont(12);
  ctx.textAlign = "center";
  ctx.fillText("PRACTICE G7 · 0.9 px/u · three sizes, one terrain", 270, 553);
  globe(maps[0], 735, 187, 136);
  drawBuild(ctx, wasp, 948, 187, -0.3, BUILD_FLIGHT_SCALE * 3);
  ctx.fillText("TERRAIN DETAIL · r 45 at 3 px/u · starter Wasp", 790, 350);
  for (let i = 0; i < 3; i++) {
    globe(maps[i], 635 + i * 155, 451, 49.5);
    ctx.fillText(`seed ${[71, 97, 153][i]}`, 635 + i * 155, 526);
  }
  ctx.fillText("SAME METHOD · three geological maps at 1.1 px/u", 790, 553);
});
</script>
<canvas
  bind:this={canvas}
  aria-label="Survey rock representation: three sizes beside Practice G7 and the Wasp, enlarged detail and three seeded geological maps"
></canvas>
<style>
canvas {
  display: block;
  width: 1040px;
  max-width: 100%;
  height: auto;
  aspect-ratio: 1040 / 570;
  border: 1px solid var(--color-border);
}
</style>
