<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.10: the drawing as a corner mark, the figures as the
// card's bottom line. The same four versions, list and widths as 02.9, with
// the block rearranged: the drawing sits in the top left corner with 4 pixels
// around it, the name and any text stand beside it, and the line of figures
// runs the full width underneath, at the bottom of the card. The widths are
// today's layout and one wider example; none is a limit. Still a plain card:
// no states, and no claim about its colours or edges.
import { PARTS, type PartId } from "@void-drift/mode-a";
import Toggle from "../inputs/Toggle.svelte";
import PartDrawing from "./PartDrawing.svelte";
import { FIGURE_GLYPH, partFigures } from "./part-figures";

const ids = (Object.keys(PARTS) as PartId[]).filter(
  (id) => PARTS[id].category !== "E",
);
const versions = [
  { id: "v1", name: "1 / Name and figures", note: "The least a card holds." },
  {
    id: "v2",
    name: "2 / Larger name and drawing",
    note: "The name at the size of other controls; the drawing half as large again.",
  },
  {
    id: "v3",
    name: "3 / Add one line of text",
    note: "One line of the catalog's description above the figures.",
  },
  {
    id: "v4",
    name: "4 / Add two lines, drawing larger",
    note: "Two lines of description and the drawing at today's Hangar size.",
  },
] as const;
const frames = {
  "299 wide, today at 1280": { width: 299, height: 391 },
  "222 wide, today on iPad": { width: 222, height: 304 },
  "400 wide": { width: 400, height: 391 },
} as const;
type FrameName = keyof typeof frames;
let frameName = $state<string>("299 wide, today at 1280");
const frame = $derived(frames[frameName as FrameName]);

let lists = $state<Record<string, HTMLDivElement | undefined>>({});
let whole = $state<Record<string, number>>({});
$effect(() => {
  const height = frame.height;
  for (const version of versions) {
    const list = lists[version.id];
    if (!list) continue;
    const top = list.getBoundingClientRect().top;
    whole[version.id] = [...list.children].filter(
      (child) => child.getBoundingClientRect().bottom - top <= height,
    ).length;
  }
});
</script>

<div class="bench">
  <Toggle
    options={Object.keys(frames)}
    bind:value={frameName}
    label="Width of the parts column"
  />
  <div class="row">
    {#each versions as version (version.id)}
      <section class="version" style:width="{frame.width}px">
        <h4>{version.name}</h4>
        <p class="note">{version.note}</p>
        <div class="frame" style:height="{frame.height}px">
          <div class="list {version.id}" bind:this={lists[version.id]}>
            {#each ids as id (id)}
              {@const part = PARTS[id]}
              <div class="block" class:band={part.releaseClass === "preview"}>
                <span class="drawing"><PartDrawing {id} /></span>
                <span class="text">
                  <span class="name">{part.name}</span>
                  {#if (version.id === "v3" || version.id === "v4") &&
                    part.description}
                    <span class="what">{part.description}</span>
                  {/if}
                </span>
                <span class="line">
                  {#each partFigures(id) as figure}
                    <span class="stat" title={figure.label}>
                      <svg class="glyph" viewBox="0 0 12 12" aria-hidden="true">
                        <path d={FIGURE_GLYPH[figure.icon]} />
                      </svg>
                      <span class="sr">{figure.label}</span>{figure.value}
                    </span>
                  {/each}
                </span>
              </div>
            {/each}
          </div>
        </div>
        <p class="count">
          {whole[version.id] ?? "…"}
          of {ids.length} parts in view
        </p>
      </section>
    {/each}
  </div>
</div>

<style>
.bench {
  display: grid;
  gap: var(--spacing-md);
  justify-items: start;
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg) var(--spacing-md);
  align-items: start;
}
.version {
  display: grid;
  gap: var(--spacing-xs);
}
h4,
p {
  margin: 0;
}
h4 {
  font-size: var(--font-size-label);
}
.note,
.count {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
.note {
  min-height: 2.8em;
}
.count {
  color: var(--color-text);
}
/* The room the pane gives the list. What falls below the edge needs a scroll. */
.frame {
  overflow: hidden;
  border-bottom: 1px dashed var(--color-text-muted);
}
.list {
  display: grid;
  gap: var(--spacing-xs);
}
.block {
  --_edge: var(--color-border);
  --_art-w: 36px;
  --_art-h: 30px;
  display: grid;
  grid-template-columns: var(--_art-w) minmax(0, 1fr);
  align-items: start;
  gap: var(--spacing-xs);
  position: relative;
  /* 4px around the drawing; the right side leaves room for the band. */
  padding: var(--spacing-xs) calc(var(--spacing-xs) + var(--spacing-sm))
    var(--spacing-xs) var(--spacing-xs);
  border: 1px solid var(--_edge);
}
/* The settled mark: a hatched band in the colour of the block's border. */
.block.band::after {
  content: "";
  position: absolute;
  inset: 0 0 0 auto;
  width: var(--spacing-sm);
  background: repeating-linear-gradient(
    -45deg,
    var(--_edge) 0 2px,
    transparent 2px 6px
  );
}
.drawing {
  display: grid;
  place-items: center;
}
.drawing :global(svg) {
  width: var(--_art-w);
  height: var(--_art-h);
}
.text {
  align-self: center;
  display: grid;
  gap: 3px;
  min-width: 0;
}
.name {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.what {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  font-size: var(--font-size-caption);
  line-height: 1.35;
  color: var(--color-text-muted);
}
.line {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 2px var(--spacing-md);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
.stat {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  white-space: nowrap;
}
.glyph {
  width: 10px;
  height: 10px;
  fill: var(--color-text-muted);
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.v2 .block,
.v3 .block {
  --_art-w: 54px;
  --_art-h: 44px;
}
.v2 .name,
.v3 .name,
.v4 .name {
  font-size: var(--font-control-size);
}
.v4 .block {
  --_art-w: 72px;
  --_art-h: 56px;
}
.v4 .what {
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
</style>
