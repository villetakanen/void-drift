import type { StudyLight, StudyLightState } from "../../../lib/flight-scene";

/** Visual excitation only. No temperature, dose or hull damage is calculated. */
export function heatExcitation(state: StudyLightState) {
  const air = state.atmosphere;
  if (!air || air.density <= 0) return 0;
  return Math.min(1, air.density * (Math.hypot(air.vx, air.vy) / 300) ** 2);
}

export const HEAT_STAMPS = [
  "Current envelope",
  "Soft patch",
  "Tapered streak",
  "Curved band",
];
const sourceCache = new Map<string, HTMLCanvasElement>();

/** Exact half-stamp consumed by FX and shown in the study's source preview. */
export function heatSourceStamp(kind: string, phase = 1, bandWidth = 1) {
  const widthScale =
    kind === "Curved band"
      ? Math.round(Math.max(1, Math.min(2.2, bandWidth)) * 20) / 20
      : 1;
  const key = `${kind}:${kind === "Current envelope" ? phase : 0}:${widthScale}`;
  const cached = sourceCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 128;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Heat envelope canvas unavailable");
  if (kind !== "Current envelope") {
    const pixels = c.createImageData(160, 128);
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 160; x++) {
        const u = x - 72,
          v = y - 64;
        let strength = 0;
        if (kind === "Soft patch") {
          const d = Math.hypot((u - 20) / 18, (v - 13) / 14);
          strength = Math.max(0, 1 - d * d) ** 2;
        } else if (kind === "Tapered streak") {
          const t = (u + 48) / 78;
          if (t > 0 && t < 1) {
            const width = 9 * Math.sin(Math.PI * t);
            strength =
              Math.max(0, 1 - ((v - 19) / width) ** 2) ** 2 *
              Math.sin(Math.PI * t);
          }
        } else {
          const angle = Math.atan2(v, u);
          if (angle > 0 && angle < Math.PI * 0.85) {
            const end = Math.sin(angle / 0.85);
            const width = 6 * widthScale * Math.sqrt(end);
            strength =
              Math.max(0, 1 - ((Math.hypot(u, v) - 28) / width) ** 2) ** 2 *
              end;
          }
        }
        const warm = Math.max(0, Math.min(1, (u + 48) / 78));
        const i = (y * 160 + x) * 4;
        pixels.data[i] = 255;
        pixels.data[i + 1] = 56 + warm * 162;
        pixels.data[i + 2] = 12 + warm * 100;
        pixels.data[i + 3] = Math.round(strength * 242);
      }
    c.putImageData(pixels, 0, 0);
    sourceCache.set(key, canvas);
    return canvas;
  }
  c.translate(72, 64);
  c.lineCap = "round";
  const tail = 38 + phase * 5;
  const fire = c.createLinearGradient(-tail, 0, 30, 0);
  fire.addColorStop(0, "rgba(255,56,12,0)");
  fire.addColorStop(0.5, "rgba(255,84,18,0.7)");
  fire.addColorStop(1, "rgba(255,218,112,0.95)");
  c.fillStyle = fire;
  c.beginPath();
  c.moveTo(32, 0);
  c.bezierCurveTo(33, 19, 9, 31, -tail, 22 + phase * 2);
  c.bezierCurveTo(-18, 16, -1, 19, 14, 11);
  c.quadraticCurveTo(24, 6, 26, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(255,243,190,0.95)";
  c.lineWidth = 2.3;
  c.beginPath();
  c.moveTo(29, 0);
  c.quadraticCurveTo(29, 16, 5, 22);
  c.stroke();
  c.strokeStyle = "rgba(255,131,32,0.8)";
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(7, 25);
  c.quadraticCurveTo(-8, 27, -tail + 8, 31 - phase);
  c.stroke();
  sourceCache.set(key, canvas);
  return canvas;
}

export function makeHeatLight(
  contactShape = "Soft glow",
  source = "Current envelope",
  bandBrightness = 1,
  bandWidth = 1,
): StudyLight {
  let contact: HTMLCanvasElement | undefined;
  function contactStamp() {
    if (contact) return contact;
    contact = document.createElement("canvas");
    contact.width = contact.height = 64;
    const c = contact.getContext("2d");
    if (!c) throw new Error("Heat contact canvas unavailable");
    const light = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    light.addColorStop(0, "rgba(255,245,214,0.95)");
    light.addColorStop(0.25, "rgba(255,220,155,0.7)");
    light.addColorStop(0.65, "rgba(255,184,130,0.2)");
    light.addColorStop(1, "rgba(255,184,130,0)");
    c.fillStyle = light;
    c.fillRect(0, 0, 64, 64);
    return contact;
  }
  return {
    label: "Heat cue",
    replaces: [],
    lfx(ctx, state) {
      const air = state.atmosphere;
      const intensity = heatExcitation(state);
      if (!air || intensity <= 0) return;
      const r = state.ship.radius;
      ctx.save();
      ctx.translate(state.ship.x, state.ship.y);
      ctx.rotate(Math.atan2(air.inwardY, air.inwardX));
      ctx.globalAlpha = Math.sqrt(intensity) * 0.85;
      if (contactShape === "Tapered crescent") {
        // Two joined curves meet at points: filled light, never a stroked ring.
        const light = ctx.createLinearGradient(0, 0, r * 1.4, 0);
        light.addColorStop(0, "rgba(255,184,130,0)");
        light.addColorStop(0.6, "rgba(255,220,155,0.35)");
        light.addColorStop(1, "rgba(255,245,214,0.9)");
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.moveTo(-r * 0.15, -r * 1.2);
        ctx.bezierCurveTo(r * 1.75, -r, r * 1.75, r, -r * 0.15, r * 1.2);
        ctx.bezierCurveTo(
          r * 0.9,
          r * 0.65,
          r * 0.9,
          -r * 0.65,
          -r * 0.15,
          -r * 1.2,
        );
        ctx.fill();
        ctx.restore();
        return;
      }
      // A filled patch grazes the atmosphere-facing hull, with no stroked boundary.
      ctx.drawImage(contactStamp(), r * 0.15, -r * 1.1, r * 1.2, r * 2.2);
      ctx.restore();
    },
    fx(ctx, pass, state) {
      const intensity = heatExcitation(state);
      const air = state.atmosphere;
      if (
        !air ||
        intensity <= 0 ||
        !pass.visible(state.ship.x, state.ship.y, state.ship.radius * 4) ||
        !pass.budget.take(true)
      )
        return;
      const angle = Math.atan2(air.vy, air.vx);
      const inwardSide =
        -Math.sin(angle) * air.inwardX + Math.cos(angle) * air.inwardY;
      const scale = state.ship.radius / 24;
      ctx.save();
      ctx.translate(state.ship.x, state.ship.y);
      ctx.rotate(angle);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(1, side);
        // Planet-relative weighting follows the body through turns and replay.
        const weight = 0.18 + 0.82 * (0.5 + 0.5 * inwardSide * side);
        ctx.globalAlpha =
          pass.opacity *
          Math.min(
            0.95,
            (0.45 + intensity * 0.5) *
              (source === "Curved band" ? bandBrightness : 1),
          ) *
          weight;
        ctx.drawImage(
          heatSourceStamp(source, Math.floor(state.tick / 2) % 4, bandWidth),
          -72 * scale,
          -64 * scale,
          160 * scale,
          128 * scale,
        );
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
