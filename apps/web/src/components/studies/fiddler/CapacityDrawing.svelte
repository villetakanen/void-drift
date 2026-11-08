<script lang="ts">
import { COLOR } from "@void-drift/core";
import {
  buildMounts,
  defaultLoadout,
  drawBuild,
  drawNonEngineFitting,
  drawPotentialWell,
  drawStabilizerSlits,
  drawUtilityArtwork,
  ENGINE_ACCENT,
  ENGINE_ART,
  type Loadout,
} from "@void-drift/mode-a";
import {
  CAPACITY_VIEW,
  CONNECTED_FACES,
  draftPoint,
  TRIAL_ITEMS,
} from "./connected-form";
import { type PincerSlots, pincerMounts } from "./pincer-slots";
import {
  type StabilizerPlacement,
  stabilizerGeometry,
} from "./stabilizer-placement";
import { type WindowDraft, windowPlacementFaces } from "./window-placement";

let {
  ship,
  hullScale,
  view,
  label,
  windowDraft,
  engineMounts,
  underwingEngineMounts = [],
  engineType = "heavy-ion",
  underwingEngineType = "heavy-ion",
  pincerSlots,
  stabilizers,
}: {
  ship: "fiddler" | "cruiser";
  hullScale: number;
  view: string;
  label: string;
  windowDraft?: WindowDraft;
  /** Study-only upright world coordinates; replaces the two 02.9 engines. */
  engineMounts?: readonly (readonly [number, number])[];
  /** These engines sit below the hull and are occluded by its faces. */
  underwingEngineMounts?: readonly (readonly [number, number])[];
  engineType?: Loadout["side"];
  underwingEngineType?: Loadout["side"];
  /** Replaces the four provisional blade fittings, with real layer occlusion. */
  pincerSlots?: PincerSlots;
  stabilizers?: StabilizerPlacement;
} = $props();
let canvas: HTMLCanvasElement;
const { width, height, zoom } = CAPACITY_VIEW;
const cruiser: Loadout = {
  ...defaultLoadout("corvette"),
  side: "heavy-ion",
  hull: ["gravity-coil", "battery", "gravity-coil"],
  aft: ["battery", "gravity-coil", "battery"],
};
const equipment = buildMounts(cruiser).find((m) => m.type === "equipment");
const engine = buildMounts(cruiser).find((m) => m.type === "engine");

$effect(() => {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  if (ship === "cruiser") {
    drawBuild(
      ctx,
      cruiser,
      width / 2,
      height / 2,
      -Math.PI / 2,
      zoom,
      "",
      undefined,
      view === "Fitted" ? undefined : [],
    );
    if (view === "Footprints") {
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.rotate(-Math.PI / 2);
      for (const mount of buildMounts(cruiser)) {
        ctx.save();
        ctx.translate(mount.x, mount.y);
        ctx.rotate(mount.angle);
        footprint(mount.width, mount.height);
        ctx.restore();
      }
    }
    return;
  }
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  if (pincerSlots && view !== "Hull" && view !== "Slots") drawPincerLayer(true);
  if (view !== "Hull" && view !== "Slots")
    for (const [x, y] of underwingEngineMounts)
      drawMountedEngine(x, y, underwingEngineType);
  const faces = windowDraft
    ? windowPlacementFaces(windowDraft)
    : CONNECTED_FACES.map((face) => ({
        ...face,
        points: face.points.map((p) => draftPoint(p, hullScale)),
      }));
  for (const face of faces) {
    ctx.beginPath();
    face.points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = face.color;
    ctx.fill();
  }
  if (stabilizers) {
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    drawStabilizerSlits(ctx, stabilizerGeometry(stabilizers.front));
    drawStabilizerSlits(ctx, stabilizerGeometry(stabilizers.rear));
    ctx.restore();
  }
  if (view === "Hull" || view === "Slots") return;
  for (const item of TRIAL_ITEMS) {
    if (pincerSlots && item.area === "blade") continue;
    if (item.area === "engine" && engineMounts) continue;
    if (view === "Engines" && item.area !== "engine") continue;
    const [x, y] = draftPoint(item.at, hullScale);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    if (view === "Footprints") {
      const reference = item.area === "engine" ? engine : equipment;
      if (reference) footprint(reference.width, reference.height);
    } else if (item.part === "battery") drawPotentialWell(ctx);
    else if (item.part === "gravity-coil") drawUtilityArtwork(ctx, "gravity");
    else drawEngineFaces("heavy-ion");
    ctx.restore();
  }
  for (const [x, y] of engineMounts ?? []) drawMountedEngine(x, y, engineType);
  if (pincerSlots) drawPincerLayer(false);
  function drawPincerLayer(underHull: boolean) {
    if (!ctx || !pincerSlots) return;
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    for (const mount of pincerMounts(pincerSlots)) {
      if (mount.underHull !== underHull || !mount.part) continue;
      ctx.save();
      ctx.translate(mount.x, mount.y);
      drawNonEngineFitting(ctx, mount);
      ctx.restore();
    }
    ctx.restore();
  }
  function drawMountedEngine(x: number, y: number, id: Loadout["side"]) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    drawEngineFaces(id);
    ctx.restore();
  }
  function drawEngineFaces(id: Loadout["side"]) {
    if (!ctx) return;
    for (const face of ENGINE_ART[id][3]) {
      ctx.beginPath();
      face.points.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle =
        face.color === "currentColor"
          ? id === "fusion"
            ? ENGINE_ACCENT.fusion
            : ENGINE_ACCENT.plasma
          : face.color;
      ctx.fill();
    }
  }
  function footprint(forward: number, across: number) {
    if (!ctx) return;
    ctx.fillStyle = COLOR.void;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(-forward / 2, -across / 2, forward, across);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLOR.text;
    ctx.lineWidth = 0.3;
    ctx.strokeRect(-forward / 2, -across / 2, forward, across);
  }
});
</script>

<canvas bind:this={canvas} aria-label={label} {width} {height}>{label}</canvas>

<style>
canvas {
  display: block;
  width: 100%;
  height: auto;
}
</style>
