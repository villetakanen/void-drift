<script lang="ts" module>
export type GameOverOutcome = {
  /** The cause or result, shown as a tag at the top of the panel. */
  tag: { text: string; tone: "alert" | "neutral" };
  /** Names the hero value, shown small above it. */
  label?: string;
  /** The hero value, shown large. */
  value: string;
  /** Shown directly under the hero value. */
  caption?: string;
};
</script>

<script lang="ts">
import type { Snippet } from "svelte";
import Dialog from "./Dialog.svelte";

let {
  outcome,
  statistics,
  resultFields,
  resultAction,
  navigation,
}: {
  outcome: GameOverOutcome;
  statistics: Snippet;
  /** Optional fields and feedback sit above the action group. */
  resultFields?: Snippet;
  /** Optional result controls lead the same action group as navigation. */
  resultAction?: Snippet;
  navigation: Snippet;
} = $props();
</script>

<Dialog label="Run complete" class="flight-card" returnFocus={false}>
  <p class="tag" data-tone={outcome.tag.tone}>{outcome.tag.text}</p>
  <h1 class="hero">
    {#if outcome.label}
      <span class="hero-label">{outcome.label}</span>{" "}
    {/if}
    <span class="hero-value">{outcome.value}</span>
  </h1>
  {#if outcome.caption}
    <p class="hero-caption">{outcome.caption}</p>
  {/if}
  {@render statistics()}
  {@render resultFields?.()}
  <div class="button-group button-group--vertical">
    {@render resultAction?.()}
    {@render navigation()}
  </div>
</Dialog>

<style>
.tag {
  justify-self: center;
  margin: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--tracking-eyebrow);
  line-height: var(--line-height-ui);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  background: var(--color-elev-1);
}
.tag[data-tone="alert"] {
  color: var(--color-alert);
  border-color: color-mix(in srgb, var(--color-alert) 65%, transparent);
  background: color-mix(in lch, var(--color-alert) 12%, transparent);
}
.hero {
  display: grid;
  justify-items: center;
  gap: var(--spacing-xs);
  min-width: 0;
}
.hero-label {
  font-family: var(--font-family-ui);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.hero-value {
  max-width: 100%;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
.hero-caption {
  margin-top: calc(-1 * var(--spacing-xs));
}
</style>
