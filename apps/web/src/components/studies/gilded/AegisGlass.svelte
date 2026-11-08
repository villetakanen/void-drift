<script lang="ts">
import { drawAegisGlass, drawBuild, starterLoadout } from "@void-drift/mode-a";

let { label = "Aegis approved visor" }: { label?: string } = $props();
let canvas = $state<HTMLCanvasElement>();
let gradientAngle = $state(-79);
let reflectionAngle = $state(-39);
let tint = $state("blue");
let strength = $state(32);
const colours: Record<string, string> = {
  blue: "#427fe0",
  purple: "#9360d6",
  dark: "#03070c",
};
$effect(() => {
  const target = canvas;
  const ga = gradientAngle,
    ra = reflectionAngle,
    colour = colours[tint] ?? colours.blue,
    opacity = strength / 100;
  if (!target) return;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  target.width = 420 * dpr;
  target.height = 570 * dpr;
  ctx.scale(dpr, dpr);
  const build = starterLoadout("fighter");
  for (const [y, scale] of [
    [240, 3],
    [435, 0.65],
  ] as const) {
    drawBuild(
      ctx,
      build,
      210,
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
    ctx.translate(210, y);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(scale, scale);
    drawAegisGlass(ctx, ga, ra, colour, opacity);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(210, 515);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(5, 5);
  ctx.translate(-17.5, 0);
  drawAegisGlass(ctx, ga, ra, colour, opacity);
  ctx.restore();
});
</script>
<div class="controls">
  <label for="aegis-gradient">Gradient direction · {gradientAngle}°</label>
  <input
    id="aegis-gradient"
    type="range"
    min="-180"
    max="180"
    step="1"
    bind:value={gradientAngle}
  >
  <label for="aegis-reflection"
    >Reflection direction · {reflectionAngle}°</label
  >
  <input
    id="aegis-reflection"
    type="range"
    min="-180"
    max="180"
    step="1"
    bind:value={reflectionAngle}
  >
  <label for="aegis-colour">Reflection colour</label>
  <select id="aegis-colour" bind:value={tint}>
    <option value="blue">Blue</option>
    <option value="purple">Purple</option>
    <option value="dark">Space dark</option>
  </select>
  <label for="aegis-strength">Reflection opacity · {strength}%</label>
  <input
    id="aegis-strength"
    type="range"
    min="0"
    max="100"
    step="1"
    bind:value={strength}
  >
  <button
    type="button"
    onclick={() => {
      gradientAngle = -79;
      reflectionAngle = -39;
      tint = "blue";
      strength = 32;
    }}
  >
    Reset exploration
  </button>
</div>
<canvas bind:this={canvas} aria-label={label}></canvas>
<p>
  Top: 3× inspection. Middle: 0.65 flight scale. Bottom: canopy detail. The gold
  perimeter stays fixed. Colour changes only the crisp reflection; the
  underlying green–space–gold gradient stays intact. Settings reset on reload.
</p>
<style>
.controls {
  display: grid;
  gap: var(--spacing-sm);
  max-width: 420px;
}
input[type="range"] {
  width: 100%;
  accent-color: var(--color-action);
}
select,
button {
  padding: var(--spacing-sm);
  background: var(--color-void);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
canvas {
  display: block;
  width: 420px;
  height: 570px;
  max-width: 100%;
  object-fit: contain;
}
p {
  color: var(--color-text-muted);
}
</style>
