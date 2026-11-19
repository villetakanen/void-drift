<script lang="ts">
import { drawBuild, starterLoadout } from "@void-drift/mode-a";
import { onMount } from "svelte";
import "@void-drift/core/styles/surfaces.css";

const variants = [
  {
    id: "open",
    title: "A / Open readings",
    note: "A bearing tick leads to type and distance. Minimal covering of the world.",
  },
  {
    id: "glass",
    title: "B / Cut-glass tags",
    note: "Shared glass and cut corners give each reading its own protected surface.",
  },
  {
    id: "symbol",
    title: "C / Symbol and distance",
    note: "A compact type symbol and prominent distance; a small type caption keeps the first reading explicit.",
  },
];
const contacts = [
  { type: "SUN", distance: 640, angle: -135, symbol: "sun" },
  { type: "DERELICT", distance: 280, angle: -10, symbol: "wreck" },
  { type: "ENERGY", distance: 180, angle: 55, symbol: "energy" },
  { type: "PIRATE", distance: 340, angle: 170, symbol: "pirate" },
].map((c) => {
  const a = (c.angle * Math.PI) / 180;
  const cos = Math.cos(a),
    sin = Math.sin(a);
  return {
    ...c,
    x: 640 + cos * 397,
    y: 450 + sin * 397,
    lx: 640 + cos * 353 - (cos > 0 ? 164 : 0),
    ly: 450 + sin * 353 - 32,
  };
});
let canvases: HTMLCanvasElement[] = [];
onMount(() => {
  for (const canvas of canvases) {
    const ctx = canvas?.getContext("2d");
    if (ctx) drawBuild(ctx, starterLoadout("wasp"), 540, 460, -0.6, 0.65, "");
  }
});
</script>

<figure class="sheet" id="combat-hud-025">
  <header>
    <p class="eyebrow">COMBAT HUD / 02.5 / MARKER LANGUAGE</p>
    <h2>One edge circle. Three marker treatments.</h2>
    <p>
      Target type, distance and direction stay fixed. All readings sit inside
      the active-area edge.
    </p>
  </header>
  {#each variants as variant, i}
    <section id={`marker-${variant.id}`}>
      <h3>{variant.title}</h3>
      <p>{variant.note}</p>
      <div
        class="frame"
        role="img"
        aria-label={`${variant.title}. Static production Wasp artwork over the Sol sky. Four offscreen markers arranged on the fixed edge circle.`}
      >
        <canvas bind:this={canvases[i]} width="1280" height="900"></canvas>
        <svg viewBox="0 0 1280 900" aria-hidden="true">
          <defs>
            <clipPath id={`marker-clip-${variant.id}`}>
              <rect x="180" y="48" width="920" height="804" />
            </clipPath>
          </defs>
          <path
            class="gutters"
            d="M0 0H1280V48H0Z M0 852H1280V900H0Z M0 48H180V852H0Z M1100 48H1280V852H1100Z"
          />
          <text x="640" y="28" text-anchor="middle" class="annotation">
            STATIC ARTWORK COMPOSITION · GUTTERS SHADED FOR REFERENCE
          </text>
          <rect x="180" y="48" width="920" height="804" class="boundary" />
          <g clip-path={`url(#marker-clip-${variant.id})`}>
            <circle cx="640" cy="450" r="399" class="guide" />
            {#each contacts as c}
              <g transform={`translate(${c.x} ${c.y}) rotate(${c.angle})`}>
                <path class="bearing" d="M-18 -7L-5 0L-18 7 M-5 0H-28" />
              </g>
              <foreignObject x={c.lx} y={c.ly} width="164" height="88">
                <div
                  class:cut-surface={variant.id === "glass"}
                  class="reading"
                  class:compact={variant.id === "symbol"}
                >
                  {#if variant.id === "symbol"}
                    <div class="symbol-line">
                      <svg
                        viewBox="0 0 32 32"
                        class="symbol"
                        aria-hidden="true"
                      >
                        {#if c.symbol === "sun"}
                          <circle cx="16" cy="16" r="6" />
                          <path
                            d="M16 2V6M16 26V30M2 16H6M26 16H30M6 6L9 9M23 23L26 26M6 26L9 23M23 9L26 6"
                          />
                        {:else if c.symbol === "wreck"}
                          <path
                            d="M6 7L15 4L13 14L23 11L26 24L17 28L18 18L8 22Z"
                          />
                        {:else if c.symbol === "energy"}
                          <path d="M17 2L7 18H15L13 30L26 12H18Z" />
                        {:else}
                          <path d="M16 4L28 26L16 21L4 26Z M16 12V17" />
                        {/if}
                      </svg>
                      <span class="number">{c.distance}<small> u</small></span>
                    </div>
                    <span class="type small-type">{c.type}</span>
                  {:else}
                    <span class="type">{c.type}</span>
                    <span class="number">{c.distance}<small> u</small></span>
                  {/if}
                </div>
              </foreignObject>
            {/each}
          </g>
        </svg>
      </div>
    </section>
  {/each}
  <figcaption>
    Same production Wasp drawing and Sol sky asset in every frame; static,
    staged composition with no simulation. The circle is fixed at the
    active-area edge, not centred on the ship. Shared text, glass, border and
    cut-corner roles; proposed symbols are study-only. Distances and bearings
    are authored. No layout anchor comparison or gameplay validation is implied.
  </figcaption>
</figure>

<style>
.sheet {
  margin: var(--spacing-lg) 0;
}
header,
:where(section > p),
h3,
figcaption {
  padding-inline: var(--spacing-md);
}
.eyebrow {
  font: var(--font-size-caption) var(--font-family-ui);
  letter-spacing: var(--tracking-eyebrow);
  color: var(--color-text-muted);
}
h2 {
  font-size: 30px;
  margin: var(--spacing-md) 0;
}
h3 {
  font-size: 24px;
  margin: var(--spacing-lg) 0 var(--spacing-sm);
}
p {
  font-size: 17px;
  margin: 0 0 var(--spacing-md);
  line-height: var(--line-height-prose);
}
.frame {
  position: relative;
  aspect-ratio: 1280 / 900;
  overflow: hidden;
  background: var(--color-void) url("/skies/sol.png") center / cover;
  border: 1px solid var(--color-border);
}
canvas,
.frame > svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.gutters {
  fill: var(--color-glass);
}
.boundary {
  fill: none;
  stroke: var(--color-border);
  stroke-dasharray: 3 8;
}
.guide {
  fill: none;
  stroke: var(--color-border);
}
.bearing {
  fill: none;
  stroke: var(--color-text);
  stroke-width: 2;
}
.annotation {
  fill: var(--color-text-muted);
  font: 12px var(--font-family-ui);
}
.reading {
  color: var(--color-text);
  font-family: var(--font-family-ui);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.reading:not(.cut-surface) {
  text-shadow:
    0 1px 3px var(--color-void),
    0 0 8px var(--color-void);
}
.type {
  font-size: 16px;
  letter-spacing: 0.08em;
}
.number {
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}
small {
  font-size: 14px;
  color: var(--color-text-muted);
}
.small-type {
  font-size: 12px;
  padding-left: 40px;
}
.symbol-line {
  display: flex;
  align-items: center;
  gap: 8px;
}
.symbol {
  width: 32px;
  height: 32px;
  fill: none;
  stroke: var(--color-text);
  stroke-width: 1.7;
}
figcaption {
  margin-top: var(--spacing-lg);
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: var(--line-height-prose);
}
</style>
