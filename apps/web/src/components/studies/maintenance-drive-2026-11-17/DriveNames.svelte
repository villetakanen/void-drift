<script lang="ts">
import "@void-drift/core/styles/buttons.css";
import { PARTS, STABILIZER_STRENGTH } from "@void-drift/mode-a";
import { FIGURE_GLYPH } from "../../hangar/figure-glyphs";
import PartCard from "../../hangar/PartCard.svelte";
import { formFaces, RAILS_024, railsAddition } from "./drive-family";

// 02.5: name candidates on sketch cards built like the Hangar's part card,
// beside the game's own light and heavy ion cards.

const NAMES = [
  {
    name: "Feather ion",
    kind: "A weight class below light, in the family's pattern",
    fluff: "Lighter than light. Slower, too.",
  },
  {
    name: "Service ion",
    kind: "What it is for",
    fluff: "Built for the yard. Flies, technically.",
  },
  {
    name: "Maintenance ion",
    kind: "The working title, made an ion",
    fluff: "Gets you to the next job. Eventually.",
  },
  {
    name: "Tug ion",
    kind: "Pilot slang for a work engine",
    fluff: "Pulls its weight. Mostly its own.",
  },
] as const;

const rails = railsAddition(RAILS_024);
const faces = [...rails.under, ...formFaces(0), ...rails.over];
const thrust = Math.round(
  PARTS.ion.thrust * 1.5 * STABILIZER_STRENGTH,
).toLocaleString("en");
const noop = () => {};
</script>

<section class="names" aria-label="02.5 · name candidates on part cards">
  <p class="caption">The game's ion engine cards, with Playground on:</p>
  <div class="cards">
    <PartCard id="ion" fitted={false} playground={true} onchoose={noop} />
    <PartCard id="heavy-ion" fitted={false} playground={true} onchoose={noop} />
  </div>
  <p class="caption">
    Sketch cards for the drive, laid out like the Hangar's. Mass, energy draw
    and cruise contribution are not set; only thrust is shown.
  </p>
  <div class="cards">
    {#each NAMES as candidate (candidate.name)}
      <figure>
        <div class="btn btn-normal btn-card card">
          <span class="drawing">
            <svg aria-hidden="true" viewBox="-18 -20 36 40">
              <g transform="rotate(-90)">
                {#each faces as face}
                  <polygon
                    points={face.points.map((p) => p.join(",")).join(" ")}
                    fill={face.color}
                  />
                {/each}
              </g>
            </svg>
          </span>
          <span class="text">
            <span class="name">{candidate.name}</span>
            <span class="prose">{candidate.fluff}</span>
          </span>
          <span class="line">
            <span class="stat" title="thrust">
              <svg class="glyph" viewBox="0 0 12 12" aria-hidden="true">
                <path d={FIGURE_GLYPH.thrust} />
              </svg>{thrust}
            </span>
          </span>
          <span class="unsanctioned-band" aria-hidden="true"></span>
        </div>
        <figcaption>{candidate.kind}</figcaption>
      </figure>
    {/each}
  </div>
</section>

<style>
.names {
  display: grid;
  gap: var(--spacing-sm);
  margin-block: var(--spacing-lg);
  padding-inline: var(--spacing-lg);
}
.caption,
figcaption {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-caption);
  line-height: 1.5;
}
.caption {
  margin-top: var(--spacing-md);
}
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: start;
}
figure {
  display: grid;
  gap: var(--spacing-xs);
  margin: 0;
}
/* The Hangar card's layout (hangar/PartCard.svelte), copied for the sketch. */
.card.btn {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: start;
  justify-content: stretch;
  gap: var(--spacing-xs);
  width: 300px;
  min-height: 0;
  padding: var(--spacing-xs) calc(var(--spacing-xs) + var(--button-cut-size))
    var(--spacing-xs) var(--spacing-xs);
  font-size: inherit;
  line-height: inherit;
  text-align: left;
  cursor: default;
}
.drawing {
  display: grid;
  place-items: center;
  height: 56px;
}
.drawing svg {
  width: 72px;
  height: 56px;
}
.text {
  display: grid;
  gap: 3px;
  align-self: center;
  min-width: 0;
}
.name {
  font-size: var(--font-control-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.prose {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: var(--font-size-caption);
  line-height: 1.35;
  color: var(--color-text-muted);
}
.line {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 5ch repeat(3, minmax(max-content, 1fr));
  gap: var(--spacing-sm);
  margin: var(--spacing-xs)
    calc(var(--spacing-md) - var(--spacing-xs) - var(--button-cut-size))
    var(--spacing-xs) calc(3 * var(--spacing-xs));
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
.stat {
  grid-column: 2;
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
</style>
