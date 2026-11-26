<script lang="ts">
import {
  defaultLoadout,
  drawBuild,
  drawDroneLauncher,
  drawPlasmaRifle,
  type Loadout,
  PARTS,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import PartDrawing from "../hangar/PartDrawing.svelte";

let { master, id }: { master: string; id: "plasma-rifle" | "drone-launcher" } =
  $props();
function specimens(id: "plasma-rifle" | "drone-launcher") {
  const fittings: { label: string; build: Loadout }[] = [
    "wasp",
    "scout",
    "fighter",
    "corvette",
    "fiddler",
  ].map((chassis) => {
    const build = defaultLoadout(chassis as Loadout["chassis"]);
    build.hull[0] = id;
    return { label: chassis, build };
  });
  const rear = defaultLoadout("fighter");
  rear.aft[0] = id;
  fittings.push({ label: "fighter rear", build: rear });
  return fittings;
}
const fittings = $derived(specimens(id));
let isolated: HTMLCanvasElement;
const canvases: HTMLCanvasElement[] = [];
onMount(() => {
  const ctx = isolated.getContext("2d");
  if (ctx) {
    const launcher = id === "drone-launcher";
    ctx.translate(160, launcher ? 360 * 0.68 : 234);
    ctx.rotate(-Math.PI / 2);
    const scale = launcher ? 360 / 17 : 10.9697608125;
    ctx.scale(scale, scale);
    if (id === "drone-launcher") drawDroneLauncher(ctx, 1);
    else drawPlasmaRifle(ctx, 1);
  }
  fittings.forEach(({ build }, index) => {
    const ctx = canvases[index]?.getContext("2d");
    if (ctx) drawBuild(ctx, build, 210, 220, -Math.PI / 2, 3);
  });
});
</script>

<h2>{PARTS[id].name}</h2>
<p>
  {#if id === "plasma-rifle"}
    Unlit World artwork. Housing centred on the slot; mass 24.3. No firing or
    LFX.
  {:else}
    The rail is 17 units long. Its mount sits 68% of the way back from the
    muzzle.
  {/if}
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
    <div class="card"><PartDrawing {id} /></div>
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
