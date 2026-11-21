import { type SkyMaterial, SkyMaterialSchema } from "../schemas/flight-sky";

export const SKY_TILE_PERIOD = 3072;
export const SKY_BANK = { x: 0.37, y: 0.394 } as const;
export const SOL_DUST_SEED = 191126;

function hash(x: number, y: number) {
  let n = Math.imul(x + SOL_DUST_SEED, 374761393) ^ Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// The integer lattice wraps at both edges so a bank can cross the tile boundary.
function noise(x: number, y: number, cells: number) {
  const px = x * cells;
  const py = y * cells;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const sample = (a: number, b: number) =>
    hash((a + cells) % cells, (b + cells) % cells);
  return (
    (sample(ix, iy) * (1 - u) + sample(ix + 1, iy) * u) * (1 - v) +
    (sample(ix, iy + 1) * (1 - u) + sample(ix + 1, iy + 1) * u) * v
  );
}
const gaussian = (x: number) => Math.exp(-x * x);

function dustField({ reach, dustSeed }: SkyMaterial) {
  const narrow = Math.max(0, 1 - 2 * reach);
  const broad = Math.max(0, 2 * reach - 1);
  const breadth = 1 - 0.24 * narrow + 0.42 * broad;
  const contrast = 1 + 0.35 * narrow - 0.17 * broad;
  const sol = dustSeed === SOL_DUST_SEED;
  const phaseX = sol ? 0 : hash(dustSeed, 31);
  const phaseY = sol ? 0 : hash(dustSeed, 32);
  const notch = sol ? 0.006 : (hash(dustSeed, 33) - 0.5) * 0.12;
  const notchWidth = sol ? 0.029 : 0.015 + 0.04 * hash(dustSeed, 34);
  const crest = sol ? -0.018 : (hash(dustSeed, 35) - 0.5) * 0.1;

  return (u: number, v: number) => {
    const along = u - SKY_BANK.x - Math.round(u - SKY_BANK.x);
    const across = (v - SKY_BANK.y - Math.round(v - SKY_BANK.y)) / breadth;
    const bank = gaussian(along / 0.088);
    const silver = gaussian((along + 0.25) / 0.076);
    const shoulder = 0.013 + 0.038 * bank + 0.009 * silver;
    if (Math.abs(across) > 5 * shoulder) return { light: 0, warmth: 0 };
    const x = u + phaseX,
      y = v + phaseY;
    const cloud = noise(x, y, 32) - 0.5;
    const flecks = noise(x + cloud * 0.023, y, 112) - 0.5;
    const grit = noise(x, y, 384) - 0.5;
    const edge = across + cloud * 0.024 + flecks * 0.012 + grit * 0.004;
    const peak = gaussian((along - crest) / 0.045);
    const fringe = gaussian(edge / shoulder) * (0.2 + bank * 0.4);
    const shelf = gaussian((edge - 0.004) / (0.004 + shoulder * 0.27));
    const headland = gaussian((along - notch) / notchWidth);
    const lane = edge + 0.013 - 0.031 * headland - 0.006 * cloud;
    const cut = gaussian(lane / (0.003 + 0.014 * headland));
    const inlet = gaussian((lane + 0.013 + cloud * 0.024) / 0.006);
    const fragments = noise(x + cloud * 0.048, y + flecks * 0.025, 72);
    const light =
      (fringe + shelf * (0.36 + 1.3 * peak + 0.55 * silver)) *
      (1 - 0.985 * cut) *
      (1 - 0.85 * bank * inlet) *
      (0.26 + 1.65 * fragments ** 2 + flecks * 0.38 + grit * 0.28);
    return {
      light: Math.max(0, light) ** contrast,
      warmth: Math.min(
        1,
        Math.max(
          0,
          bank * 0.32 + peak * 0.46 + cut * bank * 0.65 + cloud * 0.42,
        ),
      ),
    };
  };
}

/** One opaque periodic tile. All sampling and star stamping happens during preparation. */
export function prepareSkyTile(input: SkyMaterial, size: 384 | 1536) {
  const material = SkyMaterialSchema.parse(input);
  const sample = dustField(material);
  const surface = new OffscreenCanvas(size, size);
  const ctx = surface.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Sky preparation requires Canvas 2D");
  const pixels = ctx.createImageData(size, size);
  // Normalize the band energy at the Sol reference. The broad end is dimmer.
  let sum = 0;
  const grid = 128;
  for (let y = 0; y < grid; y++)
    for (let x = 0; x < grid; x++) sum += sample(x / grid, y / grid).light;
  const gain =
    ((0.036189 * grid * grid) / sum) *
    (1 - 0.18 * Math.max(0, material.reach * 2 - 1));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const { light, warmth } = sample(x / size, y / size);
      const energy = light * gain;
      const value =
        ((2.4 * energy) / (1.75 + energy)) * (0.78 + 0.44 * hash(x, y)) * 0.45;
      const i = (y * size + x) * 4;
      pixels.data[i] = 5 + value * (86 + 52 * warmth);
      pixels.data[i + 1] = 5 + value * (88 + 25 * warmth);
      pixels.data[i + 2] = 12 + value * (109 - 25 * warmth);
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  // Work in logical tile coordinates so thumbnail and full-size marks register.
  ctx.scale(size / SKY_TILE_PERIOD, size / SKY_TILE_PERIOD);
  for (let i = 0; i < 20000; i++) {
    const u = hash(i, 21),
      v = hash(i, 22);
    const brightness = sample(u, v).light * gain;
    if (hash(i, 25) > 0.1 + Math.min(0.8, brightness)) continue;
    const rank = hash(i, 23) ** 5;
    ctx.globalAlpha = 0.22 + rank * 0.6;
    ctx.fillStyle = hash(i, 24) > 0.8 ? "#ebd2ba" : "#d1dfee";
    const radius = 0.45 + rank * 1.7;
    const x = u * SKY_TILE_PERIOD,
      y = v * SKY_TILE_PERIOD;
    // Duplicate the few edge-crossing discs into the neighbouring period.
    for (const dx of wrapOffsets(x, radius))
      for (const dy of wrapOffsets(y, radius)) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  return surface;
}
function wrapOffsets(position: number, radius: number) {
  if (position < radius) return [0, SKY_TILE_PERIOD];
  if (position + radius > SKY_TILE_PERIOD) return [0, -SKY_TILE_PERIOD];
  return [0];
}
