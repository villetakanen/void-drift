<script lang="ts">
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import {
  type BuildMount,
  buildMounts,
  CHASSIS,
  drawBuild,
  drawNonEngineFitting,
  LoadoutSchema,
  PARTS,
  SLOT_STYLE,
} from "@void-drift/mode-a";
import { onMount } from "svelte";

// Study 02.2 fixture: one Fiddler fitting, drawn by the production builder
// drawing. The corner and the heavy blocked border are this study's.
const build = LoadoutSchema.parse({
  version: 2,
  chassis: "fiddler",
  side: "plasma",
  stabilizers: true,
  hull: ["rail", "light-ion-cannon", "gravity-coil", "battery", null],
  aft: ["ion", "ion"],
});
const mounts = buildMounts(build);
const choices = mounts.filter((mount) => !mount.linkedTo);
const outside = (mount: BuildMount) =>
  !!mount.part && PARTS[mount.part].releaseClass === "preview";

const WIDTH = 520;
const HEIGHT = 740;
const SCALE = 5;
const CX = WIDTH / 2;
const CY = HEIGHT / 2 + 10;
const { width, height, gap } = SLOT_STYLE;
const w = width / 2 + gap;
const h = height / 2 + gap;
const cw = w + 5;
const ch = h + 5;

let { label = "Selected mount" }: { label?: string } = $props();
let selected = $state("left");
let fonts = $state(false);
let canvasOn = $state<HTMLCanvasElement>();
let canvasOff = $state<HTMLCanvasElement>();

onMount(() => {
  loadCanvasFonts().then(() => {
    fonts = true;
  });
});

/** Ship space, as drawBuild sets it. */
function ship(ctx: CanvasRenderingContext2D) {
  ctx.translate(CX, CY);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(SCALE, SCALE);
}
/** The upright slot space drawSlot draws in. */
function slot(ctx: CanvasRenderingContext2D, mount: BuildMount) {
  ship(ctx);
  ctx.translate(mount.x, mount.y);
  ctx.rotate(mount.angle + Math.PI / 2);
  ctx.scale(1 / SLOT_STYLE.referenceScale, 1 / SLOT_STYLE.referenceScale);
}
function paint(ctx: CanvasRenderingContext2D, lime: string) {
  drawBuild(
    ctx,
    build,
    CX,
    CY,
    -Math.PI / 2,
    SCALE,
    selected,
    { dark: COLOR.void, lime, ivory: COLOR.text },
    undefined,
    undefined,
    true,
    // Plan shrinks weapons and utilities into the slot; draw them at flight size.
    (inner, mount) => {
      const fit = Math.min(54 / 7 / mount.height, 64 / 7 / mount.width) * 0.65;
      inner.scale(1 / fit, 1 / fit);
      drawNonEngineFitting(inner, mount);
      return true;
    },
  );
}
function draw(canvas: HTMLCanvasElement, playground: "On" | "Off") {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = WIDTH * dpr;
  canvas.height = HEIGHT * dpr;
  ctx.scale(dpr, dpr);
  const style = getComputedStyle(canvas);
  const red = style.getPropertyValue("--color-red").trim();
  const marked = mounts.filter(outside);
  paint(ctx, COLOR.selected);

  if (playground === "Off") {
    // Forbidden: repaint the marked slots with red where the slot ink is lime.
    ctx.save();
    ctx.beginPath();
    for (const mount of marked) {
      ctx.save();
      slot(ctx, mount);
      ctx.rect(-cw - 4, -ch - 2, 2 * cw + 8, 2 * ch + 4);
      ctx.restore();
    }
    const rear =
      Math.max(CHASSIS[build.chassis].length, ...mounts.map((m) => m.x)) + 8;
    for (const secondary of marked.filter((m) => m.linkedTo)) {
      const primary = mounts.find((m) => m.key === secondary.linkedTo);
      if (!primary) continue;
      ctx.save();
      ship(ctx);
      ctx.rect(primary.x, primary.y - 0.6, rear - primary.x + 0.6, 1.2);
      ctx.rect(secondary.x, secondary.y - 0.6, rear - secondary.x + 0.6, 1.2);
      ctx.rect(rear - 0.6, primary.y, 1.2, secondary.y - primary.y);
      ctx.restore();
    }
    ctx.clip();
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    paint(ctx, red);
    ctx.restore();
    // The blocked border, at the weight of the selection corners.
    for (const mount of marked) {
      ctx.save();
      slot(ctx, mount);
      ctx.strokeStyle = red;
      ctx.lineWidth = 4;
      if (mount.linkedTo) ctx.setLineDash([8, 5]);
      ctx.strokeRect(-w, -h, w * 2, h * 2);
      ctx.restore();
    }
    // Selection stays lime: it is a separate statement from the class.
    const mount = marked.find((m) => m.key === selected && !m.linkedTo);
    if (mount) {
      ctx.save();
      slot(ctx, mount);
      ctx.strokeStyle = COLOR.selected;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        ctx.moveTo(x * (cw - 12), y * ch);
        ctx.lineTo(x * cw, y * ch);
        ctx.lineTo(x * cw, y * (ch - 12));
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // The corner settled in 02.1, in the colour of the slot's border.
  for (const mount of marked) {
    ctx.save();
    slot(ctx, mount);
    ctx.fillStyle = playground === "On" ? COLOR.selected : red;
    ctx.beginPath();
    ctx.moveTo(w, -h);
    ctx.lineTo(w - 20, -h);
    ctx.lineTo(w, -h + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
$effect(() => {
  void fonts;
  void selected;
  if (canvasOn) draw(canvasOn, "On");
  if (canvasOff) draw(canvasOff, "Off");
});
</script>

<div class="bench">
  <label>
    <span>{label}</span>
    <select bind:value={selected}>
      {#each choices as mount}
        <option value={mount.key}>
          {mount.label}: {mount.part ? PARTS[mount.part].name : "Empty"}
        </option>
      {/each}
    </select>
  </label>
  <div class="pair">
    <figure>
      <canvas
        bind:this={canvasOn}
        aria-label="Fiddler in Plan view with Playground on: three slots hold parts outside the scored rules and carry a corner in the border colour"
      ></canvas>
      <figcaption>Playground on · permitted, run unscored</figcaption>
    </figure>
    <figure>
      <canvas
        bind:this={canvasOff}
        aria-label="Fiddler in Plan view with Playground off: the same three slots have a heavy red border and a red corner"
      ></canvas>
      <figcaption>Playground off · these three block launch</figcaption>
    </figure>
  </div>
  <p class="fixture">
    Fixture fitting. Outside the scored rules: Plasma on the blade-root engine
    pair and a Rail gun on the left forward pincer.
  </p>
</div>

<style>
.bench {
  display: grid;
  gap: var(--spacing-md);
  margin-block: var(--spacing-lg);
}
label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font: var(--font-size-caption) var(--font-family-ui);
  color: var(--color-text-muted);
}
select {
  min-height: 44px;
  padding-inline: var(--spacing-sm);
  background: var(--color-void);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  font: inherit;
}
.pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}
figure {
  margin: 0;
  display: grid;
  justify-items: center;
  gap: var(--spacing-sm);
}
canvas {
  width: min(100%, 520px);
  height: auto;
  aspect-ratio: 520 / 740;
  background: var(--color-void);
}
figcaption,
.fixture {
  margin: 0;
  font: var(--font-size-caption) var(--font-family-ui);
  color: var(--color-text-muted);
}
</style>
