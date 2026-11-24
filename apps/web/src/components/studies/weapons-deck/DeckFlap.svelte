<script lang="ts">
import { SEAM_SLOPE_DEG } from "../../controls/thrust-pads";
import { type FlapConfig, token, type WeaponState } from "./config";

let {
  config,
  state,
  side = "right",
  label,
}: {
  config: FlapConfig;
  state: WeaponState;
  side?: "left" | "right";
  label?: string;
} = $props();
const id = $props.id();
const look = $derived(config.states[state]);
const slope = Math.tan((SEAM_SLOPE_DEG * Math.PI) / 180);
const drop = $derived(config.width * slope);
const top = $derived(
  config.width * Math.tan((config.topAngle * Math.PI) / 180),
);
const fullHeight = $derived(config.height + Math.max(top, drop));
const points = $derived(
  side === "right"
    ? `0,${top} ${config.width},0 ${config.width},${config.height} 0,${config.height + drop}`
    : `0,0 ${config.width},${top} ${config.width},${config.height + drop} 0,${config.height}`,
);
const tx = $derived(
  side === "right" ? config.width - config.textInset : config.textInset,
);
const ty = $derived(
  config.height / 2 +
    (config.textInset * (Math.tan((config.topAngle * Math.PI) / 180) + slope)) /
      2 +
    config.textOffset,
);
</script>

<svg
  width={config.width}
  height={fullHeight}
  viewBox={`0 0 ${config.width} ${fullHeight}`}
  aria-label={label ?? `Weapons flap: ${state}`}
  role="img"
>
  <title>{label ?? `Weapons flap: ${state}`}</title>
  <defs>
    <clipPath id={`${id}-clip`}><polygon {points} /></clipPath>
    <pattern
      id={`${id}-stripe`}
      width={look.stripeSpacing}
      height={look.stripeSpacing}
      patternUnits="userSpaceOnUse"
      patternTransform={`rotate(${look.stripeDirection === "/" ? 45 : -45})`}
    >
      <rect
        width={look.stripeWeight}
        height={look.stripeSpacing}
        fill={token(look.stripeColor)}
      />
    </pattern>
  </defs>
  <polygon {points} fill={token(look.tint)} fill-opacity={look.opacity / 100} />
  <g clip-path={`url(#${id}-clip)`} opacity={look.stripeOpacity / 100}>
    {#if look.stripeSide === "Full"}
      <rect
        width={config.width}
        height={fullHeight}
        fill={`url(#${id}-stripe)`}
      />
    {:else}
      {#if look.stripeSide === "Left" || look.stripeSide === "Both"}
        <rect
          width={look.stripeWidth}
          height={fullHeight}
          fill={`url(#${id}-stripe)`}
        />
      {/if}
      {#if look.stripeSide === "Right" || look.stripeSide === "Both"}
        <rect
          x={config.width - look.stripeWidth}
          width={look.stripeWidth}
          height={fullHeight}
          fill={`url(#${id}-stripe)`}
        />
      {/if}
    {/if}
  </g>
  <polygon
    {points}
    fill="none"
    stroke={token(look.border)}
    stroke-width={look.borderWidth}
    stroke-opacity={look.borderOpacity / 100}
    stroke-dasharray={look.borderStyle === "Dashed" ? "6 4" : undefined}
  />
  <text
    x={tx}
    y={ty}
    text-anchor={config.alignment}
    fill={token(look.textColor)}
    font-size={config.textSize}
    dominant-baseline="central"
  >
    <tspan
      x={tx}
      dy={look.line2 ? -config.lineGap / 2 : 0}
      font-weight={config.bold ? "bold" : "normal"}
    >
      {look.line1}
    </tspan>
    {#if look.line2}
      <tspan x={tx} dy={config.lineGap}>{look.line2}</tspan>
    {/if}
  </text>
</svg>

<style>
svg {
  display: block;
  overflow: visible;
  pointer-events: none;
  font-family: var(--font-family-ui);
}
</style>
