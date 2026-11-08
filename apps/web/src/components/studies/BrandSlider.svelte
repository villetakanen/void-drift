<script lang="ts">
// Study-local: a native range input with sparing lime. The input stays on
// top, transparent, so keyboard, touch and form behaviour are native; the track,
// fill and thumb underneath follow its value.
let {
  value = $bindable(),
  min,
  max,
  step,
  label,
  unit = "",
  digits = 0,
  knob = "ring",
  compact = false,
  preview = false,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
  digits?: number;
  /** solid: lime knob on a 4px lime fill · ring: lime ring on a 2px lime fill. */
  knob?: "solid" | "ring";
  /** Hides the label and value line where the host shows them itself. */
  compact?: boolean;
  /** Draws the hover state without a pointer, for comparison. */
  preview?: boolean;
} = $props();

const id = `slider-${Math.random().toString(36).slice(2, 8)}`;
const p = $derived(Math.max(0, Math.min(1, (value - min) / (max - min))));
</script>

<div class={`slider ${knob}`} class:hovering={preview} style={`--_p:${p}`}>
  <div class="head" class:compact>
    <label for={id}>{label}</label>
    <output for={id}>{value.toFixed(digits)}{unit ? ` ${unit}` : ""}</output>
  </div>
  <div class="control">
    <div class="track" aria-hidden="true"><div class="fill"></div></div>
    <div class="thumb" aria-hidden="true"></div>
    <input
      {id}
      type="range"
      {min}
      {max}
      {step}
      bind:value
      aria-valuetext={`${value.toFixed(digits)} ${unit}`.trim()}
    >
  </div>
</div>

<style>
.slider {
  --_thumb: 16px;
  /* Thumb travel matches the native thumb, so pointer and drawing agree. */
  --_x: calc(var(--_p) * (100% - var(--_thumb)));
  display: grid;
  gap: var(--spacing-xs);
  width: 100%;
  font-family: var(--font-flight);
}
.head {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  color: var(--color-text-dim);
  font-size: var(--font-small);
}
output {
  color: var(--color-text);
}
/* Still read by assistive technology. */
.head.compact {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.control {
  position: relative;
  height: var(--control-min-height);
}
.track,
.thumb {
  position: absolute;
  top: 50%;
  pointer-events: none;
  transform: translateY(-50%);
}
.track {
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-flight-trail);
  transition: background var(--duration-fast) var(--ease-standard);
}
.fill {
  height: 100%;
  width: calc(var(--_x) + var(--_thumb) / 2);
  background: var(--color-acid-lime);
}
.thumb {
  left: var(--_x);
  width: var(--_thumb);
  height: var(--_thumb);
  box-sizing: border-box;
  border-radius: 50%;
  background: var(--color-acid-lime);
}
.ring .track {
  height: 2px;
}
.ring .thumb {
  background: var(--color-void);
  border: 2px solid var(--color-acid-lime);
}
input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  appearance: none;
}
input::-webkit-slider-thumb {
  appearance: none;
  width: var(--_thumb);
  height: var(--control-min-height);
}
input::-moz-range-thumb {
  width: var(--_thumb);
  height: var(--control-min-height);
  border: 0;
}
.control:has(input:focus-visible) {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: 2px;
}
/* Accepted hover rule: the unfilled part takes a faint brand tint. */
.control:hover .track,
.slider.hovering .control .track {
  background: color-mix(in srgb, var(--color-acid-lime) 28%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .track {
    transition: none;
  }
}
</style>
