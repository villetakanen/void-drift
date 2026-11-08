<script lang="ts">
import Toggle from "../../inputs/Toggle.svelte";
import VolumeDrawing from "./VolumeDrawing.svelte";

let { label = "Corvette volume comparison" }: { label?: string } = $props();
let view = $state("Hull");
const proposals = [
  {
    id: "twin" as const,
    name: "A / Deep forward blades",
    note: "The copied bow faces lead into widening, angular blade sections. Equipment decks sit within those sections; the original swept roots bring them back into the unchanged command body.",
    tradeoff:
      "Tests whether the pincers can carry the ship’s substance while the familiar centre body remains slender.",
  },
  {
    id: "centre" as const,
    name: "B / Broad swept shoulders",
    note: "The pincers retain the reference’s lighter section. A broad deck grows beneath the swept shoulders and around the unchanged command body, with a lower dark edge giving the deck depth.",
    tradeoff:
      "Tests whether a substantial shoulder body can make the whole vessel feel large without losing the long LHI cockpit and tapering tail.",
  },
];
</script>
<div class="controls">
  <Toggle
    {label}
    options={["Hull", "Lineage", "Mounts", "Fitted"]}
    bind:value={view}
  />
  <p class="caption">
    Same copied bow faces, command body and equipment count · 2.65×
  </p>
</div>
<div class="proposals">
  {#each proposals as proposal}
    <figure>
      <figcaption>{proposal.name}</figcaption>
      <VolumeDrawing
        variant={proposal.id}
        {view}
        label={`02.3 ${proposal.name}, ${view.toLowerCase()} view`}
      />
      <p>{proposal.note}</p>
      <p class="tradeoff">{proposal.tradeoff}</p>
    </figure>
  {/each}
</div>
<p class="caption" aria-live="polite">
  {view === "Hull"
    ? "The original command body and two bow faces are reused directly from the draft reconstruction. Four stabilizers remain provisional. Lineage isolates the unchanged parts."
    : view === "Lineage"
      ? "Bright: the two original bow faces and the complete original command body, including cockpit and aft vanes. Faint: the surrounding structure being explored. The bow faces are translated apart; their shapes are unchanged."
      : view === "Mounts"
        ? "Comparison fixture: six Q equipment mounts (four forward, two aft), two + universal mounts and two E engine mounts. Ten is a study assumption, not an accepted layout."
        : "The same fitting fixture on both: four Potential Wells on the forward hulls, four solar units aft and two Heavy ion engines. Production artwork at its normal mounting scale; visual occupancy only, not a flight-tested build."}
</p>
<h4>Does the volume survive flight scale?</h4>
<p>
  The previous drawing remains here as the scale baseline. All four are shown at
  0.65× without camera zoom. The military-inspired Corvette is not used as a
  family reference.
</p>
<div class="fleet">
  {#each [
    { id: "wasp" as const, name: "Wasp" },
    { id: "previous" as const, name: "02.2 / Previous" },
    { id: "twin" as const, name: "02.3 A / Deep blades" },
    { id: "centre" as const, name: "02.3 B / Swept shoulders" },
  ] as item}
    <figure>
      <figcaption>{item.name}</figcaption>
      <VolumeDrawing
        variant={item.id}
        scale={0.65}
        width={150}
        height={105}
        label={`${item.name} at common 0.65× flight scale`}
      />
    </figure>
  {/each}
</div>
<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  align-items: center;
  margin-block: var(--spacing-lg);
}
.caption {
  font: var(--font-size-caption) / var(--line-height-ui) var(--font-family-ui);
  color: var(--color-text-muted);
  max-width: var(--measure-prose);
}
.proposals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-xl);
}
figure {
  margin: 0;
  padding-block: var(--spacing-md);
}
figcaption {
  font: var(--font-size-label) / var(--line-height-ui) var(--font-family-ui);
  margin-bottom: var(--spacing-md);
}
.proposals figcaption {
  min-height: 3em;
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}
.proposals p {
  font-size: var(--font-size-body);
  margin-block: var(--spacing-md);
}
.tradeoff {
  color: var(--color-text-muted);
}
h4 {
  margin-top: var(--spacing-xl);
}
.fleet {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-lg);
}
.fleet figcaption {
  text-align: center;
}
@media (max-width: 750px) {
  .proposals {
    grid-template-columns: 1fr;
  }
  .fleet {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
