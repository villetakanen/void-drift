// Study 02.5: geological raster, deliberately independent of hull planes.
// All texture is computed once; neither NASA nor game-reference images are sampled.
type V3 = readonly [number, number, number];
const unit = (x: number, y: number, z: number): V3 => {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
};
const fade = (x: number) => x * x * (3 - 2 * x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function hash(x: number, y: number, z: number) {
  let n =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(z, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
export function rockNoise(x: number, y: number, z: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const u = fade(x - ix),
    v = fade(y - iy),
    w = fade(z - iz);
  const plane = (k: number) =>
    mix(
      mix(hash(ix, iy, k), hash(ix + 1, iy, k), u),
      mix(hash(ix, iy + 1, k), hash(ix + 1, iy + 1, k), u),
      v,
    );
  return mix(plane(iz), plane(iz + 1), w) * 2 - 1;
}
function fractal(x: number, y: number, z: number) {
  let value = 0,
    amplitude = 0.57,
    frequency = 3.7;
  for (let octave = 0; octave < 5; octave++) {
    value +=
      rockNoise(x * frequency + 9, y * frequency - 3, z * frequency + 7) *
      amplitude;
    amplitude *= 0.5;
    frequency *= 2.11;
  }
  return value;
}
const DITHER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function makeTerrainMaterial(seed = 71): HTMLCanvasElement {
  const SIZE = 192;
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const craters = Array.from({ length: 180 }, (_, i) => {
    const z = random() * 2 - 1,
      angle = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - z * z);
    return {
      centre: [Math.cos(angle) * ring, Math.sin(angle) * ring, z] as V3,
      radius: i < 8 ? 0.12 + random() * 0.13 : 0.012 + random() ** 2 * 0.085,
    };
  });
  const rayCentre = unit(-0.24, -0.33, 0.91);
  const basinCentre = unit(0.48, 0.27, 0.83);
  craters.push({ centre: rayCentre, radius: 0.09 });
  const height = new Float32Array(SIZE * SIZE);
  const material = new Float32Array(SIZE * SIZE);
  const surface = document.createElement("canvas");
  surface.width = surface.height = SIZE;
  const ctx = surface.getContext("2d");
  if (!ctx) return surface;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = ((x + 0.5) * 2) / SIZE - 1,
        ny = ((y + 0.5) * 2) / SIZE - 1;
      const disc = nx * nx + ny * ny;
      if (disc >= 1) continue;
      const nz = Math.sqrt(1 - disc);
      const rough = fractal(nx, ny, nz);
      let h = rough * 0.004;
      let albedo = 0.64 + rough * 0.2;
      const basinDistance = Math.sqrt(
        Math.max(
          0,
          2 -
            2 *
              (nx * basinCentre[0] + ny * basinCentre[1] + nz * basinCentre[2]),
        ),
      );
      const basin = Math.max(
        0,
        Math.min(1, (0.56 + rough * 0.12 - basinDistance) / 0.15),
      );
      albedo -= basin * 0.15;
      h *= 1 - basin * 0.65;
      for (const crater of craters) {
        const dot =
          nx * crater.centre[0] + ny * crater.centre[1] + nz * crater.centre[2];
        const distanceSquared =
          Math.max(0, 2 - 2 * dot) / (crater.radius * crater.radius);
        if (distanceSquared > 2.1) continue;
        const distance = Math.sqrt(distanceSquared);
        const irregular = distance + rough * 0.075;
        const bowl = Math.max(0, 1 - (irregular / 0.87) ** 2);
        const rim = Math.exp(-((irregular - 0.98) ** 2) * 95);
        h += crater.radius * (rim * 0.045 - bowl * 0.075);
        albedo += rim * 0.055 - bowl * 0.035;
      }
      const rayDistance = Math.sqrt(
        Math.max(
          0,
          2 - 2 * (nx * rayCentre[0] + ny * rayCentre[1] + nz * rayCentre[2]),
        ),
      );
      const rayAngle = Math.atan2(ny - rayCentre[1], nx - rayCentre[0]);
      const spokes = Math.max(0, Math.sin(rayAngle * 19 + rough * 3)) ** 8;
      const rays = Math.exp(-rayDistance * 9) * (0.15 + spokes * 0.38);
      albedo += rays;
      height[y * SIZE + x] = h;
      material[y * SIZE + x] = albedo;
    }
  }
  const pixels = ctx.createImageData(SIZE, SIZE);
  const light = unit(-0.84, -0.08, 0.54);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const nx = ((x + 0.5) * 2) / SIZE - 1,
        ny = ((y + 0.5) * 2) / SIZE - 1;
      const disc = nx * nx + ny * ny;
      if (disc >= 1) continue;
      const at = y * SIZE + x;
      const h = height[at];
      const dx =
        (((height[y * SIZE + Math.min(SIZE - 1, x + 1)] || h) -
          (height[y * SIZE + Math.max(0, x - 1)] || h)) *
          SIZE) /
        4;
      const dy =
        (((height[Math.min(SIZE - 1, y + 1) * SIZE + x] || h) -
          (height[Math.max(0, y - 1) * SIZE + x] || h)) *
          SIZE) /
        4;
      const normal = unit(nx - dx, ny - dy, Math.sqrt(1 - disc));
      const diffuse = Math.max(
        0,
        normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2],
      );
      const intensity = Math.max(
        0,
        Math.min(1, material[at] * (0.09 + diffuse * 0.91)),
      );
      // Retained 02.5 survey reference.
      const value =
        Math.max(
          0,
          Math.min(
            31,
            Math.floor(intensity * 31 + DITHER[(y % 4) * 4 + (x % 4)] / 16),
          ),
        ) / 31;
      const index = at * 4;
      pixels.data[index] = value * 242;
      pixels.data[index + 1] = value * 225;
      pixels.data[index + 2] = value * 201;
      pixels.data[index + 3] =
        Math.min(1, ((1 - Math.sqrt(disc)) * SIZE) / 2) * 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return surface;
}
