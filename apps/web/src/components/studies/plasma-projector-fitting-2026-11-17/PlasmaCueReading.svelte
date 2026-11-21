<script lang="ts">
import { COLOR } from "@void-drift/core";
import { onMount } from "svelte";
import { drawForm, drawInspection } from "./form";

let canvas: HTMLCanvasElement;
onMount(() => {
  const draw = () => {
    const w = canvas.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(300 * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const label = (text: string, x: number, y: number) => {
      ctx.fillStyle = COLOR.textMuted;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, x, y);
    };
    const fitting = (
      x: number,
      y: number,
      scale: number,
      light: "Dark" | "Loading",
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(scale, scale);
      drawForm(ctx, "Rail shroud");
      drawInspection(ctx, { form: "Rail shroud", light, anchors: false });
      ctx.restore();
    };
    const x1 = w / 6,
      x2 = w / 2,
      x3 = (w * 5) / 6;
    label("02.3 · Dark", x1, 24);
    label("02.3 · Loading", x2, 24);
    fitting(x1, 175, 8, "Dark");
    fitting(x2, 175, 8, "Loading");
    label("8 px/u", x1, 274);
    label("8 px/u", x2, 274);
    label("Dark / Loading", x3, 24);
    fitting(x3 - 32, 104, 3, "Dark");
    fitting(x3 + 32, 104, 3, "Loading");
    label("3 px/u", x3, 151);
    fitting(x3 - 24, 201, 1, "Dark");
    fitting(x3 + 24, 201, 1, "Loading");
    label("Exactly 1 CSS px/u", x3, 238);
    label("Same geometry at every size", x3, 274);
  };
  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  draw();
  return () => observer.disconnect();
});
</script>

<figure class="cue-reading">
  <canvas
    bind:this={canvas}
    aria-label="The unchanged 02.3 rail shroud, dark and loading at 8, 3 and exactly 1 CSS pixel per world unit"
  ></canvas>
  <figcaption>
    The retained 02.3 geometry, isolated from the ship for this reading. The
    loading strip is 3.3 × 0.9 u; each dark shoulder cut is 0.6 × 1.3 u. At 1
    CSS px/u, their narrow dimensions occupy less than one pixel. The broad pale
    housing and long dark centre occupy much more of the image.
  </figcaption>
</figure>

<style>
figure {
  margin-block: var(--spacing-lg);
}
canvas {
  display: block;
  width: 100%;
  height: 300px;
  border-block: 1px solid var(--color-border);
}
figcaption {
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
}
</style>
