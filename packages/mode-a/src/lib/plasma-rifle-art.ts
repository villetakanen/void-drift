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
