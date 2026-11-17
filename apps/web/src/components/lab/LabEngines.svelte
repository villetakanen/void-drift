<script lang="ts">
import "./catalog.css";
import { paintBeam } from "@void-drift/core";
import {
  defaultLoadout,
  drawBuild,
  drawTestingMarking,
  ENGINE_ART,
  ENGINE_MARKINGS,
  type EngineFace,
  EngineIdSchema,
  PARTS,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import PartDrawing from "../hangar/PartDrawing.svelte";

/** Each engine's SVG master, keyed by part id. */
let { masters }: { masters: Record<string, string> } = $props();

const engines = EngineIdSchema.options;
const withMaster = engines.filter((id) => masters[id]);
const POSES = [
  [0, "Catalog"],
  [1, "Side lighting, left mount"],
  [2, "Side lighting, right mount"],
  [3, "Aft lighting"],
] as const;
const canvases: Record<string, HTMLCanvasElement> = {};

function fill(ctx: CanvasRenderingContext2D, faces: readonly EngineFace[]) {
  for (const face of faces) {
    ctx.fillStyle = face.color;
    ctx.beginPath();
    for (const [i, [x, y]] of face.points.entries())
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    ctx.closePath();
    ctx.fill();
  }
}

/** Draw in part units, nose up, centred on the canvas. */
function frame(canvas: HTMLCanvasElement, scale: number, dy = 0) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("The engines page requires Canvas 2D");
  const ratio = devicePixelRatio;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.scale(ratio, ratio);
  ctx.translate(canvas.clientWidth / 2, canvas.clientHeight / 2 + dy);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(scale, scale);
  return ctx;
}

function drawPose(id: string, pose: number, ctx: CanvasRenderingContext2D) {
  fill(ctx, ENGINE_ART[id][pose]);
  const marking = ENGINE_MARKINGS[id];
  if (PARTS[id as keyof typeof PARTS].testingOnly && marking)
    drawTestingMarking(ctx, marking);
}

onMount(() => {
  for (const id of withMaster) {
    for (const [pose] of POSES)
      drawPose(id, pose, frame(canvases[`${id}-${pose}`], 12));
    // The plume at full output, from the nozzle the art draws.
    const plume = frame(canvases[`${id}-plume`], 6, -80);
    const nozzle = Math.min(
      ...ENGINE_ART[id][0].flatMap((face) => face.points.map((p) => p[0])),
    );
    plume.save();
    plume.translate(nozzle, 0);
    plume.globalCompositeOperation = "lighter";
    paintBeam(plume, 1, PARTS[id as keyof typeof PARTS].ion?.beam);
    plume.restore();
    drawPose(id, 3, plume);
    // The part on the starter ship at Hangar scale, at its mount point.
    const ship = defaultLoadout("wasp");
    ship.side = id;
    const shipCanvas = canvases[`${id}-ship`];
    const ctx = shipCanvas.getContext("2d");
    if (!ctx) continue;
    const ratio = devicePixelRatio;
    shipCanvas.width = shipCanvas.clientWidth * ratio;
    shipCanvas.height = shipCanvas.clientHeight * ratio;
    ctx.scale(ratio, ratio);
    drawBuild(
      ctx,
      ship,
      shipCanvas.clientWidth / 2,
      shipCanvas.clientHeight / 2,
      -Math.PI / 2,
      5,
    );
  }
});
</script>

<section class="catalog" aria-label="Engine artwork">
  <section>
    <h2>Engines</h2>
    <p>
      Each engine's art has an SVG master, the faces the game draws in four
      poses converted from it, and this page showing both. A parity test keeps
      the converted faces equal to the master. Engines without a master keep
      their current art until it next changes.
    </p>
    <table>
      <thead>
        <tr>
          <th>Engine</th>
          <th>Id</th>
          <th>SVG master</th>
          <th>Testing only</th>
        </tr>
      </thead>
      <tbody>
        {#each engines as id}
          <tr>
            <td>{PARTS[id].name}</td>
            <td><code>{id}</code></td>
            <td>{masters[id] ? "Yes" : "None yet"}</td>
            <td>{PARTS[id].testingOnly ? "Yes" : "No"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  {#each withMaster as id}
    <section>
      <h2>{PARTS[id].name}</h2>
      <p>
        Master: <code>packages/mode-a/src/lib/art/engines/{id}.svg</code>. Mount
        point {PARTS[id].mount} u along its slot.
        {#if PARTS[id].testingOnly}
          It carries the testing-only marking.
        {/if}
      </p>
      <div class="engine-row">
        <figure>
          <div class="master">{@html masters[id]}</div>
          <figcaption>SVG master: poses 0 to 3, top to bottom</figcaption>
        </figure>
        {#each POSES as [pose, label]}
          <figure>
            <canvas class="pose" bind:this={canvases[`${id}-${pose}`]}></canvas>
            <figcaption>Pose {pose}: {label}</figcaption>
          </figure>
        {/each}
        <figure>
          <canvas class="plume" bind:this={canvases[`${id}-plume`]}></canvas>
          <figcaption>Plume at full output</figcaption>
        </figure>
        <figure>
          <div class="card"><PartDrawing {id} /></div>
          <figcaption>Hangar card drawing</figcaption>
        </figure>
        <figure>
          <canvas class="ship" bind:this={canvases[`${id}-ship`]}></canvas>
          <figcaption>On the Wasp at Hangar scale</figcaption>
        </figure>
      </div>
    </section>
  {/each}
</section>

<style>
.engine-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: flex-end;
}
figure {
  margin: 0;
  display: grid;
  gap: var(--spacing-sm);
  justify-items: center;
}
figcaption {
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
}
canvas,
.master {
  background: var(--color-void);
}
.master {
  width: 120px;
}
.master :global(svg) {
  display: block;
  width: 100%;
  height: auto;
}
.card {
  width: 120px;
  height: 120px;
  background: var(--color-void);
}
.card :global(svg) {
  width: 100%;
  height: 100%;
}
.pose {
  width: 120px;
  height: 200px;
}
.plume {
  width: 120px;
  height: 480px;
}
.ship {
  width: 240px;
  height: 320px;
}
</style>
