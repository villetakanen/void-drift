<script lang="ts">
import {
  drawBuild,
  drawLhiGlass,
  FIDDLER,
  starterLoadout,
  WASP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";

let { family = false }: { family?: boolean } = $props();
let canvas: HTMLCanvasElement;
onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 800 * dpr;
  canvas.height = 570 * dpr;
  ctx.scale(dpr, dpr);

  for (const [i, variant] of [false, true].entries()) {
    const offset = family || variant;
    const ship = family && i === 1 ? "fiddler" : "wasp";
    const build = starterLoadout(ship);
    const x = 200 + i * 400;
    ctx.fillStyle = "#c8d2dc";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      family
        ? ship === "wasp"
          ? "Wasp / B"
          : "Fiddler / B"
        : offset
          ? "B / Reflection steps at ridge"
          : "A / Reflection meets at ridge",
      x,
      25,
    );
    for (const [y, scale] of [
      [220, family ? 2 : 4],
      [430, 0.65],
    ] as const) {
      drawBuild(
        ctx,
        build,
        x,
        y,
        -Math.PI / 2,
        scale,
        "",
        undefined,
        undefined,
        undefined,
        false,
      );
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(scale, scale);
      drawLhiGlass(ctx, offset, ship);
      ctx.restore();
    }
    // Isolated close view keeps the pane junction inspectable.
    ctx.save();
    ctx.translate(x, 510);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(5, 5);
    const glassPoints =
      ship === "wasp"
        ? WASP.facets.slice(-2).flatMap((p) => p.points)
        : FIDDLER.facets[FIDDLER.facets.length - 1].points;
    ctx.translate(
      -(
        Math.max(...glassPoints.map((p) => p[0])) +
        Math.min(...glassPoints.map((p) => p[0]))
      ) / 2,
      0,
    );
    drawLhiGlass(ctx, offset, ship);
    ctx.restore();
  }
});
</script>
<div class="comparison">
  <canvas
    bind:this={canvas}
    aria-label={family
      ? "Wasp and Fiddler with selected offset reflection B"
      : "Wasp comparison: connected and offset reflections"}
  ></canvas>
</div>
<p>
  Top: {family ? "2×" : "4×"} ship view. Middle: 0.65 flight scale. Bottom:
  isolated canopy detail. Both use the same glass colours, thin gold perimeter
  and darker right pane.
  {family
    ? "Both ships use selected treatment B."
    : "Only the reflection’s alignment changes."}
</p>
<style>
.comparison {
  overflow-x: auto;
}
canvas {
  display: block;
  width: 800px;
  height: 570px;
  max-width: none;
}
p {
  color: var(--color-text-muted);
}
</style>
