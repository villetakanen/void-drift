import { rockNoise } from "./terrain-material";

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

export type RockRecipe = "mineral" | "highlands" | "ironstone";

// Study-only authored compositions; defaults retain the 02.12 specimen.
export function makeRegionalRockMaterial(
  size = 192,
  recipe: RockRecipe = "highlands",
  seed = 71,
): HTMLCanvasElement {
  const phase = (seed - 71) * 0.027;
  const offset = (seed - 71) * 0.13;
  const high =
    recipe === "mineral"
      ? [171, 143, 104]
      : recipe === "ironstone"
        ? [144, 136, 130]
        : [163, 156, 143];
  const plainColour =
    recipe === "mineral"
      ? [87, 113, 124]
      : recipe === "ironstone"
        ? [102, 95, 90]
        : [91, 90, 88];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const pixels = ctx.createImageData(size, size);
  const heights = new Float32Array(size * size);
  const values = new Float32Array(size * size);
  const basins = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = ((x + 0.5) * 2) / size - 1;
      const ny = ((y + 0.5) * 2) / size - 1;
      if (nx * nx + ny * ny >= 1) continue;
      const nz = Math.sqrt(1 - nx * nx - ny * ny);
      const gx = nx * Math.cos(phase) - ny * Math.sin(phase);
      const gy = nx * Math.sin(phase) + ny * Math.cos(phase);
      const n = (f: number, shift = 0) =>
        rockNoise(gx * f + 7 + shift + offset, gy * f - 4, nz * f + 13);
      const broad = n(3.2);
      const broken = broad * 0.35 + n(9.5) * 0.18 + n(24) * 0.065;
      // An asymmetric lower-left plain, a small upper-right deposit, and a
      // broken pale junction between them: material masses, not crater icons.
      const plain = Math.hypot((gx + 0.38) / 0.8, (gy - 0.38) / 0.62);
      const other = Math.hypot((gx - 0.73) / 0.36, (gy + 0.64) / 0.53);
      const basin =
        recipe === "mineral"
          ? smooth((broad + n(6.5) * 0.35 + 0.05) / 0.22)
          : 1 - smooth((Math.min(plain, other) - 0.8 + broken) / 0.055);
      const line = Math.abs(gx * 0.73 + gy * 0.68 - 0.09 + broad * 0.14);
      const branch = Math.abs(gx * 0.4 - gy * 0.9 + 0.18 + broad * 0.12);
      const junction = recipe === "ironstone" ? Math.min(line, branch) : line;
      const scar =
        (1 - smooth((junction - 0.018 + n(18) * 0.018) / 0.09)) *
        (1 - basin) *
        smooth((0.72 - Math.abs(gy)) / 0.2);
      const granular = n(17) * 0.5 + n(38) * 0.28 + n(75) * 0.12;
      const ground = n(7) * 0.6 + n(15) * 0.28 + n(31) * 0.12;
      const shelves =
        smooth((ground + 0.18) / 0.13) * 0.45 +
        smooth((ground - 0.07) / 0.1) * 0.55;
      const at = y * size + x;
      basins[at] = basin;
      values[at] =
        broad * 12 +
        (shelves - 0.5) * 30 +
        granular * 30 +
        scar * (recipe === "ironstone" ? 36 : 12);
      heights[at] = shelves * 0.5 + granular * 0.38 + basin * 0.1;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = ((x + 0.5) * 2) / size - 1;
      const ny = ((y + 0.5) * 2) / size - 1;
      const r2 = nx * nx + ny * ny;
      if (r2 >= 1) continue;
      const at = y * size + x;
      // Restrained local relief in the material, independent of broad Sun shade.
      const dx =
        heights[y * size + Math.min(size - 1, x + 1)] -
        heights[y * size + Math.max(0, x - 1)];
      const dy =
        heights[Math.min(size - 1, y + 1) * size + x] -
        heights[Math.max(0, y - 1) * size + x];
      const relief = Math.max(-22, Math.min(22, (-dx - dy * 0.55) * 100));

      for (let c = 0; c < 3; c++)
        pixels.data[at * 4 + c] =
          high[c] +
          (plainColour[c] - high[c]) * basins[at] +
          values[at] +
          relief;
      pixels.data[at * 4 + 3] = 255 * clamp(((1 - Math.sqrt(r2)) * size) / 2);
    }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

// A diagnostic local-contrast treatment of the generated raster, not new terrain.
// Alpha-weighted box means avoid dark fringes at the transparent limb.
export function enhanceRockStructure(
  source: HTMLCanvasElement,
): HTMLCanvasElement {
  const { width, height } = source;
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const ctx = output.getContext("2d");
  const input = source.getContext("2d");
  if (!ctx || !input) return output;
  const pixels = input.getImageData(0, 0, width, height);
  const result = ctx.createImageData(width, height);
  result.data.set(pixels.data);
  const stride = width + 1;
  const sums = new Float64Array(stride * (height + 1));
  const weights = new Float64Array(sums.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      const alpha = pixels.data[at + 3] / 255;
      const value =
        (pixels.data[at] + pixels.data[at + 1] + pixels.data[at + 2]) / 3;
      const i = (y + 1) * stride + x + 1;
      sums[i] =
        value * alpha + sums[i - 1] + sums[i - stride] - sums[i - stride - 1];
      weights[i] =
        alpha + weights[i - 1] + weights[i - stride] - weights[i - stride - 1];
    }
  const mean = (x: number, y: number, radius: number) => {
    const left = Math.max(0, x - radius),
      right = Math.min(width, x + radius + 1);
    const top = Math.max(0, y - radius),
      bottom = Math.min(height, y + radius + 1);
    const area = (map: Float64Array) =>
      map[bottom * stride + right] -
      map[top * stride + right] -
      map[bottom * stride + left] +
      map[top * stride + left];
    return area(sums) / Math.max(0.001, area(weights));
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      if (!pixels.data[at + 3]) continue;
      const value =
        (pixels.data[at] + pixels.data[at + 1] + pixels.data[at + 2]) / 3;
      const change = Math.max(
        -32,
        Math.min(
          32,
          (value - mean(x, y, 2)) * 1.35 + (value - mean(x, y, 6)) * 0.8,
        ),
      );
      for (let c = 0; c < 3; c++) result.data[at + c] += change;
    }
  ctx.putImageData(result, 0, 0);
  return output;
}
