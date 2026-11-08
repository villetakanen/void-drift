import {
  BUILD_FLIGHT_SCALE,
  type BuildMount,
  buildMounts,
  defaultLoadout,
  drawBuild,
  engineOffset,
  slotAccepts,
} from "@void-drift/mode-a";
import { ENGINE_ART } from "../../../../../../packages/mode-a/src/lib/engine-art";
import { coil } from "./drawings";
import { underRing, underRings } from "./UnderRings";

const inset = underRings.find((ring) => ring.id === "rim-inset");
if (!inset) throw new Error("The selected M reference is missing");
const selectedFaces = [...underRing(inset.radius), ...coil("shell")];

export const sizingFleet = (
  ["wasp", "scout", "fighter", "corvette"] as const
).map((chassis) => {
  const build = defaultLoadout(chassis);
  build.side = "ion";
  build.aft.fill("ion");
  // Preserve the mounting context reviewed at the 100% decision. The later
  // Fighter mount handoff is shown by the production Lab fleet, not rewritten here.
  const mounts = buildMounts(build).map((mount) =>
    chassis === "fighter" && mount.group === "hull"
      ? { ...mount, x: 2 - mount.index * 12 }
      : mount,
  );
  return {
    chassis,
    build,
    mounts,
    engines: mounts.filter((mount) => slotAccepts(mount.type, "E")),
    coils: mounts.filter(
      (mount) => !slotAccepts(mount.type, "E") && slotAccepts(mount.type, "U"),
    ),
    belowHull: chassis === "wasp" || chassis === "scout",
  };
});
export type SizingShip = (typeof sizingFleet)[number];
export type EquipmentLayer = "production" | "above";
export const sizingViews = [
  { label: "Enlarged · 3×", scale: 3, width: 240, height: 400, x: 120, y: 205 },
  { label: "Native · 1×", scale: 1, width: 120, height: 140, x: 60, y: 70 },
  {
    label: "Flight · 0.65×",
    scale: BUILD_FLIGHT_SCALE,
    width: 120,
    height: 140,
    x: 60,
    y: 70,
  },
] as const;
export type SizingView = (typeof sizingViews)[number];

function engine(
  ctx: CanvasRenderingContext2D,
  ship: SizingShip,
  mount: BuildMount,
) {
  const pose =
    ship.chassis === "wasp"
      ? 3
      : mount.key === "left"
        ? 1
        : mount.key === "right"
          ? 2
          : 3;
  ctx.save();
  ctx.translate(mount.x, mount.y);
  ctx.rotate(mount.angle);
  ctx.translate(engineOffset(ship.build, mount), 0);
  for (const face of ENGINE_ART.ion[pose]) {
    ctx.fillStyle = face.color;
    ctx.beginPath();
    face.points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function equipment(
  ctx: CanvasRenderingContext2D,
  mount: BuildMount,
  scale: number,
) {
  ctx.save();
  ctx.translate(mount.x, mount.y);
  ctx.rotate(mount.angle + Math.PI / 2); // Nose-up reference → local +x forward.
  ctx.scale(scale, scale);
  for (const face of selectedFaces) {
    ctx.fillStyle = face.color;
    ctx.beginPath();
    face.points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Static study fixture. Actual mount coordinates and production art; no new part ID. */
export function drawSizingShip(
  ctx: CanvasRenderingContext2D,
  ship: SizingShip,
  view: SizingView,
  coilScale: number,
  layer: EquipmentLayer,
) {
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(view.scale, view.scale);
  const enginesBelow = (mount: BuildMount) =>
    ship.chassis !== "wasp" &&
    (ship.chassis === "scout" || mount.group === "side");
  const coilsBelow = layer === "production" && ship.belowHull;
  // Preserve production order beneath the hull (side, hull, aft), including
  // Scout's coil between its side engines and aft engine when they overlap.
  for (const mount of ship.mounts) {
    if (slotAccepts(mount.type, "E")) {
      if (enginesBelow(mount)) engine(ctx, ship, mount);
    } else if (coilsBelow && slotAccepts(mount.type, "U")) {
      equipment(ctx, mount, coilScale);
    }
  }
  // The real hull and stabilizers, with fittings composed in their proper layers.
  drawBuild(ctx, ship.build, 0, 0, 0, 1, "", undefined, []);
  for (const mount of ship.engines) {
    if (!enginesBelow(mount)) engine(ctx, ship, mount);
  }
  if (!coilsBelow) {
    for (const mount of ship.coils) equipment(ctx, mount, coilScale);
  }
  ctx.restore();
}
