<script lang="ts">
/**
 * ∅·Δ logomark (void · drift), drawn from committed Noto Sans Math outlines.
 * Fills with currentColor; the consumer sets the colour, normally the brand.
 */
import { LOGOMARK_PATHS, LOGOMARK_VIEWBOX } from "./logomark";

interface Props {
  size?: "sm" | "md" | "lg";
  label?: string;
}

let { size = "md", label = "Void Drift" }: Props = $props();
</script>

<svg
  class="logomark"
  viewBox={LOGOMARK_VIEWBOX}
  role="img"
  aria-label={label}
  style:height="var(--logomark-height-{size})"
>
  <path d={LOGOMARK_PATHS.void} />
  <path class="operator" d={LOGOMARK_PATHS.operator} />
  <path d={LOGOMARK_PATHS.drift} />
</svg>

<style>
.logomark {
  display: block;
  width: auto;
  fill: currentColor;
  flex-shrink: 0;
}

.operator {
  opacity: 0.7;
}
</style>
