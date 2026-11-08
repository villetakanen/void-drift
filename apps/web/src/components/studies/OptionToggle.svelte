<script lang="ts">
// Study-local: one button-shaped control split into equal parts, one per
// option (accepted with two; the burn switcher tries three). The selected part
// is filled; the others are a faint fill. Native radios give
// arrow-key selection; the halves carry the shape.
let {
  options,
  value = $bindable(),
  label,
  hover,
  compact = false,
  preview = false,
}: {
  options: string[];
  value: string;
  label: string;
  /** How the unselected half answers a pointer. */
  hover: "lift" | "tint" | "edge" | "bar";
  /** Narrow side padding, for short labels set beside a diagram. */
  compact?: boolean;
  /** Draws the unselected half in its hover state, for comparison. */
  preview?: boolean;
} = $props();

const name = `toggle-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div
  class={`split ${hover}`}
  class:compact
  role="radiogroup"
  aria-label={label}
  style={`--_n:${options.length}`}
>
  {#each options as option}
    <label
      class="half"
      class:selected={value === option}
      class:hovering={preview && value !== option}
    >
      <input type="radio" {name} value={option} bind:group={value}>
      <span>{option}</span>
    </label>
  {/each}
</div>

<style>
/* The outer element is the shared button shape; the split inside is straight. */
.split {
  --_cut: var(--button-cut-size);
  --_border: var(--button-border-width);
  display: inline-grid;
  grid-template-columns: repeat(var(--_n), 1fr);
  min-height: var(--button-min-height);
  box-sizing: border-box;
  clip-path: polygon(
    var(--_cut) 0%,
    100% 0%,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0% 100%,
    0% var(--_cut)
  );
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
}
.half {
  position: relative;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--button-padding-y) var(--button-padding-x);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: var(--color-flight-trail);
  color: var(--color-text);
  transition:
    var(--button-transition),
    box-shadow var(--duration-fast) var(--ease-standard);
}
/* Each end keeps its own outer cut, so an edge drawn on it follows the corner. */
.half:first-child {
  clip-path: polygon(
    var(--_cut) 0%,
    100% 0%,
    100% 100%,
    0% 100%,
    0% var(--_cut)
  );
}
.half:last-child {
  clip-path: polygon(
    0% 0%,
    100% 0%,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0% 100%
  );
}
.compact .half {
  padding-inline: var(--spacing-sm);
}
.half.selected {
  background: var(--color-acid-lime);
  color: var(--color-void);
  cursor: default;
}

/* Lift: the faint fill brightens. */
.lift .half:not(.selected):hover,
.lift .half.hovering {
  background: color-mix(in srgb, var(--color-text) 28%, transparent);
}

/* Tint: the faint white fill turns to a faint brand fill. */
.tint .half:not(.selected):hover,
.tint .half.hovering {
  background: color-mix(in srgb, var(--color-acid-lime) 28%, transparent);
}

/* Edge: the half previews a ghost button, lime border and label. */
.edge .half:not(.selected):hover,
.edge .half.hovering {
  background: var(--color-acid-lime);
  color: var(--color-acid-lime);
}
.edge .half:not(.selected):hover::before,
.edge .half.hovering::before {
  content: "";
  position: absolute;
  inset: var(--_border);
  z-index: -1;
  background: var(--color-void);
  clip-path: inherit;
}

/* Bar: the shared selected indicator appears along the bottom edge. */
.bar .half:not(.selected):hover,
.bar .half.hovering {
  box-shadow: inset 0 calc(-1 * var(--state-selected-indicator-width))
    var(--color-acid-lime);
}

.half input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.half:has(input:focus-visible) {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
@media (prefers-reduced-motion: reduce) {
  .half {
    transition: none;
  }
}
</style>
