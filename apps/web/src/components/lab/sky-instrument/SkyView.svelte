<script lang="ts">
import { skyTile } from "../../sky-tile";

let {
  url,
  heading = 10,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  travel = 0,
  label,
}: {
  url: string;
  heading?: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  travel?: number;
  label: string;
} = $props();
const tile = $derived(skyTile(scale));
</script>

<div class="viewport" role="img" aria-label={label}>
  <div
    class="plane"
    style:background-image={url ? `url("${url}")` : undefined}
    style:background-size={tile.size}
    style:background-position={tile.position}
    style:transform={`translate(calc(-50% + ${(offsetX - 0.65 * travel) / 10.8}cqh),calc(-50% + ${offsetY / 10.8}cqh)) rotate(${heading}deg)`}
  ></div>
</div>

<style>
.viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  container-type: size;
  background: var(--color-void);
}
.plane {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(100cqw + 260cqh);
  height: calc(100cqw + 260cqh);
  background-repeat: repeat;
  pointer-events: none;
}
</style>
