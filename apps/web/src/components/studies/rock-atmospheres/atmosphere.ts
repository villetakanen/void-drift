// Study-only hypothesis. World units and seconds; never installed in play.
export const AIR_DEPTH = 10;
export const DRAG_RATE = 0.8;
export const SPIN_SECONDS = 31.3;

export const ATMOSPHERE_TREATMENTS = [
  "Limb haze",
  "Upper layer",
  "Cloud banks",
  "Cloud bands",
] as const;
export type AtmosphereTreatment = (typeof ATMOSPHERE_TREATMENTS)[number];

/** One cached envelope, Sun at left. Body stays on its original painter. */
export function makeEnvelope(
  radius: number,
  treatment: AtmosphereTreatment = "Limb haze",
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Atmosphere canvas unavailable");
  const pixels = ctx.createImageData(256, 256);
  const extent = radius + AIR_DEPTH;
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const nx = (x + 0.5 - 128) / 128;
      const ny = (y + 0.5 - 128) / 128;
      const r = Math.hypot(nx, ny) * extent;
      if (r >= extent) continue;
      // Thin visible column over the face, denser at the limb, soft outer falloff.
      let column =
        r < radius
          ? 0.035 + 0.36 * (r / radius) ** 7
          : 0.395 * (1 - (r - radius) / AIR_DEPTH) ** 1.7;
      if (
        treatment === "Upper layer" ||
        treatment === "Cloud banks" ||
        treatment === "Cloud bands"
      ) {
        column =
          r < radius
            ? 0.055 + 0.36 * (r / radius) ** 7
            : 0.395 * (1 - (r - radius) / AIR_DEPTH) ** 1.7 +
              0.48 * Math.exp(-(((r - (extent - 0.7)) / 0.65) ** 2));
      }
      const daylight = 0.3 + 0.7 * Math.max(0, -nx / (Math.hypot(nx, ny) || 1));
      const at = (y * 256 + x) * 4;
      // Material colour, not an interface role: a provisional pale mineral blue.
      pixels.data[at] = 151;
      pixels.data[at + 1] = 195;
      pixels.data[at + 2] = 211;
      pixels.data[at + 3] = 255 * column * daylight;
    }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}
