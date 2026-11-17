import { z } from "zod";

export const PlumeStyleSchema = z.enum(["default", "plasma"]);
export type PlumeStyle = z.infer<typeof PlumeStyleSchema>;

/**
 * A beam plume's proportions and ink. Length and width are multiples of the
 * base beam (48 units long); ink is an "r,g,b" triplet. Ion engines take
 * theirs from the parts catalog.
 */
export const BeamSchema = z
  .object({
    length: z.number().positive().max(4),
    width: z.number().positive().max(4),
    ink: z.string().regex(/^\d{1,3},\d{1,3},\d{1,3}$/),
  })
  .readonly();
export type Beam = z.infer<typeof BeamSchema>;

/** The beam drawn for engines that are neither ion nor plasma. */
export const DEFAULT_BEAM: Beam = BeamSchema.parse({
  length: 1,
  width: 1,
  ink: "255,179,64",
});

const BASE_LENGTH = 48;
const CORE_INK = "234,255,249";
const stamps = new WeakMap<Beam, HTMLCanvasElement>();
const SCALE = 4;

/**
 * Cache the complete luminous mark once per beam. Beams are catalog constants,
 * so each is stamped once. Gradients never run in the frame loop.
 */
function stamp(beam: Beam) {
  const cached = stamps.get(beam);
  if (cached) return cached;
  const length = BASE_LENGTH * beam.length;
  const width = beam.width;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((length + 4) * SCALE);
  canvas.height = Math.ceil(12 * width * SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Engine stamps require Canvas 2D");
  ctx.scale(SCALE, SCALE);
  ctx.translate(length + 2, canvas.height / SCALE / 2);
  for (const [band, alpha, ink] of [
    [10, 0.035, beam.ink],
    [6, 0.1, beam.ink],
    [3, 0.3, beam.ink],
    [1.6, 1, beam.ink],
    [0.6, 1, CORE_INK],
  ] as const) {
    const fade = ctx.createLinearGradient(-length, 0, 0, 0);
    fade.addColorStop(0, `rgba(${ink},0)`);
    fade.addColorStop(0.3, `rgba(${ink},${alpha * 0.2})`);
    fade.addColorStop(0.75, `rgba(${ink},${alpha})`);
    fade.addColorStop(1, `rgba(${ink},${alpha})`);
    ctx.fillStyle = fade;
    ctx.fillRect(-length, (-band * width) / 2, length, band * width);
  }
  stamps.set(beam, canvas);
  return canvas;
}
export function paintBeam(
  ctx: CanvasRenderingContext2D,
  size: number,
  beam: Beam = DEFAULT_BEAM,
) {
  if (!(size > 0)) return;
  const image = stamp(beam);
  const length = BASE_LENGTH * beam.length;
  ctx.drawImage(
    image,
    -(length + 2) * size,
    (-image.height / SCALE / 2) * size,
    (image.width / SCALE) * size,
    (image.height / SCALE) * size,
  );
}
