<script lang="ts">
let { item = false }: { item?: boolean } = $props();
</script>

<span
  class="preview-marker"
  role="note"
  aria-label={item ? "Unsanctioned" : "Playground is on. Scoring is off."}
  >{item ? "UNSANCTIONED" : "SCORING OFF"}</span
>

<style>
.preview-marker {
  display: inline-block;
  max-width: 100%;
  color: var(--color-text-muted);
  font: var(--font-size-caption) var(--font-family-ui);
  letter-spacing: var(--tracking-eyebrow);
  line-height: var(--line-height-ui);
}
</style>
