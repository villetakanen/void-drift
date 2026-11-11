// Plasma's complete luminous frames are built once; no gradients run while stamping.
const FRAMES = 8;
const SCALE = 4;
const DIAMETER = 26;
const FLARE = 0.22;
const HOT = "255,244,214";
const AMBER = "255,181,46";
const EMBER = "255,112,30";
let frames: HTMLCanvasElement[] | undefined;

const scatter = (a: number, b: number) =>
  ((Math.imul((a * 73856093) ^ (b * 19349663), 2654435761) >>> 0) % 1000) /
  1000;

function lobe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  heat: number,
) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, `rgba(${HOT},${0.85 * heat})`);
  light.addColorStop(0.3, `rgba(${AMBER},${0.6 * heat})`);
  light.addColorStop(0.65, `rgba(${EMBER},${0.22 * heat})`);
  light.addColorStop(1, `rgba(${EMBER},0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function sprites() {
  if (frames) return frames;
  const size = DIAMETER * SCALE;
  frames = Array.from({ length: FRAMES }, (_, f) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Plasma stamps require Canvas 2D");
    const t = (f / FRAMES) * Math.PI * 2;
    const mid = size / 2;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) {
      const angle = t * (i % 2 ? -1 : 1) + i * 1.9 + scatter(i, 7) * 2;
      const reach =
        size * (0.14 + 0.14 * scatter(i, 3)) * (1 + 0.3 * Math.sin(t * 2 + i));
      const radius = size * (0.16 + 0.08 * scatter(i, 5));
      lobe(
        ctx,
        mid + Math.cos(angle) * reach,
        mid + Math.sin(angle) * reach,
        radius,
        0.8,
      );
    }
    lobe(ctx, mid, mid, size * 0.22, 1);
    return canvas;
  });
  return frames;
}

/** Paint the source and its two decorative sparks at the current mount. */
export function paintPlasmaPlume(
  ctx: CanvasRenderingContext2D,
  size: number,
  thrustSeconds: number,
  tick: number,
  takeSpark: () => boolean,
) {
  if (!(size > 0)) return;
  const flare = Math.max(0, 1 - thrustSeconds / FLARE);
  const diameter = DIAMETER * size * (1 + 1.2 * flare);
  const beat = Math.floor(tick / 3);
  ctx.save();
  ctx.translate(-diameter * 0.5, 0);
  ctx.scale(1.3, 1);
  ctx.rotate(scatter(beat, 11) * Math.PI * 2);
  ctx.drawImage(
    sprites()[beat % FRAMES],
    -diameter / 2,
    -diameter / 2,
    diameter,
    diameter,
  );
  ctx.restore();
  ctx.fillStyle = `rgb(${HOT})`;
  for (let i = 0; i < 2; i++) {
    if (!takeSpark()) break;
    const angle = Math.PI + (scatter(tick, i) - 0.5) * 2.2;
    const reach = diameter * (0.5 + 0.7 * scatter(tick, i + 20));
    ctx.fillRect(
      -diameter * 0.45 + Math.cos(angle) * reach,
      Math.sin(angle) * reach,
      1.5,
      1.5,
    );
  }
}
