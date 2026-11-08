<script lang="ts">
let {
  wasp,
  fighterHull,
  mounts,
  engines,
}: {
  wasp: { points: readonly (readonly number[])[]; color: string }[];
  fighterHull: { points: readonly (readonly number[])[]; color: string }[];
  engines: {
    x: number;
    y: number;
    angle: number;
    below: boolean;
    faces: { points: readonly (readonly number[])[]; color: string }[];
  }[][];
  mounts: { x: number; y: number }[][];
} = $props();

let placement = $state("default");
let size = $state(18);
const ships = ["wasp", "fighter"] as const;
const points = (ps: readonly (readonly number[])[]) =>
  ps.map((p) => p.join(",")).join(" ");
const arc = (r: number, a: number, b: number) =>
  Array.from({ length: 4 }, (_, i) => {
    const t = a + ((b - a) * i) / 3;
    return [r * Math.cos(t), r * Math.sin(t)];
  });
const band = (outer: number, inner: number, a: number, b: number) =>
  points([...arc(outer, a, b), ...arc(inner, b, a)]);
</script>

<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <defs>
    <clipPath id="fit-ribbon">
      <path
        transform="rotate(90)"
        clip-rule="evenodd"
        d="M0-9L6.4-6.4L9 0L6.4 6.4L0 9L-6.4 6.4L-9 0L-6.4-6.4Z M0-7L-5-5L-7 0L-5 5L0 7L5 5L7 0L5-5Z M-14-1H-8V1H-14Z M8-1H14V1H8Z M-18-3H-13V3H-18Z M13-3H18V3H13Z"
      />
    </clipPath>
  </defs>
</svg>
{#snippet engineLayer(i: number, below: boolean)}
  <g transform="rotate(-90)">
    {#each engines[i].filter((e) => e.below === below) as engine}
      <g
        transform={`translate(${engine.x},${engine.y}) rotate(${(engine.angle * 180) / Math.PI})`}
      >
        {#each engine.faces as face}
          <polygon points={points(face.points)} fill={face.color} />
        {/each}
      </g>
    {/each}
  </g>
{/snippet}
<div class="controls">
  <label
    >Placement
    <select bind:value={placement}>
      <option value="default">Default</option>
      <option value="bottom">Bottom · beneath hull</option>
      <option value="top">Top · above hull</option>
    </select>
  </label>
  <label class="size"
    >Coil length · {size} units
    <input
      aria-label="Coil length"
      type="range"
      min="8"
      max="36"
      step="1"
      bind:value={size}
    >
  </label>
  <button
    type="button"
    onclick={() => {
      placement = "default";
      size = 18;
    }}
  >
    Reset
  </button>
</div>
<p class="hint">
  Default follows the game’s equipment layering: Wasp below the hull, Fighter
  above. Both use their existing equipment mounts. Length includes the yellow
  connectors.
</p>
{#snippet coils(i: number)}
  {#each mounts[i] as mount}
    <g transform={`translate(${mount.y},${-mount.x}) scale(${size / 36})`}>
      <!-- Retain 1A's continuous support annulus beneath the separated sectors. -->
      {#each Array.from({ length: 8 }, (_, n) => n) as n}
        {@const a = (n * Math.PI) / 4}
        {@const b = ((n + 1) * Math.PI) / 4}
        {@const lit = Math.cos((a + b) / 2) + Math.sin((a + b) / 2) < 0}
        <polygon
          points={band(15, 12.5, a, b)}
          fill={lit ? "#7894a4" : "#4e687b"}
        />
        <polygon
          points={band(16, 8, a + 0.07, b - 0.07)}
          fill={lit ? "#8da6b3" : "#526e80"}
        />
        <polygon
          points={band(15, 10, a + 0.07, b - 0.07)}
          fill={lit ? "#a2b7bf" : "#607d8d"}
        />
        <polygon
          points={band(10, 8, a + 0.07, b - 0.07)}
          fill={lit ? "#7894a4" : "#4e687b"}
        />
      {/each}
      <g clip-path="url(#fit-ribbon)">
        <path d="M-20-20H20V20H-20Z" fill="#b5c22a" />
        <path d="M-20-20H20L-20 20Z" fill="#d7df62" />
        <path d="M-20 20H20V-10L10 0L0 10Z" fill="#87971e" />
      </g>
    </g>
  {/each}
{/snippet}
{#snippet hull(ship: string)}
  <g transform="rotate(-90)">
    {#if ship === "wasp"}
      {#each wasp as facet}
        <polygon points={points(facet.points)} fill={facet.color} />
      {/each}
    {:else}
      {#each fighterHull as facet}
        <polygon points={points(facet.points)} fill={facet.color} />
      {/each}
    {/if}
  </g>
{/snippet}
<div class="ships">
  {#each ships as ship, i}
    {@const below =
      placement === "bottom" || (placement === "default" && ship === "wasp")}
    <figure>
      <figcaption>
        {ship === "wasp" ? "Wasp" : "Fighter"}
        · {below ? "below hull" : "above hull"}
      </figcaption>
      {#each [3, 1] as zoom}
        <svg
          width={110 * zoom}
          height={110 * zoom}
          viewBox="-55 -60 110 110"
          role="img"
          aria-label={`${ship}, ${zoom}×, coil width ${size}, ${below ? "below" : "above"} hull`}
        >
          {@render engineLayer(i, true)}
          {#if below}
            {@render coils(i)}
          {/if}
          {@render hull(ship)}
          {@render engineLayer(i, false)}
          {#if !below}
            {@render coils(i)}
          {/if}
        </svg>
        <p class="scale">{zoom}×</p>
      {/each}
    </figure>
  {/each}
</div>
<p class="hint">
  02.8 / 1A construction with fore–aft connectors and revised surface shading,
  fitted to production hull geometry and mount positions. Light ion engines fill
  every engine mount; active FX are omitted. Size and layer are study settings,
  not changes to the game.
</p>
<style>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 20px;
  padding: 16px;
  border: 1px solid var(--color-border);
}
label {
  display: grid;
  gap: 8px;
}
.size {
  flex: 1;
  min-width: 180px;
}
select,
button {
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 10px;
  font: inherit;
}
input {
  width: 100%;
}
.ships {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
figure {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  overflow: auto;
}
figcaption {
  font-weight: 600;
}
svg {
  display: block;
  margin: 12px auto 0;
  max-width: none;
}
.scale {
  text-align: center;
  margin: 0 0 16px;
}
.hint {
  color: var(--color-text-muted);
  font-size: 14px;
}
@media (max-width: 760px) {
  .ships {
    grid-template-columns: 1fr;
  }
}
</style>
