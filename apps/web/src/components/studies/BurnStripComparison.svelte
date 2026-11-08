<script lang="ts">
import { BURN_IDS, BURNS } from "./burns";
import InputStrip from "./InputStrip.svelte";
import OptionToggle from "./OptionToggle.svelte";

let { label = "Input lane tones" }: { label?: string } = $props();

const tones = [
  { id: "lime", name: "A · Lime", note: "As drawn now; the reference." },
  { id: "lime-soft", name: "B · Soft lime", note: "Lime at 45%." },
  { id: "white", name: "C · White", note: "The text colour." },
  { id: "white-soft", name: "D · Soft white", note: "White at 70%." },
  { id: "grey", name: "E · Grey", note: "The dim text colour." },
] as const;

// The switcher speaks in labels; the strips need the id.
let chosen = $state(BURNS.course.label);
const burn = $derived(
  BURN_IDS.find((id) => BURNS[id].label === chosen) ?? "course",
);
</script>

<section class="comparison" aria-label={label}>
  <div class="surface">
    {#each tones as t}
      <div class="tone">
        <span class="caption"><strong>{t.name}</strong> · {t.note}</span>
        <!-- As in the instrument: the switcher sits on the strip it chooses. -->
        <div class="row">
          <OptionToggle
            compact
            hover="tint"
            label={`Burn, ${t.name}`}
            options={BURN_IDS.map((id) => BURNS[id].label)}
            bind:value={chosen}
          />
          <div class="lanes"><InputStrip {burn} tone={t.id} /></div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
.comparison {
  display: grid;
  gap: var(--spacing-md);
  margin-block: var(--spacing-lg);
}
.surface {
  display: grid;
  gap: var(--spacing-md);
  max-width: 800px;
  padding: var(--spacing-md);
  background: var(--color-void-light);
  border: var(--flight-border);
}
.tone {
  display: grid;
  gap: var(--spacing-sm);
}
/* The 24px gap leaves room for the strip's L and R lane labels. */
.row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: var(--spacing-lg);
}
/* Centres the lanes on the 44px switcher, as in the instrument. */
.lanes {
  padding-top: var(--spacing-sm);
}
.caption {
  color: var(--color-text-dim);
  font: var(--font-small) var(--font-flight);
}
.caption strong {
  color: var(--color-text);
  font-weight: normal;
}
</style>
