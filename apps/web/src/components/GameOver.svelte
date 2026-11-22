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
  outcome: { eyebrow: string; heading: string };
  statistics: Snippet;
  /** Optional fields and feedback sit above the action group. */
  resultFields?: Snippet;
  /** Optional result controls lead the same action group as navigation. */
  resultAction?: Snippet;
  navigation: Snippet;
} = $props();
</script>

<Dialog label="Run complete" class="flight-card" returnFocus={false}>
  <p class="eyebrow">{outcome.eyebrow}</p>
  <h1>{outcome.heading}</h1>
  {@render statistics()}
  {@render resultFields?.()}
  <div class="button-group button-group--vertical">
    {@render resultAction?.()}
    {@render navigation()}
  </div>
</Dialog>
