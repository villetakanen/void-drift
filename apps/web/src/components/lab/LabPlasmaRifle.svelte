<script lang="ts">
import {
  defaultLoadout,
  drawBuild,
  drawPlasmaRifle,
  type Loadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import PartDrawing from "../hangar/PartDrawing.svelte";

let { master }: { master: string } = $props();
const fittings: { label: string; build: Loadout }[] = [
  "wasp",
  "scout",
  "fighter",
  "corvette",
  "fiddler",
].map((id) => {
  const build = defaultLoadout(id as Loadout["chassis"]);
  build.hull[0] = "plasma-rifle";
  return { label: id, build };
});
const rear = defaultLoadout("fighter");
rear.aft[0] = "plasma-rifle";
fittings.push({ label: "fighter rear", build: rear });
let isolated: HTMLCanvasElement;
const canvases: HTMLCanvasElement[] = [];
onMount(() => {
  const ctx = isolated.getContext("2d");
  if (ctx) {
    ctx.translate(160, 234);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(10.9697608125, 10.9697608125);
    drawPlasmaRifle(ctx, 1);
  }
  fittings.forEach(({ build }, index) => {
    const ctx = canvases[index]?.getContext("2d");
    if (ctx) drawBuild(ctx, build, 210, 220, -Math.PI / 2, 3);
  });
});
</script>

<h2>Plasma rifle</h2>
<p>
  Unlit World artwork. Housing centred on the slot; mass 24.3. No firing or LFX.
</p>
<div class="references">
  <figure>
    <div class="master">{@html master}</div>
    <figcaption>SVG master</figcaption>
  </figure>
  <figure>
    <canvas bind:this={isolated} width="320" height="360"></canvas>
    <figcaption>Derived Canvas paths</figcaption>
  </figure>
  <figure>
    <div class="card"><PartDrawing id="plasma-rifle" /></div>
    <figcaption>Shared catalog artwork</figcaption>
  </figure>
</div>
<div class="fittings">
  {#each fittings as fitting, index}
    <figure>
      <canvas bind:this={canvases[index]} width="420" height="420"></canvas>
      <figcaption>{fitting.label} · production hull layering</figcaption>
    </figure>
  {/each}
</div>

<style>
.references {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.fittings {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}
figure {
  margin: 0;
  text-align: center;
}
.master,
.card {
  height: 360px;
}
.master :global(svg),
.card :global(svg) {
  height: 100%;
  width: 100%;
}
canvas {
  max-width: 100%;
}
</style>
