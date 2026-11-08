<script lang="ts">
import { stabilizerGeometry } from "./rotation-bench";

let { back, inset, angle }: { back: number; inset: number; angle: number } =
  $props();
const geometry = $derived(stabilizerGeometry(back, inset, angle));
const hull = $derived(geometry.hull.map(([x, y]) => `${y},${-x}`).join(" "));
</script>
<div class="geometry">
  <svg
    viewBox="-65 -80 130 140"
    role="img"
    aria-label="Fighter stabilizer position and thrust-direction preview"
  >
    <polygon points={hull} fill="#264d6b" stroke="#83c7d0" stroke-width="0.7" />
    <line
      x1="0"
      x2="0"
      y1="-65"
      y2="35"
      stroke="#83c7d0"
      stroke-dasharray="2 2"
      stroke-width="0.4"
    />
    <circle cx="0" cy="0" r="1.5" fill="white" />
    <text x="3" y="4">rotation origin</text>
    <text x="0" y="-70" text-anchor="middle">NOSE / FORWARD ↑</text>
    {#each [-1, 1] as side}
      {@const px = side * geometry.y}
      {@const py = -geometry.x}
      {@const dx = -side * geometry.fy}
      {@const dy = -geometry.fx}
      <g transform={`translate(${px},${py})`}>
        <circle r="2" fill={side === -1 ? "#ffbd69" : "#c49bff"} />
        <line
          x1="0"
          y1="0"
          x2={dx * 24}
          y2={dy * 24}
          stroke={side === -1 ? "#ffbd69" : "#c49bff"}
          stroke-width="1.2"
        />
        <path
          d={`M ${dx * 24} ${dy * 24} l ${-dx * 4 - dy * 2} ${-dy * 4 + dx * 2} M ${dx * 24} ${dy * 24} l ${-dx * 4 + dy * 2} ${-dy * 4 - dx * 2}`}
          stroke={side === -1 ? "#ffbd69" : "#c49bff"}
          fill="none"
          stroke-width="1.2"
        />
        <line
          x1="0"
          y1="0"
          x2={-dx * 10}
          y2={-dy * 10}
          stroke="#a3a7b7"
          stroke-dasharray="1 1"
          stroke-width="0.7"
        />
      </g>
    {/each}
  </svg>
  <div>
    <p>
      <strong>Arrows show force on the ship.</strong>
      Short dotted lines show exhaust direction. Both mounts move symmetrically;
      each engine stays at 0.25 Light strength.
    </p>
    <p>
      Back from nose: {back.toFixed(0)}%. Across hull: {inset.toFixed(0)}% /
      {(100 - inset).toFixed(0)}%. Angle: {angle.toFixed(1)}° outward from
      forward.
    </p>
    <p>
      Turning lever: {Math.abs(geometry.lever).toFixed(2)} units.
      {Math.abs(geometry.lever) < 0.1
        ? "Almost no turning leverage: force points near the rotation origin."
        : `Left engine produces ${geometry.lever > 0 ? "clockwise" : "counterclockwise"} torque; right produces the opposite.`}
    </p>
    <p>
      This previews the controls. Apply &amp; restart updates the paths.
      Positions outside the hull are allowed for exploration.
    </p>
  </div>
</div>
<style>
.geometry {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 1fr;
  gap: var(--spacing-md);
  align-items: center;
  margin-block: var(--spacing-md);
}
svg {
  width: 100%;
  max-height: 350px;
}
text {
  fill: var(--color-text);
  font-size: 4px;
}
p {
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
}
@media (max-width: 650px) {
  .geometry {
    grid-template-columns: 1fr;
  }
}
</style>
