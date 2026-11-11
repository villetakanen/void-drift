import { z } from "zod";

export const PlumeStyleSchema = z.enum([
  "default",
  "ion-light",
  "ion-heavy",
  "plasma",
]);
export type PlumeStyle = z.infer<typeof PlumeStyleSchema>;
export type IonStyle = Extract<PlumeStyle, "ion-light" | "ion-heavy">;
type BeamStyle = Exclude<PlumeStyle, "plasma">;
const stamps = new Map<PlumeStyle, HTMLCanvasElement>();
const SCALE = 4;

/** Cache the complete luminous mark once. Gradients never run in the frame loop. */
function stamp(style: BeamStyle) {
  const cached = stamps.get(style);
  if (cached) return cached;
  const heavy = style === "ion-heavy";
  const length = 48 * (heavy ? 1.4 : 1);
  const width = heavy ? 1.45 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((length + 4) * SCALE);
  canvas.height = Math.ceil(12 * width * SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Engine stamps require Canvas 2D");
  ctx.scale(SCALE, SCALE);
  ctx.translate(length + 2, canvas.height / SCALE / 2);
  const color =
    style === "default" ? "255,179,64" : heavy ? "112,226,255" : "112,255,226";
  for (const [band, alpha, ink] of [
    [10, 0.035, color],
    [6, 0.1, color],
    [3, 0.3, color],
    [1.6, 1, color],
    [0.6, 1, "234,255,249"],
  ] as const) {
    const fade = ctx.createLinearGradient(-length, 0, 0, 0);
    fade.addColorStop(0, `rgba(${ink},0)`);
    fade.addColorStop(0.3, `rgba(${ink},${alpha * 0.2})`);
    fade.addColorStop(0.75, `rgba(${ink},${alpha})`);
    fade.addColorStop(1, `rgba(${ink},${alpha})`);
    ctx.fillStyle = fade;
    ctx.fillRect(-length, (-band * width) / 2, length, band * width);
  }
  stamps.set(style, canvas);
  return canvas;
}
export function paintIonBeam(
  ctx: CanvasRenderingContext2D,
  size: number,
  style: IonStyle,
) {
  paintBeam(ctx, size, style);
}
export function paintBeam(
  ctx: CanvasRenderingContext2D,
  size: number,
  style: BeamStyle,
) {
  if (!(size > 0)) return;
  const image = stamp(style);
  const length = 48 * (style === "ion-heavy" ? 1.4 : 1);
  ctx.drawImage(
    image,
    -(length + 2) * size,
    (-image.height / SCALE / 2) * size,
    (image.width / SCALE) * size,
    (image.height / SCALE) * size,
  );
}
