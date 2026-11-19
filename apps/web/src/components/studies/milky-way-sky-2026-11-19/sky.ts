import type { FlightExperiment } from "../../../lib/flight-scene";

// Prepared once per mounted study, never during flight drawing. The periodic
// field has no arena boundary. Seed and artwork stay identical across replays.
const SIZE = 3072;
const SEED = 191126;
function hash(x: number, y: number) {
  let h = Math.imul(x + SEED, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number, cells: number) {
  const xx = x * cells,
    yy = y * cells;
  const ix = Math.floor(xx),
    iy = Math.floor(yy);
  const fx = xx - ix,
    fy = yy - iy;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  const sample = (a: number, b: number) =>
    hash((a + cells) % cells, (b + cells) % cells);
  return (
    (sample(ix, iy) * (1 - u) + sample(ix + 1, iy) * u) * (1 - v) +
    (sample(ix, iy + 1) * (1 - u) + sample(ix + 1, iy + 1) * u) * v
  );
}
function gaussian(value: number) {
  return Math.exp(-value * value);
}
function field(x: number, y: number) {
  const tau = Math.PI * 2;
  const large = noise(x, y, 8) - 0.5;
  const medium = noise(x, y, 32) - 0.5;
  const fine = noise(x, y, 128) - 0.5;
  // Periodic diagonal coordinates keep coverage continuous. The outline bends,
  // widens and frays independently of the dark paths running inside it.
  const along = x * tau;
  const bend = 0.026 * Math.sin(along * 2 + 0.7) + large * 0.09;
  const phase = x + y - 0.98 + bend;
  const d = (phase - Math.floor(phase + 0.5)) * Math.PI;
  const gathering = (1 + Math.cos(along - 2.2)) / 2;
  const width = 0.065 + gathering * 0.07 + (1 + Math.sin(along * 3)) * 0.012;
  const edge = d + medium * 0.065 + fine * 0.022;
  // Unequal shoulders avoid a symmetric tube of light around the main lane.
  const shoulder = edge < 0 ? width * 0.78 : width * 1.25;
  const envelope = Math.exp(-((edge / shoulder) ** 2) * 0.85);
  const detail = noise(x + large * 0.035, y + medium * 0.025, 64);
  const grain = 0.24 + noise(x, y, 16) * 0.36 + detail * 0.4;
  const seam =
    -0.018 + Math.sin(along + 0.5) * 0.035 + medium * 0.045 + fine * 0.014;
  const main = gaussian((d - seam) / (0.014 + gathering * 0.014));
  const split = (1 + Math.sin(along * 2 - 0.8)) / 2;
  const branchCentre = seam + 0.025 + split * 0.095;
  const branch = gaussian((d - branchCentre - medium * 0.025) / 0.013) * split;
  const spurCentre = seam - 0.025 - gathering * 0.07;
  const spur = gaussian((d - spurCentre + fine * 0.018) / 0.011) * gathering;
  const dust = Math.max(main, branch * 0.85, spur * 0.72);
  const light = envelope * grain * (1 - dust * 0.93);
  // Dust-adjacent regions lean toward muted ivory/ochre, open shoulders cool.
  // These are display colours, not an astronomical colour model.
  const warmth = Math.min(
    1,
    Math.max(
      0,
      gathering * 0.42 + gaussian((d - seam) / 0.075) * 0.5 + medium * 0.6,
    ),
  );
  return { light, warmth };
}
export function prepareSky() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sky preparation needs Canvas");
  const small = document.createElement("canvas");
  small.width = small.height = 1024;
  const sc = small.getContext("2d");
  if (!sc) throw new Error("Sky preparation needs Canvas");
  const data = sc.createImageData(1024, 1024);
  // Match 02.2's mean prepared light signal before the unchanged 45% opacity.
  // This is a comparison condition, not a final exposure or colour contract.
  let total = 0;
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) total += field(x / 256, y / 256).light;
  const gain = 0.03618919255854648 / (total / (256 * 256));
  for (let y = 0; y < 1024; y++)
    for (let x = 0; x < 1024; x++) {
      const u = x / 1024,
        v = y / 1024;
      const sample = field(u, v);
      const f = Math.min(0.9, sample.light * gain);
      const grain = 0.65 + hash(x, y) * 0.7;
      const warmth = sample.warmth;
      const k = (y * 1024 + x) * 4;
      data.data[k] = 3 + f * (70 + warmth * 29) * grain;
      data.data[k + 1] = 5 + f * (79 + warmth * 2) * grain;
      data.data[k + 2] = 10 + f * (99 - warmth * 39) * grain;
      data.data[k + 3] = 255;
    }
  sc.putImageData(data, 0, 0);
  ctx.drawImage(small, 0, 0, SIZE, SIZE);
  // Dense, mostly unresolved stellar grain follows the same broken light.
  for (let i = 0; i < 145000; i++) {
    const u = hash(i, 1),
      v = hash(i, 2),
      f = Math.min(0.9, field(u, v).light * gain);
    if (hash(i, 3) > 0.035 + f * 0.85) continue;
    const bright = hash(i, 4);
    const alpha = 0.1 + bright * bright * (0.23 + f * 0.44);
    const warm = hash(i, 5) > 0.83;
    ctx.fillStyle = warm
      ? `rgba(230,213,186,${alpha})`
      : `rgba(209,222,241,${alpha})`;
    const r = bright > 0.995 ? 1.3 : 0.35 + bright * 0.45;
    ctx.beginPath();
    ctx.arc(u * SIZE, v * SIZE, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const stars = document.createElement("canvas");
  stars.width = stars.height = SIZE;
  const st = stars.getContext("2d");
  if (!st) throw new Error("Star preparation needs Canvas");
  // Sparse accents remain independent of the stream's intensity. No gleam or
  // population claim: these are provisional points within the whole sky.
  for (let i = 0; i < 72; i++) {
    const x = hash(i, 21) * SIZE,
      y = hash(i, 22) * SIZE;
    const bright = hash(i, 23);
    const warm = hash(i, 24) > 0.7;
    const r = 0.65 + bright * 1.1;
    if (bright > 0.8) {
      const halo = st.createRadialGradient(x, y, 0, x, y, r * 4);
      halo.addColorStop(
        0,
        warm ? "rgba(240,211,162,0.28)" : "rgba(190,216,255,0.24)",
      );
      halo.addColorStop(1, "rgba(0,0,0,0)");
      st.fillStyle = halo;
      st.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    }
    st.fillStyle = warm
      ? `rgba(249,231,200,${0.55 + bright * 0.4})`
      : `rgba(225,236,255,${0.55 + bright * 0.4})`;
    st.beginPath();
    st.arc(x, y, r, 0, Math.PI * 2);
    st.fill();
  }
  return { cloud: canvas, stars };
}
export function skyExperiment(
  art: ReturnType<typeof prepareSky>,
  pan: number,
  brightness: number,
  showStars: boolean,
): FlightExperiment {
  return {
    label: "Experimental Milky Way sky",
    create: () => ({
      step() {},
      drawSky(frame, ctx) {
        const { camera } = frame;
        const w = camera.viewportWidth,
          h = camera.viewportHeight;
        const wrap = (v: number) => ((v % SIZE) + SIZE) % SIZE;
        const ox = wrap(((camera.pos.x - 960) * pan) / 100 + 420);
        const oy = wrap(((camera.pos.y - 540) * pan) / 100 + 1120);
        // The prepared tile alone pans. It holds its apparent scale at all views.
        ctx.save();
        for (let y = -oy; y < h; y += SIZE)
          for (let x = -ox; x < w; x += SIZE) {
            ctx.globalAlpha = brightness / 100;
            ctx.drawImage(art.cloud, x, y);
            if (showStars) {
              ctx.globalAlpha = 1;
              ctx.drawImage(art.stars, x, y);
            }
          }
        ctx.restore();
      },
    }),
  };
}
