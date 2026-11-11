<script lang="ts">
// Part rows study, 02.8: information density. A deliberately naive block, a
// drawing, a name and one line of figures, shown at four amounts of content
// for three kinds of part. It says nothing about how the row looks or behaves.
// Figures are computed from the game's own data. The icons are placeholders
// drawn for this page; the game has none yet.
import {
  ION_CANNON,
  PARTS,
  type PartId,
  POINT_DEFENCE,
} from "@void-drift/mode-a";
import PartDrawing from "./PartDrawing.svelte";

type Icon =
  | "mass"
  | "thrust"
  | "energy"
  | "cruise"
  | "damage"
  | "reach"
  | "store";
type Stat = { icon: Icon; value: string; label: string };

const perSecond = (bands: readonly number[], cooldown: number) =>
  `${Math.round(Math.min(...bands) / cooldown)}–${Math.round(Math.max(...bands) / cooldown)}`;
const trim = (n: number) => String(Math.round(n * 100) / 100);

// For each part: the figure it gives first, then what it costs to run and
// what else tells it apart.
function stats(id: PartId): { gives: Stat[]; more: Stat[] } {
  const part = PARTS[id];
  if (part.category === "E")
    return {
      gives: [
        {
          icon: "thrust",
          value: Math.round(part.thrust).toLocaleString("en"),
          label: "thrust",
        },
      ],
      more: [
        {
          icon: "energy",
          value: `${trim(part.draw)}/s`,
          label: "energy per second",
        },
        {
          icon: "cruise",
          value: `+${part.speedContribution}`,
          label: "units per second added to the cruise ceiling",
        },
      ],
    };
  if (id === "light-ion-cannon")
    return {
      gives: [
        {
          icon: "damage",
          value: `${perSecond(ION_CANNON.bands, ION_CANNON.cooldown)}/s`,
          label: "damage per second",
        },
      ],
      more: [
        {
          icon: "energy",
          value: `${trim(ION_CANNON.energy / ION_CANNON.cooldown)}/s`,
          label: "energy per second while firing",
        },
        {
          icon: "reach",
          value: String(ION_CANNON.range),
          label: "reach in units",
        },
      ],
    };
  if (id === "ion-point-defence")
    return {
      gives: [
        {
          icon: "damage",
          value: `${perSecond(POINT_DEFENCE.bands, POINT_DEFENCE.cooldown)}/s`,
          label: "damage per second",
        },
      ],
      more: [
        {
          icon: "energy",
          value: `${trim(POINT_DEFENCE.energy / POINT_DEFENCE.cooldown)}/s`,
          label: "energy per second while firing",
        },
        {
          icon: "reach",
          value: String(POINT_DEFENCE.reach),
          label: "reach in units",
        },
      ],
    };
  if (part.capacity > 0)
    return {
      gives: [
        { icon: "store", value: `+${part.capacity}`, label: "energy capacity" },
      ],
      more: [],
    };
  return { gives: [], more: [] };
}

const parts: PartId[] = [
  "ion",
  "heavy-ion",
  "light-ion-cannon",
  "ion-point-defence",
  "battery",
  "heavy-well",
];
const levels = [
  { name: "A / Name and drawing", mass: false, gives: false, more: false },
  { name: "B / Add mass", mass: true, gives: false, more: false },
  { name: "C / Add what it gives", mass: true, gives: true, more: false },
  {
    name: "D / Add running cost and one more",
    mass: true,
    gives: true,
    more: true,
  },
];
const legend: Stat[] = [
  { icon: "mass", value: "", label: "mass" },
  { icon: "thrust", value: "", label: "thrust" },
  { icon: "damage", value: "", label: "damage per second" },
  { icon: "store", value: "", label: "energy capacity" },
  { icon: "energy", value: "", label: "energy per second" },
  { icon: "cruise", value: "", label: "cruise ceiling" },
  { icon: "reach", value: "", label: "reach" },
];
</script>

{#snippet glyph(icon: Icon)}
  <svg class="glyph" viewBox="0 0 12 12" aria-hidden="true">
    {#if icon === "mass"}
      <path d="M4 1h4v2h1.5L11 11H1L2.5 3H4z" />
    {:else if icon === "thrust"}
      <path d="M1 2l5 4-5 4zM6 2l5 4-5 4z" />
    {:else if icon === "energy"}
      <path d="M7 0L2 7h3l-1 5 6-7H7z" />
    {:else if icon === "cruise"}
      <path d="M1 11L6 1l5 10H9L6 5l-3 6z" />
    {:else if icon === "damage"}
      <path d="M6 0l1.5 4L12 6 7.5 8 6 12 4.5 8 0 6l4.5-2z" />
    {:else if icon === "reach"}
      <path d="M0 6l3-3v2h6V3l3 3-3 3V7H3v2z" />
    {:else}
      <path d="M2 2h8v9H2zM4 0h4v2H4z" />
    {/if}
  </svg>
{/snippet}

{#snippet stat(item: Stat)}
  <span class="stat" title={item.label}>
    {@render glyph(item.icon)}<span class="sr">{item.label}</span>{item.value}
  </span>
{/snippet}

<div class="bench">
  {#each levels as level}
    <section class="level">
      <h4>{level.name}</h4>
      {#each parts as id (id)}
        {@const part = PARTS[id]}
        {@const s = stats(id)}
        <div class="block">
          <span class="drawing"><PartDrawing {id} /></span>
          <span class="text">
            <span class="name">{part.name}</span>
            {#if level.mass}
              <span class="line">
                {@render stat({
                  icon: "mass",
                  value: String(part.mass),
                  label: "mass",
                })}
                {#if level.gives}
                  {#each s.gives as item}
                    {@render stat(item)}
                  {/each}
                {/if}
                {#if level.more}
                  {#each s.more as item}
                    {@render stat(item)}
                  {/each}
                {/if}
              </span>
            {/if}
          </span>
        </div>
      {/each}
    </section>
  {/each}
</div>
<p class="legend">
  {#each legend as item}
    <span class="key">{@render glyph(item.icon)}{item.label}</span>
  {/each}
</p>

<style>
.bench {
  display: grid;
  /* Each column is as wide as the Hangar's parts pane, so a line that wraps
     here wraps there. */
  grid-template-columns: repeat(2, 300px);
  gap: var(--spacing-lg);
  margin-block: var(--spacing-lg) var(--spacing-md);
  font-family: var(--font-family-ui);
}
.level {
  display: grid;
  align-content: start;
  gap: var(--spacing-xs);
}
h4 {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
/* The naive block: a plain box, not a proposal for the row's look. */
.block {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: var(--spacing-sm);
  min-height: 44px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
}
.drawing {
  display: grid;
  place-items: center;
}
.drawing :global(svg) {
  width: 36px;
  height: 30px;
}
.text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.name {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.line {
  display: flex;
  flex-wrap: wrap;
  gap: 2px var(--spacing-md);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
.stat,
.key {
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
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs) var(--spacing-md);
  margin: 0 0 var(--spacing-lg);
  font-family: var(--font-family-ui);
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
</style>
