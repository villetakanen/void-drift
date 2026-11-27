<script lang="ts">
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import {
  buildMounts,
  buildSlotLinks,
  buildStats,
  CHASSIS,
  CRUISER,
  drawBuild,
  EngineIdSchema,
  FIDDLER,
  FIGHTER,
  isScoredEligible,
  LIFE_SUPPORT_DRAIN,
  LoadoutSchema,
  PARTS,
  type PartId,
  SCOUT,
  SHIP_IDENTITY,
  type ShipProfileId,
  SLOT_STYLE,
  slotAccepts,
  WASP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import {
  initializeShipSetup,
  saveFitting,
  setActiveChassis,
  setExperimentalSetting,
  shipSetup,
  shipSetupStatus,
} from "../lib/stores/ship-setup";
import FlightDeck from "./FlightDeck.svelte";
import PartCard from "./hangar/PartCard.svelte";
import SegmentedControl from "./inputs/SegmentedControl.svelte";
import Switch from "./inputs/Switch.svelte";
import Tabs from "./inputs/Tabs.svelte";
import PageHeader from "./PageHeader.svelte";
import PlaygroundStatus from "./PlaygroundStatus.svelte";

const shipIds = ["wasp", "scout", "fighter", "corvette", "fiddler"] as const;

// Explicit Astro hydration attributes avoid the empty-props integration mismatch.
let _props: { "client:only"?: string } = $props();
let chosen = $derived($shipSetup.builds.activeChassis);
let selected = $state("left");
let previewMode = $state("Plan");
let flying = $state<"test" | "derelicts" | "gauntlet" | "survival" | null>(
  null,
);
let fontsLoaded = $state(false);
let canvas = $state<HTMLCanvasElement>();
const build = $derived($shipSetup.builds[chosen]);
const experimental = $derived($shipSetup.experimental);
const shipTabs = $derived(
  shipIds.map((id) => ({
    id,
    label: SHIP_IDENTITY[id].shortName,
    facts: [
      `${(id === "wasp" ? 1 : 2) + CHASSIS[id].hull + CHASSIS[id].aft} slots`,
      `${CHASSIS[id].mass} mass`,
    ],
    unavailable:
      experimental === "Off" && CHASSIS[id].releaseClass === "preview",
  })),
);
const canLaunch = $derived(experimental === "On" || isScoredEligible(build));
const stats = $derived(buildStats(build));
const ignitionCosts = $derived(
  stats.engineBreakdown.flatMap(({ id, count }) => {
    const part = PARTS[id];
    return part.response === "paid-ignition"
      ? [{ id, name: part.name, count, energy: part.energyPerIgnition }]
      : [];
  }),
);
const mounts = $derived(buildMounts(build));
let previewWidth = $state(600);
let previewHeight = $state(540);
let titleHeight = $state(48);
const framing = $derived.by(() => {
  const hull =
    chosen === "fighter"
      ? FIGHTER.hull
      : (chosen === "fiddler"
          ? FIDDLER.facets
          : chosen === "wasp"
            ? WASP.facets
            : chosen === "scout"
              ? SCOUT.facets
              : CRUISER.facets
        ).flatMap((f) => f.points);
  const points: number[][] = hull.map((p) => [p[0], p[1]]);
  for (const m of mounts) {
    // Bounds include the fitting, slot number, caption and selection brackets.
    const r = Math.max(12, m.width, m.height);
    for (const x of [-r, r])
      for (const y of [-r, r])
        points.push([
          m.x + x * Math.cos(m.angle) - y * Math.sin(m.angle),
          m.y + x * Math.sin(m.angle) + y * Math.cos(m.angle),
        ]);
  }
  for (const link of buildSlotLinks(chosen, mounts))
    points.push(...link.points);
  const xs = points.map((p) => p[1]),
    ys = points.map((p) => -p[0]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const top = Math.max(60, titleHeight + 32);
  const drawingHeight = Math.max(1, previewHeight - top - 28);
  const scale = Math.max(
    0.01,
    Math.min(
      Math.max(1, previewWidth - 32) / (maxX - minX),
      drawingHeight / (maxY - minY),
    ),
  );
  return {
    scale,
    x: previewWidth / 2 - ((minX + maxX) * scale) / 2,
    y: top + drawingHeight / 2 - ((minY + maxY) * scale) / 2,
  };
});
const previewScale = $derived(framing.scale);
const previewY = $derived(framing.y);
const mount = $derived(
  mounts.find((item) => item.key === selected) ?? mounts[0],
);
const compatible = $derived(
  Object.values(PARTS)
    .filter(
      (part) =>
        slotAccepts(mount.type, part.category) &&
        (part.id !== "rail" || mount.part === "rail"),
    )
    .sort(
      (a, b) =>
        Number(a.releaseClass === "preview") -
        Number(b.releaseClass === "preview"),
    ),
);
onMount(() => {
  loadCanvasFonts().then(() => {
    fontsLoaded = true;
  });
  initializeShipSetup();
});
$effect(() => {
  // Read so slot labels redraw once webfonts load; canvas text does not load them.
  void fontsLoaded;
  const context = canvas?.getContext("2d");
  if (context && canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(previewWidth * dpr);
    canvas.height = Math.round(previewHeight * dpr);
    context.scale(dpr, dpr);
    drawBuild(
      context,
      build,
      framing.x,
      previewY,
      -Math.PI / 2,
      previewScale,
      selected,
      previewMode === "Plan"
        ? {
            dark: COLOR.void,
            lime: COLOR.selected,
            ivory: COLOR.text,
          }
        : undefined,
    );
  }
});
function install(id: PartId | null) {
  if (
    id === "rail" ||
    mount.linkedTo ||
    (!id && mount.required) ||
    (id && !slotAccepts(mount.type, PARTS[id].category)) ||
    (id && experimental === "Off" && PARTS[id].releaseClass === "preview")
  )
    return;
  const next = { ...build, hull: [...build.hull], aft: [...build.aft] };
  if (mount.group === "side") {
    const engine = EngineIdSchema.safeParse(id);
    if (engine.success) next.side = engine.data;
  } else if (chosen === "fiddler" && mount.group === "aft") {
    next.aft = [id, id];
  } else next[mount.group][mount.index] = id;
  saveFitting(LoadoutSchema.parse(next));
}
function choose(id: ShipProfileId) {
  setActiveChassis(id);
  selected = "left";
}
function launch(mode: "test" | "derelicts" | "gauntlet" | "survival") {
  if (!canLaunch) return;
  flying = mode;
}
</script>

{#if flying}
  <FlightDeck
    loadout={build}
    launchSource="hangar"
    mode={flying === "test" ? "practice" : flying}
    onReturn={() => (flying = null)}
  />
{:else}
  <main class="builder">
    <div class="header-host">
      <PageHeader
        title="Hangar"
        links={[{ href: "/settings?from=hangar", label: "Settings" }]}
        navigationLabel="Hangar navigation"
      >
        {#snippet actions()}
          <label class="experimental-control" for="hangar-experimental">
            <span>Playground</span>
            <Switch
              id="hangar-experimental"
              bind:checked={
                () => experimental === "On",
                (value) => setExperimentalSetting(value ? "On" : "Off")
              }
            />
          </label>
        {/snippet}
      </PageHeader>
    </div>
    <div class="builder-content">
      <Tabs
        label="Choose chassis"
        tabs={shipTabs}
        stretch
        activation="manual"
        bind:value={
          () => chosen,
          (value) => {
  const id = shipIds.find((id) => id === value);
  if (id) choose(id);
}
        }
      >
        {#snippet panel()}
          <div class="workbench">
            <div class="ship-column">
              <section class="assembly" aria-label="Ship assembly">
                <div
                  class="blueprint"
                  bind:clientWidth={previewWidth}
                  bind:clientHeight={previewHeight}
                >
                  {#if previewMode === "Plan"}
                    <div class="view-axes" aria-hidden="true"></div>
                  {/if}
                  <div class="preview-mode">
                    <SegmentedControl
                      label="Ship preview mode"
                      options={["Plan", "View"]}
                      bind:value={previewMode}
                    />
                  </div>
                  <h2 class="ship-name" bind:clientHeight={titleHeight}>
                    {SHIP_IDENTITY[chosen].longName}
                  </h2>
                  <span class="view-caption"
                    >{previewMode === "Plan"
                      ? "FIXED MOUNTS / TOP VIEW"
                      : "IN-GAME / TOP VIEW"}</span
                  >
                  <canvas
                    width="600"
                    height="540"
                    bind:this={canvas}
                    aria-label="Ship preview with installed parts"
                  ></canvas>
                  {#each previewMode === "Plan" ? mounts : [] as slot}
                    <button
                      type="button"
                      class="mount"
                      disabled={Boolean(slot.linkedTo)}
                      title={slot.linkedTo
                        ? "Linked to the left engine slot; edit the pair there"
                        : slot.label}
                      style:left={`${((framing.x + slot.y * previewScale) / previewWidth) * 100}%`}
                      style:top={`${((previewY - slot.x * previewScale) / previewHeight) * 100}%`}
                      style:width={`${(((SLOT_STYLE.width + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * previewScale * 100) / previewWidth}%`}
                      style:height={`${(((SLOT_STYLE.height + 2 * SLOT_STYLE.gap) / SLOT_STYLE.referenceScale) * previewScale * 100) / previewHeight}%`}
                      style:transform={`translate(-50%, -50%) rotate(${slot.angle}rad)`}
                      aria-label={`${slot.label}: ${slot.part ? `${PARTS[slot.part].name}${slot.part === "rail" ? " (disabled)" : ""}` : "Empty"}`}
                      aria-pressed={mount.key === slot.key}
                      onclick={() => (selected = slot.key)}
                    ></button>
                  {/each}
                </div>
              </section>
              <section
                class="ship-systems cut-surface"
                aria-label="Ship systems"
              >
                <label class="system-setting" for="hangar-stabilizers">
                  <span
                    >Ion stabilizers{chosen === "wasp" || chosen === "fiddler"
                      ? " (forced on)"
                      : ""}</span
                  >
                  <Switch
                    id="hangar-stabilizers"
                    bind:checked={
                      () => build.stabilizers,
                      (value) => saveFitting(LoadoutSchema.parse({ ...build, stabilizers: value }))
                    }
                    disabled={chosen === "wasp" || chosen === "fiddler"}
                  />
                </label>
                <p class="assembly-note">
                  0.22 Light-ion thrust · 0.25 Light-ion energy while firing.
                  Assist turns and brake spin automatically.
                </p>

                <p class="assembly-note">
                  {chosen === "fiddler"
                    ? "Four engines in two required matching pairs. Five independent weapon/support fittings. Four turning stabilizers are forced on."
                    : chosen === "wasp"
                      ? "One rear center engine (fires on A+D) and two independent under-wing equipment slots. Four turning stabilizers are forced on."
                      : "Side engines are a mirrored pair. Hull and aft fittings are independent."}
                  <br>Every installed part adds mass. Weapons are static
                  fittings in this alpha.
                </p>
              </section>
              <section
                class="ship-systems cut-surface"
                aria-label="Linked engines"
              >
                <label class="system-setting" for="hangar-linked-engines">
                  <span>Linked engines</span>
                  <Switch
                    id="hangar-linked-engines"
                    bind:checked={
                      () => build.linkedEngines ?? false,
                      (value) => saveFitting(LoadoutSchema.parse({ ...build, linkedEngines: value }))
                    }
                  />
                </label>
                <p class="assembly-note">
                  {chosen === "fiddler"
                    ? "Turning or braking spin also fires the two main engines on the corresponding side. This adds forward thrust, without changing the turn. When off, mains require both controls."
                    : "Left or right input also fires all fitted aft engines. When off, aft engines require both inputs."}
                </p>
              </section>
            </div>
            <section class="parts cut-surface" aria-label="Compatible parts">
              <p class="eyebrow">SELECTED MOUNT</p>
              <h2>{mount.label}</h2>
              <div class="part-list">
                {#if mount.group !== "side" && !mount.required}
                  <button
                    type="button"
                    class="btn btn-normal btn-card empty-choice"
                    class:fitted={!mount.part}
                    aria-pressed={!mount.part}
                    onclick={() => install(null)}
                  >
                    Keep empty
                  </button>
                {/if}
                {#each compatible as part (part.id)}
                  <PartCard
                    retired={part.id === "rail"}
                    id={part.id}
                    fitted={mount.part === part.id}
                    playground={experimental === "On"}
                    onchoose={() => install(part.id)}
                  />
                {/each}
              </div>
            </section>
            <aside class="numbers cut-surface" aria-label="Build statistics">
              <h2>Flight estimates</h2>
              <dl>
                <div>
                  <dt>Powered cruise ceiling</dt>
                  <dd>{stats.poweredCruiseCeiling} u/s</dd>
                </div>
                <div>
                  <dt>Hull base + installed engines</dt>
                  <dd>
                    {stats.hullBaseSpeed}
                    + {stats.installedEngineContribution} u/s
                  </dd>
                </div>
                <div>
                  <dt>Total mass</dt>
                  <dd>{stats.mass}</dd>
                </div>
                <div>
                  <dt>Energy capacity</dt>
                  <dd>{stats.capacity}%</dd>
                </div>
                <div>
                  <dt>Solar charging</dt>
                  <dd>{stats.coils}×</dd>
                </div>
                <div>
                  <dt>Charging zones¹</dt>
                  <dd>
                    {4 * stats.coils}
                    / {2 * stats.coils} / {0.5 * stats.coils}
                  </dd>
                </div>
                <div>
                  <dt>Life support</dt>
                  <dd>{LIFE_SUPPORT_DRAIN} /s</dd>
                </div>
                <div>
                  <dt>
                    {ignitionCosts.length
                      ? "Continuous draw (excludes ignition)"
                      : "All engines + life support"}
                  </dt>
                  <dd>{stats.drain} E/s</dd>
                </div>
                {#each ignitionCosts as { id, name, count, energy } (id)}
                  <div>
                    <dt>{name} ignition per nozzle ({count} fitted)</dt>
                    <dd>{energy} E/ignition</dd>
                  </div>
                {/each}
                <div>
                  <dt>Coasting endurance²</dt>
                  <dd>{stats.endurance.toFixed(1)} s</dd>
                </div>
                {#if !ignitionCosts.length}
                  <div>
                    <dt>Full thrust endurance²</dt>
                    <dd>{stats.fullEndurance.toFixed(1)} s</dd>
                  </div>
                  <div>
                    <dt>Peak forward acceleration³</dt>
                    <dd>{stats.acceleration.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>Single-side angular acceleration</dt>
                    <dd>
                      {((Math.abs(stats.turnRate) * 180) / Math.PI).toFixed(1)}
                      °/s²
                    </dd>
                  </div>
                {/if}
                <div>
                  <dt>Side mount angle / arm</dt>
                  <dd>
                    {CHASSIS[chosen].angle.toFixed(1)}° / {CHASSIS[chosen].arm}
                  </dd>
                </div>
              </dl>
              <p class="footnote">
                ¹ Energy/s, near → far, G-class sun.<br>² Full batteries, no
                solar charging.<br>
                {#if ignitionCosts.length}
                  Fission kicks instead of thrusting continuously. Linked
                  nozzles commanded together wait until all are ready and the
                  ship can pay for all of them. Continuous-thrust endurance and
                  acceleration estimates do not describe this fitting.
                {:else}
                  ³ At rest, both controls, world units/s²; full power and all
                  fitted engines active. Instantaneous peak before charge
                  timing.
                {/if}
                Intrinsic battery and coil included. More mass reduces
                acceleration and turning.
                {chosen === "fiddler"
                  ? "Stabilizers provide turning; linked mains add forward speed only."
                  : "The side mounts turn left-engine input clockwise and right-engine input counterclockwise."}
              </p>
            </aside>
          </div>
        {/snippet}
      </Tabs>
      <footer>
        <div class="launch-context">
          <PlaygroundStatus
            id="hangar-playground-status"
            active={experimental === "On"}
            blocked={!canLaunch}
          />
          {#if !$shipSetupStatus.ready}
            <p role="status">Loading saved ships…</p>
          {:else if $shipSetupStatus.message}
            <p role="status">{$shipSetupStatus.message}</p>
          {/if}
        </div>
        <div class="actions">
          <button
            type="button"
            class="btn btn-normal"
            disabled={!canLaunch}
            aria-describedby={!canLaunch
              ? "hangar-playground-status"
              : undefined}
            onclick={() => launch("test")}
          >
            Practice
          </button>
          <button
            type="button"
            class="btn btn-normal"
            disabled={!canLaunch}
            aria-describedby={!canLaunch
              ? "hangar-playground-status"
              : undefined}
            onclick={() => launch("derelicts")}
          >
            Derelicts
          </button>
          <button
            type="button"
            class="btn btn-normal"
            disabled={!canLaunch}
            aria-describedby={!canLaunch
              ? "hangar-playground-status"
              : undefined}
            onclick={() => launch("gauntlet")}
          >
            Gauntlet
          </button>
          <button
            type="button"
            class="btn btn-filled"
            disabled={!canLaunch}
            aria-describedby={!canLaunch
              ? "hangar-playground-status"
              : undefined}
            onclick={() => launch("survival")}
          >
            Survival
          </button>
        </div>
      </footer>
      <p class="footnote">
        Practice: fly a repeatable star system with full health and energy.
        Derelicts: survive, destroy wrecks and collect energy. Gauntlet: an
        unranked seven-enemy encounter. Survival is ranked while Playground is
        Off and your active setup is eligible. Press Shift to toggle automatic
        weapons in Practice, or once inside the arena in Derelicts and Gauntlet.
        Pause to resume or abort back to the Hangar.
      </p>
    </div>
  </main>
{/if}
<style>
.builder {
  padding: 24px 36px;
  height: 100dvh;
  overflow: auto;
  color: var(--color-text);
  background: var(--color-void);
}
footer,
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.builder-content {
  margin-top: 16px;
}
.experimental-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}
.experimental-control {
  font-size: var(--font-size-body);
  cursor: pointer;
}
h2 {
  font-size: 20px;
  margin: 4px 0 12px;
}
p {
  line-height: 1.6;
  color: var(--color-text-muted);
  margin: 6px 0;
}
.eyebrow {
  color: var(--color-text-muted);
  font-size: 11px;
  letter-spacing: 0.16em;
}
.view-caption {
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
}
.workbench {
  display: grid;
  grid-template-columns: minmax(360px, 1.4fr) 342px minmax(0, 1fr);
  gap: 20px;
}
.parts,
.numbers {
  --_cut: var(--cut-size-lg);
  --_fill: var(--color-elev-1);
  padding: calc(var(--spacing-md) + var(--spacing-xs) + 1px);
}
.ship-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 0;
}
.ship-systems {
  --_fill: var(--color-elev-1);
  --_edge: transparent;
  padding: var(--spacing-md);
}
.system-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  min-height: var(--control-min-height);
  cursor: pointer;
}
.blueprint {
  background: var(--surface-display);
  box-shadow: var(--shadow-display);
}
.blueprint {
  position: relative;
  isolation: isolate;
  aspect-ratio: 600 / 540;
  width: 100%;
  margin: auto;
}
.preview-mode {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  z-index: var(--layer-hud);
}
.ship-name {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  max-width: calc(100% - 180px);
  margin: 0;
  text-align: left;
  z-index: var(--layer-base);
  pointer-events: none;
}
.view-caption {
  position: absolute;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  z-index: var(--layer-raised);
  pointer-events: none;
}
canvas {
  z-index: var(--layer-raised);
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}
.view-axes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(var(--color-border-subtle), var(--color-border-subtle))
    center / 1px 100% no-repeat,
    linear-gradient(var(--color-border-subtle), var(--color-border-subtle))
    center / 100% 1px no-repeat;
}
.mount {
  z-index: var(--layer-hud);
  position: absolute;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.mount:disabled {
  cursor: default;
}
.mount:hover {
  background: transparent;
}
.mount:focus-visible {
  outline: 3px solid var(--color-text);
  outline-offset: 4px;
}
.assembly-note,
.footnote {
  font-size: 11px;
}
.part-list {
  display: grid;
  gap: var(--spacing-sm);
  margin-top: 20px;
}
.empty-choice {
  width: 300px;
  font-size: var(--font-control-size);
  font-weight: var(--font-weight-medium);
}
.empty-choice.fitted {
  --btn-edge: var(--color-selected);
  --_fill: var(--color-void);
}
.numbers {
  min-width: 0;
}
dl {
  margin: 20px 0;
}
dl div {
  flex-wrap: wrap;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 10px 0;
}
dt {
  font-size: 12px;
  color: var(--color-text-muted);
}
dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: 15px;
  white-space: nowrap;
}
footer {
  position: sticky;
  bottom: 0;
  z-index: var(--layer-raised);
  background: var(--color-void);
  padding-bottom: 12px;
  margin-top: 22px;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 20px;
}
footer p {
  font-size: 12px;
}
.actions button {
  min-width: clamp(144px, 14vw, 180px);
}

@media (max-width: 1000px) {
  .workbench {
    grid-template-columns: minmax(0, 1fr);
  }
  .builder {
    padding: 16px;
  }
  footer {
    flex-wrap: wrap;
  }
  .actions {
    flex-wrap: wrap;
  }
}
</style>
