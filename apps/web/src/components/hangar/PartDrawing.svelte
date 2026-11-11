<script lang="ts">
// Shared catalog drawing. Parts without artwork render nothing.
import {
  ENGINE_ACCENT,
  ENGINE_ART,
  engineArtId,
  ION_CANNON_ART,
  PARTS,
  type PartId,
  POINT_DEFENCE_BASE,
  POINT_DEFENCE_GEOMETRY,
  POINT_DEFENCE_TURRET,
  POTENTIAL_WELL_ART,
  UTILITY_ART,
} from "@void-drift/mode-a";

let { id }: { id: PartId } = $props();
const uid = $props.id();
const part = $derived(PARTS[id]);
</script>

{#if part.category === "E"}
  <svg
    aria-hidden="true"
    viewBox="-18 -20 36 40"
    style:color={part.id === "fusion"
      ? ENGINE_ACCENT.fusion
      : part.id === "plasma"
        ? ENGINE_ACCENT.plasma
        : ENGINE_ACCENT.ion}
  >
    <g transform="rotate(-90)">
      {#each ENGINE_ART[engineArtId(part.id)][0] as face}
        <polygon
          points={face.points.map((p) => p.join(",")).join(" ")}
          fill={face.color}
        />
      {/each}
    </g>
  </svg>
{:else if part.id === "light-ion-cannon"}
  <svg aria-hidden="true" viewBox="240 40 14 22">
    {#each ION_CANNON_ART as [color, path]}
      <path d={path} fill={color} />
    {/each}
  </svg>
{:else if part.id === "ion-point-defence"}
  <svg
    aria-hidden="true"
    viewBox="{POINT_DEFENCE_GEOMETRY.centreX - 7} 90.3 14 22"
  >
    <defs>
      {#each POINT_DEFENCE_BASE as disc, index}
        <linearGradient
          id="{uid}-pd-{index}"
          gradientUnits="userSpaceOnUse"
          x1={disc.from[0]}
          y1={disc.from[1]}
          x2={disc.to[0]}
          y2={disc.to[1]}
        >
          <stop offset="0" stop-color={disc.stops[0]} />
          <stop offset="1" stop-color={disc.stops[1]} />
        </linearGradient>
      {/each}
    </defs>
    {#each POINT_DEFENCE_BASE as disc, index}
      <circle
        cx={POINT_DEFENCE_GEOMETRY.centreX}
        cy={POINT_DEFENCE_GEOMETRY.centreY}
        r={disc.radius}
        fill="url(#{uid}-pd-{index})"
      />
    {/each}
    {#each POINT_DEFENCE_TURRET as [color, points]}
      <polygon points={points.map((p) => p.join(",")).join(" ")} fill={color} />
    {/each}
  </svg>
{:else if part.id === "gravity-coil"}
  <svg aria-hidden="true" viewBox="-24 -30 48 60">
    <g transform="rotate(-90)">
      {#each UTILITY_ART.gravity as face}
        <path
          d={face.contours
            .map((c) => `M${c.map((p) => p.join(",")).join("L")}Z`)
            .join(" ")}
          fill={face.color}
          fill-rule={face.fillRule}
        />
      {/each}
    </g>
  </svg>
{:else if part.capacity > 0}
  <svg aria-hidden="true" viewBox="-24 -30 48 60">
    {#each POTENTIAL_WELL_ART[
      part.id === "heavy-well" ? "heavy" : "normal"
    ] as face}
      <path
        d={face.path}
        fill={face.fill}
        stroke={face.stroke}
        stroke-width={face.width}
      />
    {/each}
  </svg>
{/if}
