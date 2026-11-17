import { rockNoise } from "./terrain-material";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

/** Study-only: explicit material provinces, with detail concentrated at contacts.
 * Hybrid uses the same province layout, sampling existing authored stone patches.
 * No broad directional illumination is added here; LFX owns that lighting.
 */
export function makeStructuredMaterial(
  seed: number,
  patches?: readonly HTMLCanvasElement[],
  regions?: { offsetX?: number; offsetY?: number; scale?: number },
  appearance?: "mercurial",
) {
  const size = 192;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Rock material canvas unavailable");
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const provinces = Array.from({ length: 9 }, (_, i) => ({
    x: random(),
    y: random(),
    weight: 0.7 + random() * 0.6,
    value: i % 3 === 0 ? 76 + random() * 16 : 122 + random() * 48,
    roughness: i % 3 === 0 ? 0.16 : 0.65 + random() * 0.35,
    patch: Math.floor(random() * 3),
    ox: random() * 0.25,
    oy: random() * 0.25,
  }));
  const sources = patches?.map((patch) => {
    const input = patch.getContext("2d");
    if (!input) throw new Error("Stone patch unavailable");
    return input.getImageData(0, 0, size, size).data;
  });
  const output = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      const n = (f: number, offset = 0) =>
        rockNoise(u * f + seed * 0.19 + offset, v * f + 17, seed * 0.07);
      let wx = u + n(4.3) * 0.09 + n(19) * 0.012;
      let wy = v + n(4.3, 51) * 0.09 + n(19, 51) * 0.012;
      // Optional composition changes leave seed generation and sampled texture
      // coordinates untouched. The absent-options path preserves 02.20 exactly.
      if (regions) {
        wx = 0.5 + (wx - 0.5) / (regions.scale ?? 1) - (regions.offsetX ?? 0);
        wy = 0.5 + (wy - 0.5) / (regions.scale ?? 1) - (regions.offsetY ?? 0);
      }
      let first = Infinity,
        second = Infinity,
        index = 0;
      provinces.forEach((p, i) => {
        const d = Math.hypot(wx - p.x, wy - p.y) * p.weight;
        if (d < first) {
          second = first;
          first = d;
          index = i;
        } else if (d < second) second = d;
      });
      const p = provinces[index];
      const contact = 1 - smooth((second - first) / 0.035);
      const strata = n(14) + n(37) * 0.4;
      const shelf = smooth((strata - 0.04) / 0.11);
      // Quiet provinces, broken shelves, and narrow contacts have separate roles.
      const detail = p.roughness * ((shelf - 0.5) * 24 + n(82) * 9);
      const edge = contact * (n(27) > 0.08 ? 24 : -17);
      const value = p.value + detail + edge + n(5) * 5;
      const at = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        if (sources) {
          // Central opaque patches; continuous within each province, with no
          // per-pixel shuffling or new global sphere shading baked into the atlas.
          const sx = Math.floor(
            (0.24 + ((u * 0.35 + p.ox) % 0.5)) * (size - 1),
          );
          const sy = Math.floor(
            (0.24 + ((v * 0.35 + p.oy) % 0.5)) * (size - 1),
          );
          const sample = sources[p.patch][(sy * size + sx) * 4 + c];
          if (appearance === "mercurial") {
            // Reuse fine stone structure, assign mineral colours by province.
            // Dark terrains are material, not a painted night-side hemisphere.
            const colours = [
              [212, 155, 103],
              [99, 146, 183],
              [208, 192, 158],
              [112, 100, 142],
            ];
            const colour = colours[index % colours.length];
            const sourceAt = (sy * size + sx) * 4;
            const patch = sources[p.patch];
            const luminance =
              patch[sourceAt] * 0.2126 +
              patch[sourceAt + 1] * 0.7152 +
              patch[sourceAt + 2] * 0.0722;
            const texture = Math.max(
              0.18,
              Math.min(1.65, 1 + (luminance - 125) / 85),
            );
            const terrain = p.value < 100 ? 0.58 : 1.12;
            output.data[at + c] = colour[c] * texture * terrain + edge * 0.55;
          } else
            output.data[at + c] = sample * (0.83 + p.value / 600) + edge * 0.4;
        } else output.data[at + c] = value * [1.025, 1, 0.96][c];
      }
      output.data[at + 3] = 255;
    }
  ctx.putImageData(output, 0, 0);
  return canvas;
}
