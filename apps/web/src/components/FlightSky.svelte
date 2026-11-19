<script lang="ts">
import { SKY_TILE_PERIOD } from "@void-drift/core";
import { type SkySightline, SOL_SKY } from "@void-drift/mode-a";
import { skyTile } from "./sky-tile";

let {
  url,
  cameraX,
  cameraY,
  width,
  sightline = SOL_SKY,
}: {
  url: string;
  cameraX: number;
  cameraY: number;
  width: number;
  sightline?: Readonly<SkySightline>;
} = $props();

const angle = $derived((sightline.heading * Math.PI) / 180);
const cos = $derived(Math.cos(angle));
const sin = $derived(Math.sin(angle));
const period = $derived(SKY_TILE_PERIOD * sightline.scale);
// Reduce translation in the rotated tile's coordinates, preserving the exact
// repeating image while limiting the compositor surface to one period of travel.
const panX = $derived(sightline.offsetX - 0.65 * (cameraX - 960));
const panY = $derived(sightline.offsetY - 0.65 * (cameraY - 540));
const centred = (value: number) => value - Math.round(value / period) * period;
const tileX = $derived(centred(panX * cos + panY * sin));
const tileY = $derived(centred(-panX * sin + panY * cos));
const tile = $derived(skyTile(sightline.scale));
const x = $derived(tileX * cos - tileY * sin);
const y = $derived(tileX * sin + tileY * cos);
const planeWidth = $derived(
  Math.abs(width * cos) + Math.abs(1080 * sin) + period,
);
const planeHeight = $derived(
  Math.abs(width * sin) + Math.abs(1080 * cos) + period,
);
</script>

<div class="sky" aria-hidden="true" data-flight-sky>
  {#if url}
    <div
      class="plane"
      style:width={`${planeWidth / 10.8}cqh`}
      style:height={`${planeHeight / 10.8}cqh`}
      style:background-image={`url("${url}")`}
      style:background-size={tile.size}
      style:background-position={tile.position}
      style:transform={`translate(calc(-50% + ${x / 10.8}cqh), calc(-50% + ${y / 10.8}cqh)) rotate(${sightline.heading}deg)`}
    ></div>
  {/if}
</div>

<style>
.sky {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  container-type: size;
  background: var(--color-void);
  pointer-events: none;
}
.plane {
  position: absolute;
  left: 50%;
  top: 50%;
  background-repeat: repeat;
  will-change: transform;
}
</style>
