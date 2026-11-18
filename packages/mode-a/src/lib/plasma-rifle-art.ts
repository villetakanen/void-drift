import { PLASMA_RIFLE_BOUNDS, PLASMA_RIFLE_PATHS } from "./plasma-rifle-paths";

export { PLASMA_RIFLE_BOUNDS, PLASMA_RIFLE_PATHS };
/** Match the accepted cannon-relative scale; origin is the housing centre. */
export const PLASMA_RIFLE_SCALE = 16 / 19.501797;
export const PLASMA_RIFLE_MOUTHS = {
  primary: [0, -23.31042],
  left: [-4.93795, -8.57817],
  right: [4.88341, -8.57817],
} as const;
/** Conservative source rectangle converted to forward/across world units. */
export const PLASMA_RIFLE_ENVELOPE = [
  [PLASMA_RIFLE_BOUNDS.left, PLASMA_RIFLE_BOUNDS.front],
  [PLASMA_RIFLE_BOUNDS.right, PLASMA_RIFLE_BOUNDS.front],
  [PLASMA_RIFLE_BOUNDS.right, PLASMA_RIFLE_BOUNDS.rear],
  [PLASMA_RIFLE_BOUNDS.left, PLASMA_RIFLE_BOUNDS.rear],
].map(([x, y]) => [-y * PLASMA_RIFLE_SCALE, x * PLASMA_RIFLE_SCALE] as const);

let paths: readonly Path2D[] | undefined;
export function drawPlasmaRifle(
  ctx: CanvasRenderingContext2D,
  flightScale: number,
) {
  paths ??= PLASMA_RIFLE_PATHS.map((face) => new Path2D(face.path));
  const cached = paths;
  ctx.save();
  ctx.rotate(Math.PI / 2);
  ctx.scale(PLASMA_RIFLE_SCALE / flightScale, PLASMA_RIFLE_SCALE / flightScale);
  PLASMA_RIFLE_PATHS.forEach((face, i) => {
    ctx.save();
    const [a, b, c, d, e, f] = face.matrix;
    ctx.transform(a, b, c, d, e, f);
    ctx.fillStyle = face.fill;
    ctx.fill(cached[i]);
    ctx.restore();
  });
  ctx.restore();
}

/** Current channel brightness, read solely from the paid charge cycle. */
export function plasmaChargeAppearance(
  state: import("./schemas/salvage").PlasmaRifleCycle | undefined,
) {
  const center =
    state && (state.phase === "charging" || state.phase === "venting")
      ? Math.max(0, Math.min(1, state.charge))
      : 0;
  return { center, sides: Math.max(0, center * 2 - 1) };
}

// The charged prototype's side-strip positions and directions, in source units.
const PURGE_STRIPS = [
  { across: -4.86453, aft: -8.66873, angle: -0.305233 },
  { across: 4.62775, aft: -8.10396, angle: 0.305233 },
] as const;
const PRIMARY_TIP = -PLASMA_RIFLE_MOUTHS.primary[1] * PLASMA_RIFLE_SCALE;

let chargeSprite: HTMLCanvasElement | undefined;
function beadSprite() {
  if (chargeSprite || typeof document === "undefined") return chargeSprite;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const heat = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  heat.addColorStop(0, "white");
  heat.addColorStop(0.25, "#ffe4a1");
  heat.addColorStop(0.55, "#ffad26");
  heat.addColorStop(1, "rgba(255,115,20,0)");
  ctx.fillStyle = heat;
  ctx.fillRect(0, 0, 128, 128);
  chargeSprite = canvas;
  return canvas;
}

let rifleSilhouette: Path2D | undefined;
/** Shared opaque fitting silhouette in the same world-unit coordinates as the light. */
function chargeSilhouette() {
  if (rifleSilhouette) return rifleSilhouette;
  const silhouette = new Path2D();
  for (const face of PLASMA_RIFLE_PATHS) {
    const [a, b, c, d, e, f] = face.matrix;
    const scale = PLASMA_RIFLE_SCALE;
    silhouette.addPath(
      new Path2D(face.path),
      new DOMMatrix([
        -b * scale,
        a * scale,
        -d * scale,
        c * scale,
        -f * scale,
        e * scale,
      ]),
    );
  }
  rifleSilhouette = silhouette;
  return silhouette;
}

/** Paint live light in mount coordinates expressed in world units. */
export function drawPlasmaRifleCharge(
  ctx: CanvasRenderingContext2D,
  appearance: ReturnType<typeof plasmaChargeAppearance>,
) {
  if (!(appearance.center > 0)) return;
  const paintBead = (charge: number, length = 1, offset = 0) => {
    const radius = 5;
    ctx.save();
    ctx.translate(13 + offset, 0);
    ctx.scale(radius * length, 0.9 * radius * 0.7);
    ctx.globalAlpha *= charge;
    const sprite = beadSprite();
    if (sprite) ctx.drawImage(sprite, -1, -1, 2, 2);
    else {
      // Non-browser Canvas implementations can still draw the same live cue.
      const heat = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      heat.addColorStop(0, "white");
      heat.addColorStop(0.25, "#ffe4a1");
      heat.addColorStop(0.55, "#ffad26");
      heat.addColorStop(1, "rgba(255,115,20,0)");
      ctx.fillStyle = heat;
      ctx.fillRect(-1, -1, 2, 2);
    }
    ctx.restore();
  };
  const paintChannels = () => {
    if (appearance.sides > 0) {
      for (const strip of PURGE_STRIPS) {
        ctx.save();
        ctx.translate(
          -strip.aft * PLASMA_RIFLE_SCALE,
          strip.across * PLASMA_RIFLE_SCALE,
        );
        ctx.rotate(strip.angle);
        ctx.scale(6.3559437 / 19.501797, 1.9213436 / 2.4885366);
        ctx.translate(-PRIMARY_TIP, 0);
        paintBead(appearance.sides);
        ctx.restore();
      }
    }
    paintBead(appearance.center, 1.7, -1.7);
  };
  // A subdued spill stays visible over empty space; full light is confined to
  // the solid fitting, which is subsequently occluded by an under-mounted hull.
  ctx.save();
  ctx.globalAlpha *= 0.25;
  paintChannels();
  ctx.restore();
  ctx.save();
  ctx.clip(chargeSilhouette());
  ctx.globalAlpha *= 0.75;
  paintChannels();
  ctx.restore();
}
