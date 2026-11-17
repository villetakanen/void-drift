<script lang="ts">
import { COLOR } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  buildMounts,
  drawBuild,
  drawNonEngineFitting,
  ENGINE_ART,
  starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import Toggle from "../../inputs/Toggle.svelte";
import { drawForm, drawInspection, fittingPainter, REFERENCE } from "./form";

let { label = "Rail-shrouded plasma fitting" }: { label?: string } = $props();
let view = $state("Preview");
let layer = $state("Under hull");
let side = $state("Left");
let anchors = $state("Off");
const forms = [
  {
    id: "Rail shroud" as const,
    light: "Dark" as const,
    caption:
      "The pale receiver, dark emitter and angled power pack remain distinct while idle.",
  },
  {
    id: "Rail shroud" as const,
    light: "Loading" as const,
    caption:
      "The recessed core lights within the guide edges. No luminous casing is needed.",
  },
  {
    id: "Rail shroud" as const,
    light: "Vents" as const,
    caption:
      "Three slots in each shoulder expose the core; the two forward cuts supply the exhaust roots.",
  },
];
const canvases: HTMLCanvasElement[] = [];
let references: HTMLCanvasElement;
let redraw = () => {};
function context(canvas: HTMLCanvasElement, height: number) {
  const w = canvas.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  return { ctx, w };
}
function caption(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) {
  ctx.fillStyle = COLOR.textMuted;
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}
onMount(() => {
  redraw = () => {
    forms.forEach((form, i) => {
      const frame = context(canvases[i], 480);
      if (!frame) return;
      const { ctx, w } = frame;
      caption(ctx, "Construction · 7 px/u", w / 2, 24);
      ctx.save();
      ctx.translate(w / 2, 151);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(7, 7);
      drawForm(ctx, form.id);
      drawInspection(ctx, {
        form: form.id,
        light: form.light,
        anchors: anchors === "On",
      });
      ctx.restore();
      const build = starterLoadout("wasp");
      build.side = "plasma";
      build.hull.fill(null);
      const index = side === "Left" ? 0 : 1,
        key = `hull-${index}`;
      build.hull[index] = "battery"; // An inert carrier; no proposed weapon stats.
      const mounts = buildMounts(build).map((m) =>
        m.key === key && layer === "Exposed" ? { ...m, underHull: false } : m,
      );
      const palette =
        view === "Plan"
          ? { dark: COLOR.void, lime: COLOR.selected, ivory: COLOR.text }
          : undefined;
      caption(ctx, `${view} · ${layer.toLowerCase()} · 4 px/u`, w / 2, 218);
      drawBuild(
        ctx,
        build,
        w / 2,
        310,
        -Math.PI / 2,
        BUILD_FLIGHT_SCALE * 4,
        key,
        palette,
        mounts,
        undefined,
        true,
        fittingPainter(form.id, key, {
          form: form.id,
          light: form.light,
          anchors: false,
        }),
      );
      caption(ctx, "Flight scale · exactly 1 CSS px/u", w / 2, 425);
      drawBuild(
        ctx,
        build,
        w / 2,
        454,
        -Math.PI / 2,
        BUILD_FLIGHT_SCALE,
        "",
        undefined,
        mounts,
        undefined,
        true,
        fittingPainter(form.id, key, {
          form: form.id,
          light: form.light,
          anchors: false,
        }),
      );
    });
    const frame = context(references, 145);
    if (!frame) return;
    const { ctx, w } = frame;
    const build = starterLoadout("wasp");
    build.hull = ["light-ion-cannon", "ion-point-defence"];
    const mounts = buildMounts(build);
    for (let i = 0; i < 3; i++) {
      const x = ((i + 0.5) * w) / 3;
      ctx.save();
      ctx.translate(x, 75);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(5 * BUILD_FLIGHT_SCALE, 5 * BUILD_FLIGHT_SCALE);
      if (i === 0) {
        for (const face of ENGINE_ART.plasma[3]) {
          ctx.fillStyle =
            face.color === "currentColor" ? "#ffb52e" : face.color;
          ctx.beginPath();
          face.points.forEach(([px, py], j) => {
            if (j) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
          });
          ctx.closePath();
          ctx.fill();
        }
      } else drawNonEngineFitting(ctx, mounts[i - 1]);
      ctx.restore();
      caption(
        ctx,
        ["Production plasma engine", "Light Ion Cannon", "Ion Point Defence"][
          i
        ],
        x,
        133,
      );
    }
  };
  const observer = new ResizeObserver(redraw);
  for (const canvas of [...canvases, references]) observer.observe(canvas);
  redraw();
  return () => observer.disconnect();
});
$effect(() => {
  void view;
  void layer;
  void side;
  void anchors;
  redraw();
});
</script>

<section class="bench" aria-label={label}>
  <div class="controls">
    <Toggle
      label="Fitting view"
      options={["Preview", "Plan"]}
      bind:value={view}
    />
    <Toggle label="Mount side" options={["Left", "Right"]} bind:value={side} />
    <Toggle
      label="Fitting exposure"
      options={["Under hull", "Exposed"]}
      bind:value={layer}
    />
    <span
      >Anchors
      <Toggle
        label="Construction anchors"
        options={["Off", "On"]}
        bind:value={anchors}
      /></span
    >
  </div>
  <p class="caption">
    Exposed lifts only the study artwork above the Wasp. The slot stays in
    place. Plan uses the shared slot drawing; construction shows the complete
    object.
  </p>
  <div class="forms">
    {#each forms as form, index}
      <div class="form">
        <h3>{form.light}</h3>
        <p class="size">{REFERENCE.length} × {REFERENCE.width} u</p>
        <canvas
          bind:this={canvases[index]}
          aria-label={`${form.light}: rail shroud construction, fitted Wasp and flight scale`}
        ></canvas>
        <p>{form.caption}</p>
      </div>
    {/each}
  </div>
  <p class="caption">
    Current production references · all at 5 px/u · real artwork, different
    equipment roles.
  </p>
  <canvas
    class="references"
    bind:this={references}
    aria-label="Production plasma engine, Light Ion Cannon and Ion Point Defence at the same scale"
  ></canvas>
</section>

<style>
.bench {
  margin-block: var(--spacing-lg);
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
}
.controls span {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.caption,
.size {
  color: var(--color-text-muted);
  font-family: var(--font-family-ui);
  font-size: var(--font-size-caption);
}
.forms {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
}
.form {
  min-width: 0;
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}
.form h3 {
  margin: 0;
}
.form p {
  margin-block: var(--spacing-sm);
}
canvas {
  display: block;
  width: 100%;
  height: 480px;
  background: var(--color-void);
}
.references {
  height: 145px;
  border-block: 1px solid var(--color-border);
}
</style>
