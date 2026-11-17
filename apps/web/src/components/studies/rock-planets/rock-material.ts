export type RockTreatment = "stone" | "warm" | "enhanced";

// Study-local material interpretations; no production palette is changed.
const palettes = {
  stone: [
    [138, 132, 122],
    [94, 88, 82],
    [184, 177, 159],
  ],
  warm: [
    [170, 116, 75],
    [112, 71, 54],
    [207, 170, 111],
  ],
  enhanced: [
    [101, 126, 155],
    [77, 72, 112],
    [191, 160, 83],
  ],
} as const;
const craters = [
  [-0.38, -0.27, 0.2],
  [0.21, 0.34, 0.26],
  [0.49, -0.35, 0.11],
  [-0.19, 0.51, 0.1],
  [0.04, -0.56, 0.15],
  [-0.65, 0.15, 0.09],
] as const;

export function makeRockMaterial(treatment: RockTreatment) {
  const surface = document.createElement("canvas");
  surface.width = surface.height = 256;
  const ctx = surface.getContext("2d");
  if (!ctx) return surface;
  const pixels = ctx.createImageData(256, 256);
  const palette = palettes[treatment];
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const nx = (x + 0.5) / 128 - 1;
      const ny = (y + 0.5) / 128 - 1;
      const disc = nx * nx + ny * ny;
      if (disc >= 1) continue;
      const nz = Math.sqrt(1 - disc);
      const region = Math.sin(nx * 5 + ny * 2) + Math.cos(ny * 6 - nx * 3);
      const zone = region < -0.3 ? 1 : region > 1.1 ? 2 : 0;
      let relief = 1;
      for (const [cx, cy, radius] of craters) {
        const dx = nx - cx,
          dy = ny - cy;
        const distance = Math.hypot(dx, dy) / radius;
        if (distance < 1.25) {
          const rim = Math.exp(-((distance - 0.95) ** 2) * 65);
          const floor = Math.max(0, 1 - distance * distance);
          relief += rim * (0.22 - (dx / radius) * 0.25) - floor * 0.24;
        }
      }
      // Fixed geometric light toward the star, plus a small readable night floor.
      const light = Math.max(0, -0.8 * nx + 0.6 * nz);
      const shade = (0.075 + light * 0.925) * relief;
      const grain = 1 + 0.025 * Math.sin(nx * 83 + Math.cos(ny * 91));
      const offset = (y * 256 + x) * 4;
      for (let c = 0; c < 3; c++) {
        pixels.data[offset + c] = Math.min(
          255,
          palette[zone][c] * shade * grain,
        );
      }
      pixels.data[offset + 3] = Math.min(1, (1 - Math.sqrt(disc)) * 128) * 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return surface;
}
