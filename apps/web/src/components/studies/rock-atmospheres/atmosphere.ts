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
export const RIM_LIGHTS = [
  "Sunlit rim",
  "Airglow",
  "Tangents",
  "Nightward",
  "Dayward",
  "Broad arcs",
] as const;
export type RimLight = (typeof RIM_LIGHTS)[number];
export function isRimLight(value: string): value is RimLight {
  return (RIM_LIGHTS as readonly string[]).includes(value);
}

export const AIR_BOUNDARIES = [
  "Current line",
  "Soft layer",
  "Connected air",
  ...RIM_LIGHTS,
] as const;
export type AirBoundary = (typeof AIR_BOUNDARIES)[number];

export const AIR_LIGHTING = [
  "02.4 light",
  "Separate air",
  "Face scatter",
] as const;
export type AirLighting = (typeof AIR_LIGHTING)[number];

export type AtmosphereTreatment = (typeof ATMOSPHERE_TREATMENTS)[number];

/** One cached envelope, Sun at left. Body stays on its original painter. */
export function makeEnvelope(
  radius: number,
  treatment: AtmosphereTreatment = "Limb haze",
  faceScatter = false,
  boundary: AirBoundary = "Current line",
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
              0.48 *
                Math.exp(
                  -(
                    ((r - (extent - 0.7)) /
                      (boundary === "Current line" || r > extent - 0.7
                        ? 0.65
                        : 2.4)) **
                    2
                  ),
                );
        if (boundary === "Connected air") {
          // Same upper edge as Soft layer, joined to a continuous air column.
          column += 0.22 * Math.sqrt(Math.max(0, 1 - (r / extent) ** 2));
        }
      }
      if (isRimLight(boundary)) {
        // Keep the low atmosphere; remove the high material shell entirely.
        column =
          r < radius
            ? 0.055 + 0.36 * (r / radius) ** 7
            : 0.395 * (1 - (r - radius) / AIR_DEPTH) ** 1.7;
      }
      const daylight = 0.3 + 0.7 * Math.max(0, -nx / (Math.hypot(nx, ny) || 1));
      // A projected, sunlit air column across the whole envelope, not just
      // its silhouette. Keeps the existing upper edge exactly where it was.
      if (faceScatter) {
        const nz = Math.sqrt(Math.max(0, 1 - (r / extent) ** 2));
        const sunlit = Math.max(0, -nx * 0.88 + nz * 0.475);
        column += 0.24 * nz * (0.2 + 0.8 * Math.sqrt(sunlit));
      }
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

/** Fresh LFX, not opacity or a density field. Hard-light values above neutral
 * brighten the image; alpha tapers the light without painting a dark shell. */
export function makeRimLight(radius: number, kind: RimLight, tint = "#ffffff") {
  const size = 384,
    extent = radius + AIR_DEPTH + 3;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Rim light canvas unavailable");
  const pixels = ctx.createImageData(size, size);
  const gains = [1, 3, 5].map(
    (at) => Number.parseInt(tint.slice(at, at + 2), 16) / 255,
  );
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - size / 2) / (size / 2);
      const ny = (y + 0.5 - size / 2) / (size / 2);
      const radial = Math.hypot(nx, ny);
      const r = radial * extent;
      const distance = r - (radius + AIR_DEPTH - 0.7);
      const core = Math.exp(-((distance / 0.55) ** 2));
      const halo = Math.exp(-((distance / 1.65) ** 2));
      const facing = Math.max(0, -nx / (radial || 1));
      let angular =
        kind === "Sunlit rim"
          ? 0.06 + 0.94 * facing ** 0.7
          : 0.58 + 0.24 * facing;
      if (
        kind === "Tangents" ||
        kind === "Nightward" ||
        kind === "Dayward" ||
        kind === "Broad arcs"
      ) {
        // Angle from the Sun-facing axis, not geographic latitude or poles.
        // acos supplies the symmetric pair of arcs on either side of that axis.
        const angle = Math.acos(Math.max(-1, Math.min(1, -nx / (radial || 1))));
        const centre =
          Math.PI / 2 +
          (kind === "Tangents"
            ? 0
            : kind === "Dayward"
              ? -Math.PI / 9
              : Math.PI / 9);
        const width = kind === "Broad arcs" ? Math.PI / 5 : Math.PI / 10;
        angular = 0.06 + 0.94 * Math.exp(-(((angle - centre) / width) ** 2));
      }
      const at = (y * size + x) * 4;
      pixels.data[at] = 127.5 + (143 + 35 * core - 127.5) * gains[0];
      pixels.data[at + 1] = 127.5 + (188 + 35 * core - 127.5) * gains[1];
      pixels.data[at + 2] = 127.5 + (245 - 127.5) * gains[2];
      pixels.data[at + 3] = 255 * angular * (0.78 * core + 0.17 * halo);
    }
  ctx.putImageData(pixels, 0, 0);
  return { canvas, extent };
}
