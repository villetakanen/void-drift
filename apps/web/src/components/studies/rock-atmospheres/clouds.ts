import type { AtmosphereTreatment } from "./atmosphere";
import type { CloudFields } from "./cloud-materials";

export const CLOUD_COVERAGE = ["02.5", "Sparse", "Broad"] as const;
export type CloudCoverage = (typeof CLOUD_COVERAGE)[number];
export const CLOUD_OPACITY = ["Thin", "Opaque"] as const;
export type CloudOpacity = (typeof CLOUD_OPACITY)[number];

export const CLOUD_SHADOWS = [
  "02.11 shadow",
  "Readable night",
  "Deep night",
] as const;

// Study-only cloud cover. A periodic scalar atlas keeps holes in
// the cover; the opaque authored-rock projector deliberately fills such holes.
export function makeCloudPainter(
  textures: CloudFields = new Map(),
  material: () => string = () => "Procedural",
  generatedSize = 384,
) {
  const width = 384,
    height = 192;
  let size = 128;
  const fields = new Map<string, Float32Array>();
  for (const kind of ["Cloud banks", "Cloud bands"]) {
    const field = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      const lat = (y / (height - 1) - 0.5) * Math.PI;
      for (let x = 0; x < width; x++) {
        const lon = (x / width) * Math.PI * 2;
        const curl = Math.sin(lon * 3 + Math.sin(lat * 5));
        const detail =
          Math.sin(lon * 13 + lat * 17 + curl * 2) * 0.12 +
          Math.sin(lon * 23 - lat * 29) * 0.06;
        const shape =
          kind === "Cloud banks"
            ? Math.sin(lon * 4 + lat * 7 + curl) * 0.48 +
              Math.cos(lon * 7 - lat * 5) * 0.28 +
              detail
            : Math.cos(lat * 14 + curl * 1.3) * 0.55 + detail;
        field[y * width + x] = shape;
      }
    }
    fields.set(kind, field);
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cloud canvas unavailable");
  let pixels = ctx.createImageData(size, size);
  let previous = "";
  return (
    target: CanvasRenderingContext2D,
    radius: number,
    kind: AtmosphereTreatment,
    seconds: number,
    sunAngle: number,
    coverage: CloudCoverage = "02.5",
    opacity: CloudOpacity = "Thin",
    shadowFloor = 0.42,
    brightFace = false,
    dayBrightness = 1,
  ) => {
    const procedural = fields.get(kind);
    if (!procedural) return;
    const texture = textures.get(material());
    const field = texture?.density ?? procedural;
    const w = texture?.width ?? width;
    const h = texture?.height ?? height;
    const desiredSize = texture ? generatedSize : 128;
    if (size !== desiredSize) {
      size = desiredSize;
      canvas.width = canvas.height = size;
      pixels = ctx.createImageData(size, size);
      previous = "";
    }
    const key = `${material()}:${kind}:${seconds}:${sunAngle}:${coverage}:${opacity}:${shadowFloor}:${brightFace}:${dayBrightness}`;
    const mask = (value: number) => {
      if (texture?.coverageThreshold !== undefined) {
        const offset =
          coverage === "Sparse" ? 0.12 : coverage === "Broad" ? -0.08 : 0;
        const center = Math.max(
          0.002,
          Math.min(0.98, texture.coverageThreshold + offset),
        );
        const halfWidth = Math.min(0.2, center * 0.95);
        const t = Math.max(
          0,
          Math.min(1, (value - center) / (2 * halfWidth) + 0.5),
        );
        return t * t * (3 - 2 * t);
      }
      if (texture) {
        const threshold =
          coverage === "Sparse" ? 0.28 : coverage === "Broad" ? 0.02 : 0.1;
        const t = Math.max(0, Math.min(1, (value - threshold) / 0.4));
        return t * t * (3 - 2 * t);
      }
      const t = Math.max(
        0,
        Math.min(
          1,
          coverage === "02.5"
            ? (value - 0.04) * 2.3
            : (value - (coverage === "Sparse" ? 0.18 : -0.18)) / 0.18,
        ),
      );
      return t * t * (3 - 2 * t);
    };
    if (key !== previous) {
      previous = key;
      const phase = (seconds * Math.PI * 2) / 38;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const nx = ((x + 0.5) * 2) / size - 1;
          const ny = ((y + 0.5) * 2) / size - 1;
          const r2 = nx * nx + ny * ny;
          const at = (y * size + x) * 4;
          pixels.data[at + 3] = 0;
          if (r2 >= 1) continue;
          const nz = Math.sqrt(1 - r2);
          const lon = Math.atan2(nx, nz) + phase;
          const u = ((((lon / (Math.PI * 2) + 0.5) * w) % w) + w) % w;
          const v = (Math.asin(ny) / Math.PI + 0.5) * (h - 1);
          const ix = Math.floor(u),
            iy = Math.floor(v);
          const fx = u - ix,
            fy = v - iy;
          const a =
            mask(field[iy * w + ix]) * (1 - fx) +
            mask(field[iy * w + ((ix + 1) % w)]) * fx;
          const b =
            mask(field[Math.min(h - 1, iy + 1) * w + ix]) * (1 - fx) +
            mask(field[Math.min(h - 1, iy + 1) * w + ((ix + 1) % w)]) * fx;
          const density = texture
            ? (field[iy * w + ix] * (1 - fx) +
                field[iy * w + ((ix + 1) % w)] * fx) *
                (1 - fy) +
              (field[Math.min(h - 1, iy + 1) * w + ix] * (1 - fx) +
                field[Math.min(h - 1, iy + 1) * w + ((ix + 1) % w)] * fx) *
                fy
            : 1;
          // Retain density detail in opaque cores as well as the coverage edges.
          const detail = texture ? 0.7 + 0.3 * density : 1;
          const facing =
            nx * Math.cos(sunAngle) * 0.88 +
            ny * Math.sin(sunAngle) * 0.88 +
            Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * 0.475;
          const night = Math.min(1, Math.max(0, -facing / 0.25));
          const blend = night * night * (3 - 2 * night);
          // Change RGB on the shaded hemisphere only. Never make opaque clouds
          // transparent to obtain darkness; openings and the sunlit side stay fixed.
          const light =
            0.42 + 0.58 * Math.max(0, facing) - (0.42 - shadowFloor) * blend;
          pixels.data[at] = 193 * light * detail;
          pixels.data[at + 1] = 216 * light * detail;
          pixels.data[at + 2] = 222 * light * detail;
          if (brightFace) {
            // Density controls coverage; do not turn gray density samples into
            // dark pigment. Preserve the old fully shaded RGB exactly.
            const whiteDetail = texture ? 0.94 + 0.06 * density : 1;
            const daylight =
              (0.94 + 0.06 * Math.max(0, facing)) * whiteDetail * dayBrightness;
            pixels.data[at] =
              193 * light * detail * blend + 245 * daylight * (1 - blend);
            pixels.data[at + 1] =
              216 * light * detail * blend + 248 * daylight * (1 - blend);
            pixels.data[at + 2] =
              222 * light * detail * blend + 250 * daylight * (1 - blend);
          }
          pixels.data[at + 3] =
            255 *
            (a * (1 - fy) + b * fy) *
            (opacity === "Opaque" ? 1 : 0.62) *
            Math.min(1, nz * 8);
        }
      ctx.putImageData(pixels, 0, 0);
    }
    target.drawImage(canvas, -radius, -radius, radius * 2, radius * 2);
  };
}
