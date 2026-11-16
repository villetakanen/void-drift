import type { AtmosphereTreatment } from "./atmosphere";

// Study-only translucent cloud cover. A periodic scalar atlas keeps holes in
// the cover; the opaque authored-rock projector deliberately fills such holes.
export function makeCloudPainter() {
  const width = 384,
    height = 192,
    size = 128;
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
        const cover = Math.max(0, Math.min(1, (shape - 0.04) * 2.3));
        field[y * width + x] = cover * cover * (3 - 2 * cover);
      }
    }
    fields.set(kind, field);
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cloud canvas unavailable");
  const pixels = ctx.createImageData(size, size);
  let previous = "";
  return (
    target: CanvasRenderingContext2D,
    radius: number,
    kind: AtmosphereTreatment,
    seconds: number,
    sunAngle: number,
  ) => {
    const field = fields.get(kind);
    if (!field) return;
    const key = `${kind}:${seconds}:${sunAngle}`;
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
          const u =
            ((((lon / (Math.PI * 2) + 0.5) * width) % width) + width) % width;
          const v = (Math.asin(ny) / Math.PI + 0.5) * (height - 1);
          const ix = Math.floor(u),
            iy = Math.floor(v);
          const fx = u - ix,
            fy = v - iy;
          const a =
            field[iy * width + ix] * (1 - fx) +
            field[iy * width + ((ix + 1) % width)] * fx;
          const b =
            field[Math.min(height - 1, iy + 1) * width + ix] * (1 - fx) +
            field[Math.min(height - 1, iy + 1) * width + ((ix + 1) % width)] *
              fx;
          const light =
            0.42 +
            0.58 *
              Math.max(0, nx * Math.cos(sunAngle) + ny * Math.sin(sunAngle));
          pixels.data[at] = 193 * light;
          pixels.data[at + 1] = 216 * light;
          pixels.data[at + 2] = 222 * light;
          pixels.data[at + 3] =
            255 * (a * (1 - fy) + b * fy) * 0.62 * Math.min(1, nz * 8);
        }
      ctx.putImageData(pixels, 0, 0);
    }
    target.drawImage(canvas, -radius, -radius, radius * 2, radius * 2);
  };
}
