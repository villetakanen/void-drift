<script lang="ts">
let _props: { "client:load"?: boolean } = $props();

// Part rows study, 02.3: what a row has to hold, judged beside the ship. A
// slice of the Hangar: the Wasp in Plan view, a mount chooser, the Playground
// switch and the part list for the selected mount. The ship, its mounts,
// fitting rules, parts, classes and drawings are production. The switch and
// the mount chooser are the shared controls. Fixture: the ship and the
// setting live only on this page and start in a forbidden state; the Hangar's
// own ship is not read or written. A strip beneath shows the row in each
// state at once; those rows do nothing.
import "@void-drift/core/styles/buttons.css";
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import {
  type BuildMount,
  buildMounts,
  CHASSIS,
  drawBuild,
  isScoredEligible,
  type Loadout,
  LoadoutSchema,
  PARTS,
  type PartId,
  slotAccepts,
  starterLoadout,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import Switch from "../inputs/Switch.svelte";
import Toggle from "../inputs/Toggle.svelte";
import PartDrawing from "./PartDrawing.svelte";

type Part = (typeof PARTS)[PartId];
type Shown = {
  fitted?: boolean;
  forbidden?: boolean;
  pointer?: boolean;
  focus?: boolean;
  required?: boolean;
};

const start = (): Loadout => {
  const build = starterLoadout("wasp");
  build.hull[0] = "rail";
  return LoadoutSchema.parse(build);
};

let build = $state<Loadout>(start());
let playground = $state(false);
let mountName = $state("Wing 1");
let canvas = $state<HTMLCanvasElement>();
let fontsLoaded = $state(false);

const short = (mount: BuildMount) =>
  mount.group === "side" ? "Engine" : `Wing ${mount.index + 1}`;
const mounts = $derived(buildMounts(build).filter((m) => !m.linkedTo));
const mount = $derived(mounts.find((m) => short(m) === mountName) ?? mounts[0]);
const fixed = $derived(Boolean(mount.required) || mount.group === "side");
const canLaunch = $derived(playground || isScoredEligible(build));
const lines = $derived(
  Object.values(PARTS).filter(
    (part) =>
      slotAccepts(mount.type, part.category) &&
      (playground || part.releaseClass === "scored" || part.id === mount.part),
  ),
);
const anyUnsanctioned = $derived(
  lines.some((part) => part.releaseClass === "preview"),
);

function fit(id: PartId | null) {
  if (!id && fixed) return;
  const next = { ...build, hull: [...build.hull], aft: [...build.aft] };
  if (mount.group === "side") {
    if (
      id === "ion" ||
      id === "heavy-ion" ||
      id === "fusion" ||
      id === "plasma"
    )
      next.side = id;
  } else next[mount.group][mount.index] = id;
  build = LoadoutSchema.parse(next);
}

function figures(part: Part) {
  const mass = `${part.mass} mass`;
  if (part.category === "E")
    return `${mass} · ${part.thrust.toLocaleString()} thrust`;
  if (part.capacity > 0) return `${mass} · +${part.capacity} energy`;
  return mass;
}

function reset() {
  build = start();
  playground = false;
  mountName = "Wing 1";
}

const WIDTH = 380;
const HEIGHT = 340;
onMount(() => {
  loadCanvasFonts().then(() => {
    fontsLoaded = true;
  });
});
$effect(() => {
  void fontsLoaded;
  const context = canvas?.getContext("2d");
  if (!context || !canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(WIDTH * dpr);
  canvas.height = Math.round(HEIGHT * dpr);
  context.scale(dpr, dpr);
  const chassis = CHASSIS[build.chassis];
  const scale =
    0.82 *
    Math.min((HEIGHT - 80) / chassis.length, (WIDTH - 80) / chassis.width);
  drawBuild(
    context,
    build,
    WIDTH / 2,
    HEIGHT * 0.62,
    -Math.PI / 2,
    scale,
    mount.key,
    { dark: COLOR.void, lime: COLOR.selected, ivory: COLOR.text },
  );
});

const specimens: { label: string; id: PartId; shown: Shown }[] = [
  { label: "Offered", id: "ion-point-defence", shown: {} },
  {
    label: "Under a pointer",
    id: "ion-point-defence",
    shown: { pointer: true },
  },
  { label: "Keyboard focus", id: "ion-point-defence", shown: { focus: true } },
  { label: "Fitted", id: "light-ion-cannon", shown: { fitted: true } },
  { label: "Unsanctioned", id: "plasma", shown: {} },
  { label: "Unsanctioned, fitted", id: "plasma", shown: { fitted: true } },
  {
    label: "Forbidden, mount can be emptied",
    id: "rail",
    shown: { fitted: true, forbidden: true },
  },
  {
    label: "Forbidden, required engine",
    id: "plasma",
    shown: { fitted: true, forbidden: true, required: true },
  },
];
</script>

{#snippet row(part: Part, shown: Shown, press?: () => void)}
  {@const unsanctioned = part.releaseClass === "preview"}
  <button
    type="button"
    class="line"
    class:fitted={shown.fitted && !shown.forbidden}
    class:forbidden={shown.forbidden}
    class:pointer={shown.pointer}
    class:focus={shown.focus}
    class:last={!press}
    aria-pressed={Boolean(shown.fitted)}
    aria-disabled={shown.forbidden ? "true" : undefined}
    aria-label={unsanctioned ? `${part.name}, Unsanctioned` : undefined}
    tabindex={press ? undefined : -1}
    onclick={() => {
      if (!shown.forbidden) press?.();
    }}
  >
    <span class="drawing"><PartDrawing id={part.id} /></span>
    <span class="text">
      <span class="head">
        <span class="name">{part.name}</span>
        {#if shown.fitted}
          <span class="tail"
            >{shown.forbidden
              ? shown.required
                ? "Replace"
                : "Remove"
              : "Fitted"}</span
          >
        {/if}
      </span>
      <span class="figures">{figures(part)}</span>
      {#if shown.forbidden}
        <span class="more alert"
          >Unsanctioned ·
          {shown.required ? "fit another to launch" : "remove to launch"}</span
        >
      {:else if shown.fitted && part.description}
        <span class="more">{part.description}</span>
      {/if}
    </span>
    {#if unsanctioned}
      <span class="hatch" aria-hidden="true"></span>
    {/if}
  </button>
{/snippet}

<div class="bench">
  <div class="slice">
    <div class="ship">
      <div class="bar">
        <label class="setting" for="rows023-playground">
          <span>Playground</span>
          <Switch id="rows023-playground" bind:checked={playground} />
        </label>
        <p class="launch" class:blocked={!canLaunch}>
          {canLaunch
            ? playground
              ? "Playground · scoring off"
              : "Ready to launch"
            : "Unsanctioned build · launch blocked"}
        </p>
      </div>
      <canvas
        bind:this={canvas}
        style:width="{WIDTH}px"
        style:height="{HEIGHT}px"
        aria-label="The Wasp in Plan view with its fitted parts"
      ></canvas>
      <Toggle
        options={mounts.map(short)}
        bind:value={mountName}
        label="Selected mount"
        compact
      />
    </div>
    <div class="parts">
      <p class="eyebrow">Selected mount</p>
      <p class="mount">{mount.label}</p>
      <ul class="display">
        {#each lines as part (part.id)}
          {@const isFitted = part.id === mount.part}
          <li>
            {@render row(
              part,
              {
                fitted: isFitted,
                forbidden:
                  isFitted && part.releaseClass === "preview" && !playground,
                required: fixed,
              },
              () => fit(part.id),
            )}
          </li>
        {/each}
      </ul>
      {#if anyUnsanctioned && playground}
        <p class="legend">
          <span class="swatch" aria-hidden="true"></span>Unsanctioned · no score
        </p>
      {/if}
      {#if !fixed}
        <button
          type="button"
          class="btn btn-normal"
          disabled={!mount.part}
          onclick={() => fit(null)}
        >
          Remove fitting
        </button>
      {/if}
    </div>
  </div>
  <p class="reset">
    <button type="button" class="btn btn-link" onclick={reset}>
      Reset the slice
    </button>
  </p>

  <div class="sheet" inert>
    {#each specimens as specimen}
      <div class="specimen">
        <p class="eyebrow">{specimen.label}</p>
        <div class="display">
          {@render row(PARTS[specimen.id], specimen.shown)}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
.bench {
  margin-block: var(--spacing-lg);
  font-family: var(--font-family-ui);
}
p {
  margin: 0;
}
.slice {
  display: grid;
  grid-template-columns: auto 340px;
  justify-content: start;
  gap: var(--spacing-lg);
  align-items: start;
}
.ship {
  display: grid;
  justify-items: center;
  gap: var(--spacing-md);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  width: 100%;
}
.setting {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-label);
}
.launch {
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.launch.blocked {
  color: var(--color-red);
}
canvas {
  display: block;
}
/* The container: the Hangar's parts pane, one console surface. */
.parts {
  --button-ground: var(--color-elev-1);
  display: grid;
  justify-items: start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-elev-1);
  clip-path: polygon(
    var(--cut-size-lg) 0%,
    100% 0%,
    100% calc(100% - var(--cut-size-lg)),
    calc(100% - var(--cut-size-lg)) 100%,
    0% 100%,
    0% var(--cut-size-lg)
  );
}
.eyebrow,
.legend {
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.mount {
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-label);
}
/* One display holds the lines and scrolls inside itself. */
.display {
  width: 100%;
  max-height: 348px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  background: var(--color-elev-2);
  scrollbar-width: thin;
  scrollbar-color: var(--color-elev-3) transparent;
}
/* A line holds a small drawing with no frame, the name, one line of figures
   and a closing word. A bar at its start says fitted; a band at its end says
   unsanctioned. */
.line {
  --_bar: transparent;
  --_quiet: var(--color-text-muted);
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
  width: 100%;
  min-height: 56px;
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-sm)
    var(--spacing-md);
  border: 0;
  border-bottom: 1px solid var(--color-border-faint);
  box-shadow: inset var(--state-selected-indicator-width) 0 0 var(--_bar);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.line.last {
  border-bottom: 0;
}
.line:not(.fitted, .forbidden):hover,
.line.pointer {
  background: color-mix(in srgb, var(--color-action) 16%, transparent);
}
.line:not(.forbidden):active {
  filter: brightness(var(--state-held-brightness));
}
.line:focus-visible,
.line.focus {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: calc(-1 * var(--focus-ring-width));
}
.line.fitted {
  --_bar: var(--color-selected);
  background: var(--color-elev-3);
  cursor: default;
}
.line.forbidden {
  --_bar: var(--color-red);
  --_quiet: var(--color-red);
  cursor: not-allowed;
}
.drawing {
  display: grid;
  place-items: center;
  height: 36px;
}
.drawing :global(svg) {
  width: 40px;
  height: 36px;
}
.text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-sm);
}
.name {
  font-size: var(--font-control-size);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}
.figures,
.more {
  font-size: var(--font-size-caption);
  line-height: 1.35;
  color: var(--color-text-muted);
}
.more.alert {
  color: var(--color-red);
}
.tail {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-selected);
  white-space: nowrap;
}
.line.forbidden .tail {
  color: var(--color-red);
}
.hatch,
.swatch {
  background: repeating-linear-gradient(
    -45deg,
    var(--_quiet, var(--color-text-muted)) 0 2px,
    transparent 2px 6px
  );
}
.hatch {
  position: absolute;
  inset: 0 0 0 auto;
  width: var(--spacing-md);
}
.legend {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.swatch {
  width: var(--spacing-md);
  height: var(--spacing-md);
}
.reset {
  margin-block: var(--spacing-sm) var(--spacing-lg);
}
.sheet {
  display: grid;
  grid-template-columns: repeat(3, 340px);
  gap: var(--spacing-md);
}
.specimen {
  display: grid;
  align-content: start;
  gap: var(--spacing-xs);
}
</style>
