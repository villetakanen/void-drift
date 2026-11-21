import type { FxPass } from "@void-drift/core";
import type { PlasmaVisualEvent } from "./schemas/salvage";

export const PLASMA_ERUPTION_SECONDS = 0.26;
export const PLASMA_ERUPTION_RADIUS = 58;
export const PLASMA_SPEW_SECONDS = 0.085;
const stamps = new Map<number, HTMLCanvasElement>();

/** Bounded prepainted lobe stamps, shared by every rifle. */
function fireball(live: boolean, frame: number) {
  const key = frame * 2 + Number(live);
  const cached = stamps.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Plasma eruption requires Canvas 2D");
  const lobe = (x: number, y: number, radius: number) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, live ? "#fff8bf" : "#ffbd43");
    gradient.addColorStop(0.42, live ? "#ffd264" : "#ff8531");
    gradient.addColorStop(1, "rgba(239,76,18,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  for (let i = 0; i < 9; i++) {
    const phase = (frame * Math.PI) / 8;
    const angle = i * 2.39996 + 0.3 * (Math.sin(phase + i) - Math.sin(i));
    const offset =
      (live ? 20 : 42) * (1 + 0.22 * (Math.cos(phase + i) - Math.cos(i)));
    lobe(
      80 + Math.cos(angle) * offset,
      80 + Math.sin(angle) * offset,
      live ? 29 : 30 + (i % 4) * 2,
    );
  }
  lobe(80, 80, live ? 36 : 51);
  stamps.set(key, canvas);
  return canvas;
}

/** A short-lived silhouette of the actual swept path. It stays attached to the
 * release muzzle and terminates at the physical endpoint, even between frames. */
export function drawPlasmaSpew(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  path: { originX: number; originY: number; x: number; y: number },
  age: number,
) {
  if (age < 0 || age >= PLASMA_SPEW_SECONDS) return;
  const dx = path.x - path.originX;
  const dy = path.y - path.originY;
  const length = Math.hypot(dx, dy);
  if (
    !length ||
    !pass.visible(
      path.originX + dx / 2,
      path.originY + dy / 2,
      length / 2 + 5,
    ) ||
    !pass.budget.take(true)
  )
    return;
  const nx = -dy / length,
    ny = dx / length;
  ctx.save();
  ctx.globalAlpha *= (1 - age / PLASMA_SPEW_SECONDS) ** 0.8;
  // The hot throat opens just beyond the muzzle and tapers into the contact.
  for (const [width, color] of SPEW_LAYERS) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(
      path.originX + nx * width * 0.3,
      path.originY + ny * width * 0.3,
    );
    ctx.lineTo(
      path.originX + dx * 0.19 + nx * width,
      path.originY + dy * 0.19 + ny * width,
    );
    ctx.lineTo(path.x, path.y);
    ctx.lineTo(
      path.originX + dx * 0.19 - nx * width,
      path.originY + dy * 0.19 - ny * width,
    );
    ctx.lineTo(
      path.originX - nx * width * 0.3,
      path.originY - ny * width * 0.3,
    );
    ctx.fill();
  }
  ctx.restore();
}

const SPEW_LAYERS = [
  [3.6, "#ff9c39"],
  [1.65, "#fff6c7"],
] as const;

/** A travelled segment is stamped once into persistent FX. */
export function stampPlasmaSegment(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  event: Extract<PlasmaVisualEvent, { kind: "segment" }>,
) {
  const x = (event.x + event.endX) / 2,
    y = (event.y + event.endY) / 2;
  if (
    !pass.visible(
      x,
      y,
      Math.hypot(event.endX - event.x, event.endY - event.y) / 2 + 3,
    ) ||
    !pass.budget.take(true)
  )
    return;
  ctx.save();
  ctx.strokeStyle = "#ff982b";
  ctx.globalAlpha *= 0.6 * pass.opacity;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(event.x, event.y);
  ctx.lineTo(event.endX, event.endY);
  ctx.stroke();
  ctx.restore();
}

/** The core and glow are sampled from absolute simulation time. */
export function drawPlasmaEruption(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  event: Extract<PlasmaVisualEvent, { kind: "impact" }>,
  time: number,
  live: boolean,
) {
  const age = time - event.time;
  if (
    age < 0 ||
    age >= PLASMA_ERUPTION_SECONDS ||
    !pass.visible(event.x, event.y, PLASMA_ERUPTION_RADIUS) ||
    !pass.budget.take(true)
  )
    return;
  const phase = age / PLASMA_ERUPTION_SECONDS;
  const reach = 1 + (PLASMA_ERUPTION_RADIUS - 1) * (1 - (1 - phase) ** 3);
  const frame = Math.floor(phase * 64) % 16;
  ctx.save();
  ctx.globalAlpha *=
    Math.min(1, 1.2 * (live ? (1 - phase) ** 1.5 : 0.34 * (1 - phase))) *
    (live ? 1 : pass.opacity);
  ctx.drawImage(
    fireball(live, frame),
    event.x - reach,
    event.y - reach,
    2 * reach,
    2 * reach,
  );
  ctx.restore();
}
