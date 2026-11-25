<script lang="ts">
import { COLOR, loadCanvasFonts } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  buildSlotLinks,
  CHASSIS,
  CRUISER,
  drawBuild,
  FIDDLER,
  FIGHTER,
  type Loadout,
  loadMountPlan,
  type MountPlan,
  type MountPlanDocument,
  MountPlanSchema,
  moveMount,
  moveSlotLinkLine,
  newMountPlan,
  PARTS,
  previewMounts,
  previewSlotLinkLines,
  SCOUT,
  slotAccepts,
  WASP,
} from "@void-drift/mode-a";
import { onMount } from "svelte";
import RingSlider from "../../inputs/RingSlider.svelte";
import SegmentedControl from "../../inputs/SegmentedControl.svelte";

let { label = "Ship mount planner" }: { label?: string } = $props();
let ready = $state(false);
type Draft = { plan: MountPlanDocument; stale?: string; notice?: string };
let draft = $state<Draft>({ plan: newMountPlan("fighter") });
let plan = $derived(draft.plan);
let crossbar = $state("");
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
let history = $state<Draft[]>([]),
  future = $state<Draft[]>([]);
let documentOpen = $state(false);
let autoFit = $state(true);
let dragging = $state(false);
let dragPreview = $state<MountPlan>();
let visiblePlan = $derived(dragPreview ?? plan);
let editable = $derived(!draft.stale && !original && !dragging);
let canvas: HTMLCanvasElement, flight: HTMLCanvasElement;
let width = $state(700),
  height = $state(500);
let drag:
  | {
      id: number;
      key: string;
      target: "crossbar" | "mount" | "pan";
      start: MountPlan | undefined;
      zoom: number;
      angle: number;
      width: number;
      height: number;
      mx: number;
      my: number;
      px: number;
      py: number;
      selectionOnly: boolean;
      moved: boolean;
    }
  | undefined;
