<script lang="ts">
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  CHASSIS,
  CRUISER,
  drawBuild,
  FIDDLER,
  FIGHTER,
  type Loadout,
  type MountPlan,
  MountPlanSchema,
  moveMount,
  newMountPlan,
  PARTS,
  previewMounts,
  SCOUT,
  slotAccepts,
  staleMounts,
  WASP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import Toggle from "../../inputs/Toggle.svelte";

let { label = "Ship mount planner" }: { label?: string } = $props();
let ready = $state(false);
let plan = $state<MountPlan>(newMountPlan("fighter"));
let selected = $state("left"),
  zoom = $state(4),
  rotation = $state(-90),
  panX = $state(0),
  panY = $state(0);
let original = $state(false),
  contents = $state("Fitted"),
  text = $state(""),
  message = $state(""),
  partner = $state("");
let history = $state<string[]>([]),
  future = $state<string[]>([]);
let autoFit = $state(true);
let dragging = $state(false);
let canvas: HTMLCanvasElement, flight: HTMLCanvasElement;
let width = $state(700),
  height = $state(500);
let drag:
  | {
      id: number;
      key: string;
      start: string;
      x: number;
      y: number;
      mx: number;
      my: number;
      px: number;
      py: number;
    }
  | undefined;
let current = $derived(plan.mounts.find((m) => m.key === selected));
let pair = $derived(
  plan.mirrorPairs.find((p) => p.a === selected || p.b === selected),
);
let stale = $derived(staleMounts(plan));
let candidates = $derived(
  plan.mounts.filter(
    (m) =>
      m.key !== selected &&
      m.type === current?.type &&
      m.width === current?.width &&
      m.height === current?.height &&
      !plan.mirrorPairs.some((p) => p.a === m.key || p.b === m.key),
  ),
);
const snapshot = () => JSON.stringify(plan);
function save(before = snapshot()) {
  history = [...history, before];
  future = [];
}
function apply(next: MountPlan) {
  save();
  plan = next;
  message = "";
}
function edit(field: "x" | "y" | "angle", value: number) {
  if (Number.isFinite(value) && !stale.length)
    apply(moveMount($state.snapshot(plan), selected, { [field]: value }));
}
function undo() {
  const prev = history.at(-1);
  if (!prev) return;
  future = [...future, snapshot()];
  history = history.slice(0, -1);
  plan = JSON.parse(prev);
}
function redo() {
  const next = future.at(-1);
  if (!next) return;
  history = [...history, snapshot()];
  future = future.slice(0, -1);
  plan = JSON.parse(next);
}
function switchShip(chassis: Loadout["chassis"]) {
  autoFit = true;
  apply(newMountPlan(chassis));
  selected = plan.mounts[0].key;
  partner = "";
}
function link() {
  if (!partner || !current) return;
  const next = $state.snapshot(plan);
  next.mirrorPairs.push({ a: selected, b: partner, origin: "planner" });
  apply(moveMount(next, selected, {}));
  partner = "";
}
function unlink() {
  apply({
    ...$state.snapshot(plan),
    mirrorPairs: plan.mirrorPairs
      .filter((p) => p !== pair)
      .map((p) => ({ ...p })),
  });
}
function reset() {
  apply({
    ...$state.snapshot(plan),
    mounts: structuredClone($state.snapshot(plan.baseline)),
    mirrorPairs: plan.baseline
      .filter((m) => m.linkedTo)
      .map((m) => ({
        a: m.linkedTo as string,
        b: m.key,
        origin: "production",
      })),
  });
}
async function copy() {
  text = JSON.stringify(plan, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    message = "Layout copied.";
  } catch {
    message = "Clipboard unavailable. Select and copy the document below.";
  }
}
function load() {
  try {
    const parsed = MountPlanSchema.parse(JSON.parse(text));
    apply(parsed);
    selected = parsed.mounts[0].key;
    message = "Layout loaded. Previous draft is available with Undo.";
  } catch (error) {
    message = error instanceof Error ? error.message : "Invalid document";
  }
}
function fitPart(value: string) {
  if (!current) return;
  const next = $state.snapshot(plan),
    id = value || null;
  const result = PARTS[id as keyof typeof PARTS];
  if (current.group === "side") {
    if (!result) return;
    next.previewLoadout.side = id as Loadout["side"];
  } else if (plan.chassis === "fiddler" && current.group === "aft") {
    if (result?.category !== "E") return;
    next.previewLoadout.aft = [result.id, result.id];
  } else
    next.previewLoadout[current.group][current.index] =
      id as Loadout["hull"][number];
  const checked = MountPlanSchema.safeParse(next);
  if (checked.success) apply(checked.data);
  else message = checked.error.message;
}
// Ship-local -x is the exhaust direction; mount angle rotates that axis.
const EXHAUST_GUIDE_LENGTH = 20;
const EXHAUST_ARROW_SIZE = 1.5;
function fitView() {
  const mounts = previewMounts(plan, original);
  const hull =
    plan.chassis === "fighter"
      ? FIGHTER.hull
      : (plan.chassis === "fiddler"
          ? FIDDLER.facets
          : plan.chassis === "wasp"
            ? WASP.facets
            : plan.chassis === "scout"
              ? SCOUT.facets
              : CRUISER.facets
        ).flatMap((f) => f.points);
  const points: number[][] = hull.map((p) => [p[0], p[1]]);
  // Include fittings, slot labels and selection brackets in their rotated bounds.
  for (const m of mounts) {
    const radius = Math.max(18, m.width, m.height);
    for (const x of [-radius, radius])
      for (const y of [-radius, radius])
        points.push([
          m.x + x * Math.cos(m.angle) - y * Math.sin(m.angle),
          m.y + x * Math.sin(m.angle) + y * Math.cos(m.angle),
        ]);
  }
  if (contents !== "In-game")
    for (const m of mounts.filter((m) => m.linkedTo)) {
      const partner = mounts.find((p) => p.key === m.linkedTo);
      const rear =
        Math.max(CHASSIS[plan.chassis].length, ...mounts.map((m) => m.x)) + 8;
      points.push([rear, m.y], [rear, partner?.y ?? m.y]);
    }
  if (contents !== "In-game") {
    for (const m of mounts.filter((m) => slotAccepts(m.type, "E"))) {
      const x = m.x - EXHAUST_GUIDE_LENGTH * Math.cos(m.angle);
      const y = m.y - EXHAUST_GUIDE_LENGTH * Math.sin(m.angle);
      for (const dx of [-EXHAUST_ARROW_SIZE, EXHAUST_ARROW_SIZE])
        for (const dy of [-EXHAUST_ARROW_SIZE, EXHAUST_ARROW_SIZE])
          points.push([x + dx, y + dy]);
    }
  }
  const a = (rotation * Math.PI) / 180;
  const projected = points.map(([x, y]) => [
    x * Math.cos(a) - y * Math.sin(a),
    x * Math.sin(a) + y * Math.cos(a),
  ]);
  const xs = projected.map((p) => p[0]),
    ys = projected.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  zoom = Math.max(
    0.01,
    Math.min(
      Math.max(1, width - 64) / (maxX - minX),
      Math.max(1, height - 80) / (maxY - minY),
    ),
  );
  panX = (-(minX + maxX) * zoom) / 2;
  panY = (-(minY + maxY) * zoom) / 2 + 12;
}
$effect(() => {
  plan;
  original;
  contents;
  rotation;
  width;
  height;
  if (autoFit && !dragging) fitView();
});
function local(event: PointerEvent) {
  const rect = canvas.getBoundingClientRect(),
    x = event.clientX - rect.left - width / 2 - panX,
    y = event.clientY - rect.top - height / 2 - panY;
  const a = (rotation * Math.PI) / 180;
  return {
    x: (x * Math.cos(a) + y * Math.sin(a)) / zoom,
    y: (-x * Math.sin(a) + y * Math.cos(a)) / zoom,
  };
}
function down(event: PointerEvent) {
  if (stale.length || original) return;
  const pos = local(event);
  const hit = [...plan.mounts].reverse().find((m) => {
    const dx = pos.x - m.x,
      dy = pos.y - m.y,
      c = Math.cos(m.angle),
      s = Math.sin(m.angle);
    return (
      Math.abs(dx * c + dy * s) <= Math.max(m.width / 2, 12 / zoom) &&
      Math.abs(-dx * s + dy * c) <= Math.max(m.height / 2, 12 / zoom)
    );
  });
  if (hit) selected = hit.key;
  drag = {
    id: event.pointerId,
    key: hit?.key ?? "",
    start: snapshot(),
    x: pos.x,
    y: pos.y,
    mx: hit?.x ?? 0,
    my: hit?.y ?? 0,
    px: event.clientX,
    py: event.clientY,
  };
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return;
  if (!drag.key) {
    autoFit = false;
    panX += event.clientX - drag.px;
    panY += event.clientY - drag.py;
    drag.px = event.clientX;
    drag.py = event.clientY;
    return;
  }
  const pos = local(event);
  plan = moveMount($state.snapshot(plan), drag.key, {
    x: drag.mx + pos.x - drag.x,
    y: drag.my + pos.y - drag.y,
  });
}
function end(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return;
  if (drag.key && snapshot() !== drag.start) save(drag.start);
  drag = undefined;
  dragging = false;
}
function cancel(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return;
  plan = JSON.parse(drag.start);
  drag = undefined;
  dragging = false;
}
function draw() {
  if (!canvas || !flight) return;
  const ctx = canvas.getContext("2d"),
    small = flight.getContext("2d");
  if (!ctx || !small) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  const mounts = previewMounts(plan, original),
    a = (rotation * Math.PI) / 180;
  ctx.save();
  ctx.translate(width / 2 + panX, height / 2 + panY);
  ctx.rotate(a);
  ctx.scale(zoom, zoom);
  ctx.strokeStyle = COLOR.textMuted;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.moveTo(-200, 0);
  ctx.lineTo(200, 0);
  ctx.moveTo(0, -200);
  ctx.lineTo(0, 200);
  ctx.stroke();
  ctx.restore();
  drawBuild(
    ctx,
    plan.previewLoadout,
    width / 2 + panX,
    height / 2 + panY,
    a,
    zoom,
    mounts.find((m) => m.key === selected)?.linkedTo ?? selected,
    contents === "In-game"
      ? undefined
      : { dark: COLOR.void, lime: COLOR.selected, ivory: COLOR.text },
    contents === "Empty" ? mounts.map((m) => ({ ...m, part: null })) : mounts,
  );
  if (contents !== "In-game") {
    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.rotate(a);
    ctx.scale(zoom, zoom);
    ctx.strokeStyle = COLOR.selected;
    ctx.lineWidth = 1.5 / zoom;
    ctx.lineCap = "round";
    for (const m of mounts.filter((m) => slotAccepts(m.type, "E"))) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.setLineDash([0.5 / zoom, 5 / zoom]);
      ctx.beginPath();
      ctx.moveTo(-m.width / 2, 0);
      ctx.lineTo(-EXHAUST_GUIDE_LENGTH, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(
        -EXHAUST_GUIDE_LENGTH + EXHAUST_ARROW_SIZE,
        -EXHAUST_ARROW_SIZE,
      );
      ctx.lineTo(-EXHAUST_GUIDE_LENGTH, 0);
      ctx.lineTo(
        -EXHAUST_GUIDE_LENGTH + EXHAUST_ARROW_SIZE,
        EXHAUST_ARROW_SIZE,
      );
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  flight.width = 200 * dpr;
  flight.height = 100 * dpr;
  small.scale(dpr, dpr);
  drawBuild(
    small,
    plan.previewLoadout,
    100,
    50,
    a,
    BUILD_FLIGHT_SCALE,
    "",
    undefined,
    mounts,
  );
}
$effect(() => {
  plan;
  selected;
  zoom;
  rotation;
  panX;
  panY;
  original;
  contents;
  width;
  height;
  draw();
});
onMount(() => {
  ready = true;
  void loadCanvasFonts().then(draw);
  const observer = new ResizeObserver((entries) => {
    width = entries[0].contentRect.width;
    height = entries[0].contentRect.height;
  });
  observer.observe(canvas);
  draw();
  return () => observer.disconnect();
});
</script>

<section class="planner" data-ready={ready} aria-label={label}>
  <section class="workspace">
    <div class="toolbar">
      <Toggle
        label="Ship"
        compact
        options={Object.keys(CHASSIS)}
        bind:value={
          () => plan.chassis,
          (v) => switchShip(v as Loadout["chassis"])
        }
      />
      <button
        class="btn btn-ghost"
        type="button"
        onclick={undo}
        disabled={!history.length}
      >
        Undo
      </button><button
        class="btn btn-ghost"
        type="button"
        onclick={redo}
        disabled={!future.length}
      >
        Redo
      </button>
      <button
        class="btn btn-ghost"
        type="button"
        onclick={reset}
        disabled={!!stale.length}
      >
        Reset layout
      </button>
    </div>
    <div class="stage">
      <canvas
        bind:this={canvas}
        aria-label="Ship mount canvas; select mounts and edit exact values in the adjacent controls"
        onpointerdown={down}
        onpointermove={move}
        onpointerup={end}
        onpointercancel={cancel}
        onlostpointercapture={end}
      ></canvas><span class="stage-label"
        >{original ? "ORIGINAL" : "DRAFT"}
        · +X FORWARD · +Y RIGHT</span
      >
    </div>
    <div class="toolbar">
      <Toggle
        label="Layout view"
        compact
        options={["Draft", "Original"]}
        bind:value={
          () => (original ? "Original" : "Draft"),
          (v) => (original = v === "Original")
        }
      />
      <Toggle
        label="Mount contents"
        compact
        options={["Fitted", "In-game", "Empty"]}
        bind:value={contents}
      />
      <div class="zoom">
        <RingSlider
          label="Zoom"
          min={0.1}
          max={Math.max(12, zoom)}
          step={0.1}
          digits={1}
          unit="×"
          bind:value={
            () => zoom,
            (v) => {
	autoFit = false;
	zoom = v;
}
          }
        />
      </div>
      <label
        >View ° <input class="short" type="number" bind:value={rotation}></label
      ><button
        class="btn btn-ghost"
        type="button"
        onclick={() => {
          panX = 0;
          panY = 0;
          rotation = -90;
          autoFit = true;
          fitView();
        }}
      >
        Fit ship
      </button>
    </div>
    <p>
      Drag a mount to move it. Drag the background to pan. Linked mounts move
      together.
    </p>
  </section>
  <aside>
    <p class="eyebrow">MOUNT GEOMETRY</p>
    <div class="mount-list">
      {#each plan.mounts as m}
        <button
          type="button"
          class="btn btn-ghost"
          aria-pressed={selected === m.key}
          onclick={() => {
            selected = m.key;
            partner = "";
          }}
        >
          {m.key}{plan.mirrorPairs.some((p) => p.a === m.key || p.b === m.key)
            ? " ↔"
            : ""}
        </button>
      {/each}
    </div>
    {#if stale.length}
      <p role="alert">
        Stale layout: {stale.join(", ")}. Select a ship to start fresh. The
        supplied document remains available to copy.
      </p>
    {/if}
    {#if current}
      <h2>{current.key}</h2>
      <p>{current.type} · {current.width} × {current.height}</p>
      <fieldset disabled={!!stale.length || original}>
        <div class="values">
          <label
            >X<input
              aria-label="Mount X"
              type="number"
              step="0.1"
              value={current.x}
              onchange={(e) => edit("x", e.currentTarget.valueAsNumber)}
            ></label
          ><label
            >Y<input
              aria-label="Mount Y"
              type="number"
              step="0.1"
              value={current.y}
              onchange={(e) => edit("y", e.currentTarget.valueAsNumber)}
            ></label
          >
        </div>
        <label
          >Angle · radians<input
            aria-label="Mount angle"
            type="number"
            step="0.01"
            value={current.angle}
            onchange={(e) => edit("angle", e.currentTarget.valueAsNumber)}
          ></label
        >
        <RingSlider
          label="Rotate mount"
          min={Math.min(-Math.PI, current.angle)}
          max={Math.max(Math.PI, current.angle)}
          step={0.01}
          digits={2}
          unit="rad"
          bind:value={() => current?.angle ?? 0, (v) => edit("angle", v)}
        />
        {#if pair}
          <p>Linked ↔ {pair.a === selected ? pair.b : pair.a}</p>
          {#if pair.origin === "planner"}
            <button class="btn btn-ghost" type="button" onclick={unlink}>
              Unlink pair
            </button>
          {:else}
            <p>Production pair · always linked</p>
          {/if}
        {:else}
          <p>Mirror with</p>
          <fieldset class="choices" aria-label="Mirror partner">
            {#each candidates as m}
              <button
                type="button"
                class={partner === m.key ? "btn btn-filled" : "btn btn-ghost"}
                aria-pressed={partner === m.key}
                onclick={() => (partner = m.key)}
              >
                {m.key}
              </button>
            {/each}
          </fieldset>
          <button
            class="btn btn-ghost"
            type="button"
            onclick={link}
            disabled={!partner}
          >
            Link mirrored pair
          </button>
        {/if}
        <label
          >Preview part
          <select
            aria-label="Preview part"
            value={previewMounts(plan).find((m) => m.key === selected)?.part ??
              ""}
            onchange={(e) => fitPart(e.currentTarget.value)}
          >
            {#if current.group !== "side" &&
              !(plan.chassis === "fiddler" && current.group === "aft")}
              <option value="">Empty</option>
            {/if}
            {#each Object.entries(PARTS).filter(
              ([, p]) => current && slotAccepts(current.type, p.category),
            ) as [id, p]}
              <option value={id}>{p.name}</option>
            {/each}
          </select></label
        >
      </fieldset>
    {/if}
    <div class="flight">
      <canvas
        bind:this={flight}
        aria-label="Production flight scale preview"
      ></canvas><span>Flight scale · {BUILD_FLIGHT_SCALE}×</span>
    </div>
    <button type="button" class="btn btn-filled copy" onclick={copy}>
      Copy layout
    </button>
    <details>
      <summary>Load / inspect document</summary>
      <textarea
        aria-label="Layout document"
        bind:value={text}
        spellcheck="false"
      ></textarea><button class="btn btn-ghost" type="button" onclick={load}>
        Load document
      </button>
    </details>
    <p class="message" role="status">{message}</p>
  </aside>
</section>
<style>
.planner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--color-text);
}
.workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 400px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-elev-1);
}
.stage {
  position: relative;
  flex: 1;
  min-height: 300px;
  background: var(--surface-display);
  box-shadow: var(--shadow-display);
  overflow: hidden;
}
.stage canvas {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  touch-action: none;
}
.stage-label {
  position: absolute;
  left: 16px;
  top: 16px;
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  pointer-events: none;
}
aside {
  overflow: auto;
  padding: 16px;
  background: var(--color-elev-1);
}
.eyebrow {
  letter-spacing: var(--tracking-eyebrow);
  font-size: var(--font-size-caption);
}
.mount-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
input,
select,
textarea {
  font: inherit;
  color: var(--color-text);
}
input[type="number"],
select,
textarea {
  background: var(--color-void);
  border: 1px solid var(--color-text-muted);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  min-height: var(--control-min-height);
}
select {
  width: 100%;
  min-width: 0;
  border-color: var(--color-action);
}
select:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: 2px;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.zoom {
  width: 120px;
}
label {
  display: flex;
  gap: 8px;
  align-items: center;
}
fieldset label {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 12px;
}
.values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
input {
  min-width: 0;
  max-width: 100%;
}
input[type="number"] {
  width: 100%;
  box-sizing: border-box;
}
.short {
  max-width: 72px;
}
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
}
h2 {
  font-size: 20px;
  margin: 20px 0 4px;
}
p {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  line-height: 1.5;
}
.flight {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: 16px 0;
  background: var(--surface-display);
  box-shadow: var(--shadow-display);
}
.flight canvas {
  width: 200px;
  height: 100px;
}
.flight span {
  font-size: var(--font-size-caption);
  padding-bottom: 12px;
  color: var(--color-text-muted);
}
.copy {
  width: 100%;
}
details {
  margin-top: 16px;
}
summary {
  cursor: pointer;
  min-height: 32px;
}
textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 200px;
  font-family: var(--font-family-ui);
  font-size: var(--font-size-caption);
}
.message {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
input:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}
@media (max-width: 900px) {
  .planner {
    grid-template-columns: minmax(0, 1fr) 250px;
    gap: 8px;
  }
  aside {
    padding: 8px;
  }
}
@media (max-width: 600px) {
  .planner {
    grid-template-columns: 1fr;
    height: auto;
  }
  .workspace {
    height: 550px;
  }
  aside {
    overflow: visible;
  }
}
</style>
