<script lang="ts">
// Design-system input (lab-instrument study, 02.4 and 02.6): one button-shaped
// control split into equal parts, one per option. The selected part is filled
// lime; the others sit on the elevation 2 surface and take a faint lime tint
// under a pointer. Native radios give arrow-key selection.
import type { Snippet } from "svelte";

let {
  options,
  value = $bindable(),
  label,
  compact = false,
  stretch = false,
  details,
  disabledOptions = [],
  optionSuffix,
}: {
  options: string[];
  value: string;
  /** Accessible name of the group. */
  label: string;
  /** Narrow side padding, for short labels set beside a diagram. */
  compact?: boolean;
  /** Fills the width of its container. */
  stretch?: boolean;
  /** Optional supporting facts inside each option; enables the detailed variant. */
  details?: Record<string, string>;
  /** Options present in the current state but unavailable for selection. */
  disabledOptions?: string[];
  /** Optional trailing content owned and supplied by the consumer. */
  optionSuffix?: Snippet<[string]>;
} = $props();

const name = `toggle-${Math.random().toString(36).slice(2, 8)}`;
</script>

<div
  class="toggle"
  class:compact
  class:stretch
  class:detailed={!!details}
  role="radiogroup"
  aria-label={label}
  style={`--_n:${options.length}`}
>
  {#each options as option, index}
    <label
      class="part"
      class:selected={value === option}
      class:unavailable={disabledOptions.includes(option)}
    >
      <input
        type="radio"
        {name}
        value={option}
        bind:group={value}
        disabled={disabledOptions.includes(option)}
        aria-label={option}
        aria-describedby={details?.[option]
          ? `${name}-detail-${index}`
          : undefined}
      >
      <span>{option}</span>
      {#if optionSuffix}
        {@render optionSuffix(option)}
      {/if}
      {#if details?.[option]}
        <span class="detail" id={`${name}-detail-${index}`}
          >{details[option]}</span
        >
      {/if}
    </label>
  {/each}
</div>

<style>
/* The outer edge is the shared button shape; the split inside is straight. */
.toggle {
  --_cut: var(--button-cut-size);
  display: inline-grid;
  grid-template-columns: repeat(var(--_n), minmax(0, 1fr));
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
.stretch {
  display: grid;
  width: 100%;
}
.part {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--button-padding-y) var(--button-padding-x);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: var(--color-elev-2);
  color: var(--color-text);
  transition: var(--button-transition);
}
.unavailable {
  cursor: not-allowed;
  opacity: 0.58;
}
.detailed .part {
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--spacing-sm) var(--spacing-md);
  white-space: normal;
  min-width: 0;
}
.detail {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  line-height: var(--line-height-ui);
}
.selected .detail {
  color: var(--color-on-brand);
}
.detailed .part:not(.selected):hover .detail {
  color: var(--color-text);
}
.compact .part {
  padding-inline: var(--spacing-sm);
}
/* Each end keeps its own outer cut. */
.part:first-child {
  clip-path: polygon(
    var(--_cut) 0%,
    100% 0%,
    100% 100%,
    0% 100%,
    0% var(--_cut)
  );
}
.part:last-child {
  clip-path: polygon(
    0% 0%,
    100% 0%,
    100% calc(100% - var(--_cut)),
    calc(100% - var(--_cut)) 100%,
    0% 100%
  );
}
.part:not(.selected):hover {
  background: color-mix(in srgb, var(--color-action) 28%, transparent);
}
.part.selected {
  background: var(--color-selected);
  color: var(--color-on-brand);
  cursor: default;
}
.part input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.part:has(input:focus-visible) {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset-inset);
}
@media (prefers-reduced-motion: reduce) {
  .part {
    transition: none;
  }
}
</style>