const marked = $derived(contents !== "In-game");
let current = $derived(
  (original ? plan.baseline : visiblePlan.mounts).find(
    (m) => m.key === selected,
  ),
);
function routes(doc: MountPlanDocument, baseline: boolean) {
  return buildSlotLinks(
    doc.chassis,
    previewMounts(doc, baseline),
    previewSlotLinkLines(doc, baseline),
  ).map((route) => ({
    ...route,
    x: route.points[1][0],
    y: route.points[1][1] / 2 + route.points[2][1] / 2,
  }));
}
let visibleRoutes = $derived(marked ? routes(visiblePlan, original) : []);
let activeRoute = $derived(
  visibleRoutes.find((r) => r.secondary.key === crossbar),
);
let pair = $derived(
  original
    ? plan.baseline
        .flatMap((m) =>
          m.linkedTo
            ? [{ a: m.linkedTo, b: m.key, origin: "production" as const }]
            : [],
        )
        .find((p) => p.a === selected || p.b === selected)
    : plan.mirrorPairs.find((p) => p.a === selected || p.b === selected),
);
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
function editingPlan(): MountPlan | undefined {
  if (editable && plan.version === 2) return $state.snapshot(plan);
}
function replace(next: Draft) {
  history = [...history, $state.snapshot(draft)];
  future = [];
  draft = next;
  message = "";
}
function apply(next: MountPlan) {
  if (JSON.stringify(next) !== JSON.stringify(plan))
    replace({ plan: next, notice: draft.notice });
}
function edit(field: "x" | "y" | "angle", value: number) {
  const next = editingPlan();
  if (next && Number.isFinite(value))
    apply(moveMount(next, selected, { [field]: value }));
}
function editCrossbar(input: HTMLInputElement) {
  const next = editingPlan();
  if (!next || !activeRoute) return;
  const key = activeRoute.secondary.key;
  const value = input.valueAsNumber;
  const changed = Number.isFinite(value)
    ? moveSlotLinkLine(next, key, value)
    : next;
  input.value = String(changed.slotLinkLines[key]);
  apply(changed);
}
function selectMount(key: string) {
  selected = key;
  crossbar = "";
  partner = "";
}
function selectCrossbar(key: string) {
  crossbar = key;
  selected = "";
  partner = "";
}
function restore(next: Draft) {
  draft = next;
  if (
    !next.plan.mounts.some((m) => m.key === selected) &&
    !Object.hasOwn(previewSlotLinkLines(next.plan), crossbar)
  )
    selectMount(next.plan.mounts[0].key);
  partner = "";
  message = "";
}
function undo() {
  const prev = history.at(-1);
  if (!prev || dragging || original) return;
  future = [...future, $state.snapshot(draft)];
  history = history.slice(0, -1);
  restore(prev);
}
function redo() {
  const next = future.at(-1);
  if (!next || dragging || original) return;
  history = [...history, $state.snapshot(draft)];
  future = future.slice(0, -1);
  restore(next);
}
function switchShip(chassis: Loadout["chassis"]) {
  if (dragging || (chassis === plan.chassis && !draft.stale)) return;
  try {
    const next = newMountPlan(chassis);
    autoFit = true;
    original = false;
    replace({ plan: next });
    selectMount(next.mounts[0].key);
    message = "Current layout opened. Previous draft is available with Undo.";
  } catch (error) {
    message = `Cannot capture current layout: ${String(error)}`;
  }
}
function link() {
  if (!current || pair || !candidates.some((m) => m.key === partner)) return;
  const next = editingPlan();
  if (!next) return;
  next.mirrorPairs.push({ a: selected, b: partner, origin: "planner" });
  apply(moveMount(next, selected, {}));
  partner = "";
}
function unlink() {
  const next = editingPlan();
  if (!next || pair?.origin !== "planner") return;
  next.mirrorPairs = next.mirrorPairs.filter(
    (p) => p.a !== selected && p.b !== selected,
  );
  apply(next);
}
function reset() {
  const next = editingPlan();
  if (!next) return;
  apply({
    ...next,
    mounts: structuredClone(next.baseline),
    slotLinkLines: { ...next.baselineSlotLinkLines },
    mirrorPairs: next.baseline
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
    documentOpen = true;
    message = "Clipboard unavailable. Select and copy the document below.";
  }
}
function load() {
  if (dragging) return;
  try {
    const result = loadMountPlan(JSON.parse(text));
    const next: Draft = { plan: result.plan };
    if (result.status === "stale") {
      const reasons = [
        result.staleMounts.length &&
          `Mount baseline: ${result.staleMounts.join(", ")}.`,
        result.staleSlotLinkLines.length &&
          `Crossbar baseline: ${result.staleSlotLinkLines.join(", ")}.`,
        result.routingCaptureError &&
          `Current routing could not be captured: ${result.routingCaptureError.message}`,
      ];
      next.stale = reasons.filter(Boolean).join(" ");
    } else if (result.status === "migrated") {
      next.notice =
        "Legacy v1 loaded. Both maps adopt current production routing; the legacy document did not record it. Copies are v2.";
    }
    replace(next);
    original = false;
    selectMount(next.plan.mounts[0].key);
    message = "Layout loaded. Previous draft is available with Undo.";
  } catch (error) {
    message = error instanceof Error ? error.message : "Invalid document";
  }
}
function fitPart(value: string) {
  const next = editingPlan();
  if (!next || !current || value === "rail") return;
  const id = value || null;
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
  const mounts = [...previewMounts(plan), ...previewMounts(plan, true)];
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
  if (marked) {
    // The fixed screen-space padding accommodates the midpoint handles.
    for (const route of [...routes(plan, false), ...routes(plan, true)])
      points.push(...route.points, [route.x, route.y]);
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
  zoom = Math.min(
    Math.max(1, width - 64) / 2 / (maxX / 2 - minX / 2),
    Math.max(1, height - 80) / 2 / (maxY / 2 - minY / 2),
  );
  panX = -(minX / 2 + maxX / 2) * zoom;
  panY = -(minY / 2 + maxY / 2) * zoom + 12;
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
const HANDLE_HIT_RADIUS = 14;
function down(event: PointerEvent) {
  if (drag || !event.isPrimary || event.button !== 0) return;
  const pos = local(event);
  const route = visibleRoutes
    .map((r) => ({
      route: r,
      distance: Math.hypot(pos.x - r.x, pos.y - r.y) * zoom,
    }))
    .filter((r) => r.distance <= HANDLE_HIT_RADIUS)
    .sort((a, b) => a.distance - b.distance)[0]?.route;
  const hits = route
    ? []
    : [...previewMounts(plan, original)].reverse().filter((m) => {
        const dx = pos.x - m.x,
          dy = pos.y - m.y,
          c = Math.cos(m.angle),
          s = Math.sin(m.angle);
        return (
          Math.abs(dx * c + dy * s) <= Math.max(m.width / 2, 12 / zoom) &&
          Math.abs(-dx * s + dy * c) <= Math.max(m.height / 2, 12 / zoom)
        );
      });
  const hit = hits.find((m) => m.key === selected) ?? hits[0];
  const start = editingPlan();
  const selectionOnly = route
    ? route.secondary.key !== crossbar
    : !!hit && hit.key !== selected;
  if (route) selectCrossbar(route.secondary.key);
  else if (hit && selectionOnly) selectMount(hit.key);
  drag = {
    id: event.pointerId,
    key: route?.secondary.key ?? hit?.key ?? "",
    target: route ? "crossbar" : hit ? "mount" : "pan",
    start,
    zoom,
    angle: (rotation * Math.PI) / 180,
    width,
    height,
    mx: route?.x ?? hit?.x ?? 0,
    my: hit?.y ?? 0,
    px: event.clientX,
    py: event.clientY,
    selectionOnly,
    moved: false,
  };
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return;
  if (drag.target === "pan") {
    autoFit = false;
    panX += event.clientX - drag.px;
    panY += event.clientY - drag.py;
    drag.px = event.clientX;
    drag.py = event.clientY;
    return;
  }
  if (drag.selectionOnly || !drag.start) return;
  const dx = event.clientX - drag.px;
  const dy = event.clientY - drag.py;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  drag.moved = true;
  const c = Math.cos(drag.angle);
  const s = Math.sin(drag.angle);
  const x = drag.mx + (dx * c + dy * s) / drag.zoom;
  if (!Number.isFinite(x)) return;
  if (drag.target === "crossbar") {
    dragPreview = moveSlotLinkLine(drag.start, drag.key, x);
  } else {
    const y = drag.my + (-dx * s + dy * c) / drag.zoom;
    if (Number.isFinite(y))
      dragPreview = moveMount(drag.start, drag.key, { x, y });
  }
}
function clearDrag() {
  const id = drag?.id;
  drag = undefined;
  dragPreview = undefined;
  dragging = false;
  if (id !== undefined && canvas.hasPointerCapture(id))
    canvas.releasePointerCapture(id);
}
function end(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return;
  if (drag.target !== "pan") move(event);
  if (dragPreview) apply($state.snapshot(dragPreview));
  clearDrag();
}
function cancel(event: PointerEvent) {
  if (drag?.id === event.pointerId) clearDrag();
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
  const mounts = previewMounts(visiblePlan, original),
    a = (rotation * Math.PI) / 180;
  const cx = (drag?.width ?? width) / 2 + panX;
  const cy = (drag?.height ?? height) / 2 + panY;
  ctx.save();
  ctx.translate(cx, cy);
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
    cx,
    cy,
    a,
    zoom,
    mounts.find((m) => m.key === selected)?.linkedTo ?? selected,
    marked
      ? { dark: COLOR.void, lime: COLOR.selected, ivory: COLOR.text }
      : undefined,
    contents === "Empty" ? mounts.map((m) => ({ ...m, part: null })) : mounts,
    undefined,
    true,
    undefined,
    undefined,
    previewSlotLinkLines(visiblePlan, original),
  );
  const selectedMount = mounts.find((m) => m.key === selected);
  if (selectedMount && marked) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.scale(zoom, zoom);
    ctx.translate(selectedMount.x, selectedMount.y);
    ctx.strokeStyle = COLOR.selected;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      Math.max(selectedMount.width, selectedMount.height) / 2 + 5 / zoom,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }
  if (marked) {
    ctx.save();
    ctx.translate(cx, cy);
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
    ctx.setLineDash([]);
    for (const route of visibleRoutes) {
      const active = route.secondary.key === crossbar;
      ctx.strokeStyle = active ? COLOR.selected : COLOR.text;
      ctx.fillStyle = active ? COLOR.selected : COLOR.void;
      ctx.lineWidth = (active ? 2 : 1.5) / zoom;
      ctx.beginPath();
      ctx.arc(route.x, route.y, (active ? 6 : 4) / zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
  dragging;
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

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape" && drag) clearDrag();
  }}
/>

<section class="planner" data-ready={ready} aria-label={label}>
  <section class="workspace">
    <div class="toolbar">
      <SegmentedControl
        label="Ship"
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
        disabled={dragging || original || !history.length}
      >
        Undo
      </button><button
        class="btn btn-ghost"
        type="button"
        onclick={redo}
        disabled={dragging || original || !future.length}
      >
        Redo
      </button>
      <button
        class="btn btn-ghost"
        type="button"
        onclick={reset}
        disabled={!editable}
      >
        Reset layout
      </button>
    </div>
    <div class="stage">
      <canvas
        bind:this={canvas}
        aria-label="Ship preview; select mounts and crossbars or edit exact values in the inspector"
        onpointerdown={down}
        onpointermove={move}
        onpointerup={end}
        onpointercancel={cancel}
        onlostpointercapture={cancel}
      ></canvas><span class="stage-label"
        >{original ? "ORIGINAL" : "DRAFT"}
        · +X FORWARD · +Y RIGHT</span
      >
    </div>
    <div class="toolbar">
      <SegmentedControl
        label="Layout view"
        options={["Draft", "Original"]}
        bind:value={
          () => (original ? "Original" : "Draft"),
          (v) => {
  if (drag) clearDrag();
  original = v === "Original";
}
        }
      />
      <SegmentedControl
        label="Mount contents"
        options={["Fitted", "In-game", "Empty"]}
        bind:value={
          () => contents,
          (v) => {
  if (drag) clearDrag();
  contents = v;
  if (v === "In-game" && !selected) selectMount(plan.mounts[0].key);
}
        }
      />
      <div class="zoom">
        <RingSlider
          label="Zoom"
          min={Math.min(0.1, zoom)}
          max={Math.max(12, zoom)}
          step={0.1}
          digits={1}
          unit="×"
          bind:value={
            () => zoom,
            (v) => {
  if (drag) clearDrag();
  autoFit = false;
  zoom = v;
}
          }
        />
      </div>
      <label
        >View °
        <input
          class="short"
          type="number"
          disabled={dragging}
          value={rotation}
          oninput={(e) => {
            const value = e.currentTarget.valueAsNumber;
            if (Number.isFinite(value)) rotation = value;
          }}
        ></label
      ><button
        class="btn btn-ghost"
        type="button"
        disabled={dragging}
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
      Select a mount or crossbar, then drag it to move. Drag the background to
      pan. Linked mounts move together.
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
          disabled={dragging}
          onclick={() => selectMount(m.key)}
        >
          {m.key}{(
            original
              ? plan.baseline.some(
                  (b) =>
                    b.linkedTo === m.key || (b.key === m.key && b.linkedTo),
                )
              : plan.mirrorPairs.some((p) => p.a === m.key || p.b === m.key)
          )
            ? " ↔"
            : ""}
        </button>
      {/each}
    </div>
    {#if draft.stale}
      <p class="message" role="alert">
        Stale layout · read-only. {draft.stale} The supplied v{plan.version}
        document remains available to copy.
      </p>
      <button
        type="button"
        class="btn btn-ghost"
        disabled={dragging}
        onclick={() => switchShip(plan.chassis)}
      >
        Start fresh from production
      </button>
    {/if}
    {#if draft.notice}
      <p role="status">{draft.notice}</p>
    {/if}
    {#if visibleRoutes.length}
      <p class="eyebrow">PRODUCTION CROSSBARS</p>
      <fieldset class="mount-list" aria-label="Production crossbars">
        {#each visibleRoutes as route (route.secondary.key)}
          <button
            type="button"
            class={crossbar === route.secondary.key
              ? "btn btn-filled"
              : "btn btn-ghost"}
            aria-label={`Crossbar ${route.secondary.key}`}
            aria-pressed={crossbar === route.secondary.key}
            disabled={dragging}
            onclick={() => selectCrossbar(route.secondary.key)}
          >
            {route.secondary.key}
          </button>
        {/each}
      </fieldset>
    {/if}
    {#if activeRoute}
      <h2>Crossbar · {activeRoute.secondary.key}</h2>
      <p>
        {activeRoute.primary.key}
        ↔ {activeRoute.secondary.key} · {original ? "Original" : "Draft"}
      </p>
      {#key activeRoute.secondary.key}
        <fieldset disabled={!editable}>
          <label>
            Crossbar X · ship units
            <input
              type="number"
              step="0.5"
              value={activeRoute.x}
              onchange={(e) => editCrossbar(e.currentTarget)}
              onkeydown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editCrossbar(e.currentTarget);
                }
              }}
            >
          </label>
        </fieldset>
      {/key}
      <p>Snaps to 0.5 units · +X forward · −X aft</p>
    {:else if current}
      <h2>{current.key}</h2>
      <p>{current.type} · {current.width} × {current.height}</p>
      <fieldset disabled={!editable}>
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
            {#if previewMounts(plan).find((m) => m.key === selected)?.part ===
              "rail"}
              <option value="rail" disabled>Rail gun · Disabled</option>
            {/if}
            {#each Object.entries(PARTS).filter(
              ([id, p]) =>
                id !== "rail" &&
                current &&
                slotAccepts(current.type, p.category),
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
    <details bind:open={documentOpen}>
      <summary>Load / inspect document</summary>
      <textarea
        aria-label="Layout document"
        bind:value={text}
        spellcheck="false"
      ></textarea><button
        class="btn btn-ghost"
        type="button"
        disabled={dragging}
        onclick={load}
      >
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
