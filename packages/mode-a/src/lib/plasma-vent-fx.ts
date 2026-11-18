import type { FxPass } from "@void-drift/core";
import type { SalvageSystem } from "./salvage";

const FUME_LIFETIME = 0.38;
const HOT_LIFETIME = 0.09;
let fume: HTMLCanvasElement | undefined;

function fumeStamp() {
  if (fume) return fume;
  fume = document.createElement("canvas");
  fume.width = fume.height = 32;
  const ctx = fume.getContext("2d");
  if (!ctx) throw new Error("Plasma vent requires Canvas 2D");
  const light = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  light.addColorStop(0, "#ffbd72");
  light.addColorStop(0.45, "rgba(243,116,48,0.65)");
  light.addColorStop(1, "rgba(185,78,39,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 32, 32);
  return fume;
}

/** Each pair moves in world space from its release pose, including after vent closure. */
export function drawPlasmaVent(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  combat: SalvageSystem,
  now: number,
  live: boolean,
) {
  const lifetime = live ? HOT_LIFETIME : FUME_LIFETIME;
  const samples = combat.plasmaVentEvents;
  for (let index = samples.length - 1; index >= 0; index--) {
    const sample = samples[index];
    const age = now - sample.time;
    if (age >= lifetime) break;
    if (age < 0) continue;
    const phase = age / lifetime;
    const radius = 3 + 10 * phase;
    for (const port of sample.outlets) {
      const x = port.x + port.vx * age,
        y = port.y + port.vy * age;
      if (!pass.visible(x, y, radius + 2)) continue;
      if (!pass.budget.take()) return;
      ctx.save();
      ctx.globalAlpha *=
        Math.min(1, 180 * sample.duration) *
        (1 - phase) ** 1.2 *
        (0.55 + 0.45 * sample.charge);
      if (live) {
        ctx.strokeStyle = "#ffd296";
        ctx.lineWidth = 3;
        ctx.beginPath();
        const exposure = Math.min(age, sample.duration);
        ctx.moveTo(x - port.vx * exposure, y - port.vy * exposure);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.globalAlpha *= 0.82 * pass.opacity;
        ctx.drawImage(
          fumeStamp(),
          x - radius,
          y - radius,
          radius * 2,
          radius * 2,
        );
      }
      ctx.restore();
    }
  }
}
