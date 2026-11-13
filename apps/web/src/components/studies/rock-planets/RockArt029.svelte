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
import framing from "./art-029-framing.json";

const names = [
  "A · Mineral mosaic",
  "B · Ancient highlands",
  "C · Impact palimpsest",
];
const ids = ["mineral", "highlands", "impact"] as const;
const paths = ids.map(
  (name) => `/studies/mercury-2026-11-12/art-029-${name}.png`,
);
let canvas: HTMLCanvasElement;
onMount(() => {
  let cancelled = false;
  const images = paths.map((src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  Promise.all(images.map((image) => image.decode())).then(() => {
    if (cancelled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 1040 * dpr;
    canvas.height = 360 * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = COLOR.void;
    ctx.fillRect(0, 0, 1040, 360);
    const sim = new Simulation({ ...stockSettings(), mode: "practice" });
    const star = sim.star;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(i * 347, 0, 345, 360);
      ctx.clip();
      ctx.translate(i * 347 + 65, 160);
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
      // Centre 230u from Sun: whole r30 body outside danger and inside collection.
      const frame = framing[ids[i]];
      ctx.save();
      ctx.beginPath();
      ctx.arc(star.pos.x + 230, star.pos.y, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        images[i],
        frame.x,
        frame.y,
        frame.side,
        frame.side,
        star.pos.x + 200,
        star.pos.y - 30,
        60,
        60,
      );
      ctx.restore();
      drawBuild(
        ctx,
        starterLoadout("wasp"),
        star.pos.x + 180,
        star.pos.y + 82,
        -0.3,
        BUILD_FLIGHT_SCALE,
      );
      ctx.restore();
      ctx.fillStyle = COLOR.textMuted;
      ctx.font = canvasFont(12);
      ctx.textAlign = "center";
      ctx.fillText(names[i], i * 347 + 173, 330);
    }
  });
  return () => {
    cancelled = true;
  };
});
</script>
<canvas
  bind:this={canvas}
  aria-label="Three authored rock-planet concepts in identical Practice G7 scenes at 0.9 pixels per world unit, each radius 30 beside the starter Wasp"
></canvas>
<style>
canvas {
  display: block;
  width: 1040px;
  max-width: 100%;
  height: auto;
  aspect-ratio: 1040 / 360;
  border: 1px solid var(--color-border);
}
</style>
