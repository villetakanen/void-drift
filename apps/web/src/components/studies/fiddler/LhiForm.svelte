<script lang="ts">
import { COLOR, canvasFont } from "@void-drift/core";
import { drawStabilizerSlits, SLOT_STYLE } from "@void-drift/mode-a";
import Toggle from "../../inputs/Toggle.svelte";
import Drawing from "./Drawing.svelte";
import { FORWARD_MOUNTS, LHI_FORM } from "./lhi-form";

let { label = "LHI form inspection" }: { label?: string } = $props();
let layer = $state("Form");
let drawing: HTMLCanvasElement;
let small: HTMLCanvasElement;

function draw(
  canvas: HTMLCanvasElement,
  scale: number,
  width: number,
  height: number,
  mounts: boolean,
) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  for (const face of LHI_FORM.heavy) {
    ctx.beginPath();
    face.points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = face.color;
    ctx.fill();
  }
  ctx.save();
  ctx.rotate(-Math.PI / 2);
  drawStabilizerSlits(ctx, { x: 39, y: 25.6, fx: 0, fy: 1 });
  drawStabilizerSlits(ctx, { x: -24, y: 31, fx: 0, fy: 1 });
  ctx.restore();
  if (mounts) {
    const w = SLOT_STYLE.width / SLOT_STYLE.referenceScale;
    const h = SLOT_STYLE.height / SLOT_STYLE.referenceScale;
    for (const [x, y] of FORWARD_MOUNTS) {
      ctx.fillStyle = COLOR.void;
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = COLOR.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = canvasFont(4.5, 700);
      ctx.fillText("Q", x, y);
    }
  }
}
$effect(() => {
  if (drawing) draw(drawing, 3.5, 430, 450, layer === "Forward mounts");
  if (small) draw(small, 0.65, 130, 100, false);
});
</script>

<div class="controls">
  <Toggle {label} options={["Form", "Forward mounts"]} bind:value={layer} />
  <p class="caption" aria-live="polite">
    {layer === "Forward mounts"
      ? "Four Q footprints only: two per pincer. Remaining fittings are unresolved."
      : "Same drawing scale, 3.5×. Four stabilizers on the proposal; positions provisional."}
  </p>
</div>

<div class="comparison">
  <figure>
    <figcaption>
      <strong>Reference reading</strong
      ><span>Supplied forms · glass simplified to black</span>
    </figcaption>
    <svg
      viewBox="-61.43 -64.29 122.86 128.58"
      role="img"
      aria-label="Construction reading of the original Fiddler draft, preserving its pincer bends, diagonal roots, swept shoulders, long central cockpit and tapered tail"
    >
      {#each LHI_FORM.draft as face}
        <polygon
          points={face.points.map((p) => p.join(",")).join(" ")}
          fill={face.color}
        />
      {/each}
    </svg>
    <p>
      The pincers change section along their length, flare into swept roots, and
      connect diagonally to the body. The elongated window sits between
      continuous hull cheeks.
    </p>
  </figure>
  <figure>
    <figcaption>
      <strong>02.2 / More volume in the same construction</strong
      ><span>Broader pincer decks · heavier roots · black glass</span>
    </figcaption>
    <canvas
      bind:this={drawing}
      class="large"
      aria-label="Heavier LHI Fiddler proposal with broadened forward pincers, diagonal shoulder roots, a long recessed black cockpit and four stabilizers"
      >Heavier LHI Fiddler form</canvas
    >
    <p>
      Wider blades create equipment-bearing surfaces. Stronger roots carry that
      breadth into the shoulders; the central body keeps its long, tapering
      stance and recessed cockpit.
    </p>
  </figure>
</div>

<div class="reading">
  <div>
    <h4>01 / Pincers with roots</h4>
    <p>
      Follow the widening and change of plane into the swept shoulder. This is
      the relationship lost when 02.1 made the pincers into straight rails.
    </p>
  </div>
  <div>
    <h4>02 / A window within the hull</h4>
    <p>
      The canopy’s pointed ends and long sides follow the surrounding body.
      Shape and framing carry LHI’s window identity; the glass stays black.
    </p>
  </div>
  <div>
    <h4>03 / Weight without a stern slab</h4>
    <p>
      The added volume sits in blades, roots and body cheeks. Thin shoulder fins
      and the tapering tail preserve the reference’s direction and lightness at
      the edges.
    </p>
  </div>
</div>

<div class="family">
  <div>
    <h4>LHI at flight scale</h4>
    <p>
      Current Wasp and the 02.2 proposal at 0.65×, without camera zoom.
      Fiddler’s 180–210 mass range is still a brief, not a result inferred from
      its silhouette.
    </p>
  </div>
  <figure>
    <figcaption>Wasp · current</figcaption>
    <Drawing
      ship="wasp"
      scale={0.65}
      width={130}
      height={100}
      label="Current LHI Wasp at 0.65×"
    />
  </figure>
  <figure>
    <figcaption>Fiddler · 02.2</figcaption>
    <canvas
      bind:this={small}
      class="small"
      aria-label="LHI Fiddler 02.2 at 0.65×"
      >Fiddler at flight scale</canvas
    >
  </figure>
</div>

<style>
.comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-xl);
}
figure {
  margin: 0;
}
figcaption {
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
}
.comparison figcaption {
  min-height: 5em;
}
figcaption strong,
figcaption span {
  display: block;
}
figcaption span,
.caption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
figcaption span {
  margin-top: var(--spacing-sm);
}
svg,
.large {
  display: block;
  width: 430px;
  max-width: 100%;
  aspect-ratio: 430 / 450;
  margin: var(--spacing-lg) auto;
}
canvas {
  height: auto;
}
.small {
  display: block;
  width: 130px;
  height: 100px;
}
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg) var(--spacing-xl);
}
.caption {
  max-width: 48ch;
}
.reading {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  padding-block: var(--spacing-lg);
}
h4 {
  font-size: var(--font-size-body);
  margin-block: 0 var(--spacing-sm);
}
.reading p,
.comparison p,
.family p {
  font-size: var(--font-size-body);
}
.family {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px 150px;
  align-items: center;
  gap: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  padding-block: var(--spacing-lg);
}
@media (max-width: 750px) {
  .comparison,
  .reading,
  .family {
    grid-template-columns: 1fr;
  }
  .family figure {
    display: grid;
    grid-template-columns: 1fr 130px;
    align-items: center;
  }
}
</style>
