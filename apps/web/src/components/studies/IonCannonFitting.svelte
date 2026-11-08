<script lang="ts">
import { COLOR } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  buildMounts,
  drawBuild,
  LoadoutSchema,
  type ShipProfileId,
  slotAccepts,
  starterLoadout,
} from "@void-drift/mode-a";

let { label = "Production cannon fitting" }: { label?: string } = $props();

import { onMount } from "svelte";
import "@void-drift/core/styles/buttons.css";

const ships: ShipProfileId[] = [
  "scout",
  "wasp",
  "fighter",
  "corvette",
  "fiddler",
];
let ship = $state<ShipProfileId>("wasp");
let selected = $state("hull-0");

let pair = $state(false);
let plan = $state(false);
let canvas: HTMLCanvasElement;
let render = () => {};
const mounts = $derived(
  buildMounts(starterLoadout(ship)).filter(
    (m) => m.group === "hull" && slotAccepts(m.type, "G"),
  ),
);
function choose(id: ShipProfileId) {
  ship = id;
  selected =
    buildMounts(starterLoadout(id)).find(
      (m) => m.group === "hull" && slotAccepts(m.type, "G"),
    )?.key ?? "";
}
onMount(() => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  render = () => {
    ctx.clearRect(0, 0, 1080, 660);
    const build = starterLoadout(ship);
    const candidates = buildMounts(build);
    const anchor = candidates.find((m) => m.key === selected);
    const fitted = new Set([selected]);
    if (pair && anchor) {
      const mirror = candidates.find(
        (m) =>
          m.key !== selected &&
          m.group === "hull" &&
          slotAccepts(m.type, "G") &&
          Math.abs(m.x - anchor.x) < 0.1 &&
          Math.abs(m.y + anchor.y) < 0.1,
      );
      if (mirror) fitted.add(mirror.key);
    }
    build.hull.fill(null);
    for (const key of fitted) {
      const mount = candidates.find((m) => m.key === key);
      if (mount?.group === "hull") build.hull[mount.index] = "light-ion-cannon";
    }
    LoadoutSchema.parse(build);
    const palette = plan
      ? { dark: COLOR.void, lime: COLOR.selected, ivory: COLOR.text }
      : undefined;
    drawBuild(
      ctx,
      build,
      370,
      325,
      -Math.PI / 2,
      3.6,
      selected,
      palette,
      undefined,
      undefined,
      true,
    );
    ctx.fillStyle = COLOR.textMuted;
    ctx.font = "14px monospace";
    ctx.fillText(
      plan
        ? "Builder Plan · shared slot rendering"
        : "Builder Preview · actual hull occlusion",
      24,
      28,
    );
    ctx.fillText("Flight · 1 px/unit", 780, 28);
    drawBuild(
      ctx,
      build,
      900,
      210,
      -Math.PI / 2,
      BUILD_FLIGHT_SCALE,
      "",
      undefined,
      undefined,
      undefined,
      true,
    );
    ctx.fillText("Flight · enlarged ×3", 780, 300);
    drawBuild(
      ctx,
      build,
      900,
      470,
      -Math.PI / 2,
      BUILD_FLIGHT_SCALE * 3,
      "",
      undefined,
      undefined,
      undefined,
      true,
    );
  };
  render();
});
$effect(() => {
  void ship;
  void selected;
  void pair;
  void plan;
  render();
});
</script>
<div class="controls">
  {#each ships as id}
    <button
      type="button"
      class="btn"
      aria-pressed={ship === id}
      onclick={() => choose(id)}
    >
      {id}
    </button>
  {/each}
</div>
<div class="controls">
  <label
    >Mount
    <select bind:value={selected}>
      {#each mounts as mount}
        <option value={mount.key}>{mount.label}</option>
      {/each}
    </select></label
  >
  <label
    ><input type="checkbox" bind:checked={pair}>
    Mirror where supported</label
  >
  <label><input type="checkbox" bind:checked={plan}> Builder Plan</label>
</div>
<canvas
  width="1080"
  height="660"
  bind:this={canvas}
  aria-label={label}
></canvas>
<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
  margin-block: var(--spacing-md);
  font-family: var(--font-family-ui);
}
label {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}
select {
  background: var(--color-elev-1);
  color: var(--color-text);
  padding: var(--spacing-sm);
}
canvas {
  display: block;
  width: 100%;
  background: var(--color-void);
}
</style>
