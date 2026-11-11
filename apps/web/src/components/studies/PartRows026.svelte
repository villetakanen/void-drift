<script lang="ts">
// Part rows study, 02.6: today's row with one change. Both columns copy the
// Hangar's part row as it is: its markup order, its styles, its texts and the
// marker component. The right column adds the hatched band in the row's
// existing right padding on unsanctioned parts, in the colour of the row's
// border, and nothing else. The list is
// the four weapons as a slot offers them with Playground on, with the Light
// Ion Cannon fitted. Fixture: the rows respond to a pointer and do nothing when pressed.
import { PARTS, type PartId, WEAPONS } from "@void-drift/mode-a";
import PreviewMarker from "../PreviewMarker.svelte";
import PartDrawing from "./PartDrawing.svelte";

const ids: PartId[] = [
  "light-ion-cannon",
  "ion-point-defence",
  "rail",
  "laser",
];
const fitted: PartId = "light-ion-cannon";

function figures(id: PartId) {
  if (id === "light-ion-cannon")
    return "12–48 damage/s · 3 shots/s · 200 units · 0.2p/shot";
  if (id === "ion-point-defence")
    return "8–24 damage/s · 3 shots/s · 100 units · 0.1p/shot";
  if (id === "rail" || id === "laser")
    return `${id === "rail" ? "Fixed direction · automatic" : "Rotating point defence"} · ${WEAPONS[id].energy} energy/shot`;
  return "";
}
</script>

<div class="bench">
  {#each [false, true] as band}
    <section class="column">
      <h4>{band ? "With the hatched band" : "As in the Hangar today"}</h4>
      <div class="part-list">
        {#each ids as id (id)}
          {@const part = PARTS[id]}
          <button
            type="button"
            class="part"
            class:installed={id === fitted}
            class:band={band && part.releaseClass === "preview"}
            aria-pressed={id === fitted}
          >
            <PartDrawing {id} />
            <span class="part-name"
              >{part.name}<small
                >{id === fitted ? "FITTED" : part.category}</small
              ></span
            >
            {#if part.releaseClass === "preview"}
              <PreviewMarker item />
            {/if}
            <span>{part.mass} mass</span>
            <small>{figures(id)}</small>
            {#if part.description}
              <small>{part.description}</small>
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
.bench {
  display: grid;
  grid-template-columns: repeat(2, 300px);
  gap: var(--spacing-xl);
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
h4 {
  margin: 0;
  font-size: var(--font-size-label);
}
/* From here to the marked line: the Hangar's own rules for the row, copied. */
.part-list {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}
.part {
  text-align: left;
  background: transparent;
  color: inherit;
  --_edge: var(--color-border-subtle);
  border: 1px solid var(--_edge);
  padding: 14px;
  cursor: pointer;
  display: grid;
  gap: 7px;
  font: inherit;
}
.part:hover,
.part.installed {
  --_edge: var(--color-selected);
}
.part.installed {
  background: var(--color-void);
}
.part-name {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}
.part small,
.part > span + span {
  font-size: 11px;
  color: var(--color-text-muted);
}
.part-name small {
  color: var(--color-text-muted);
}
.part > :global(svg) {
  width: 72px;
  height: 56px;
}
/* The one change: the band fills the row's existing 14px right padding, in
   the colour of the row's border, whatever that is at the moment. */
.part.band {
  position: relative;
}
.part.band::after {
  content: "";
  position: absolute;
  inset: 0 0 0 auto;
  width: 14px;
  background: repeating-linear-gradient(
    -45deg,
    var(--_edge) 0 2px,
    transparent 2px 6px
  );
}
</style>
