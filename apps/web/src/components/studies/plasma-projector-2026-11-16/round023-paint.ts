import type { FxPass } from "@void-drift/core";
import type { Parcel } from "./round023";

interface State {
  tick: number;
  age: number;
  fired: number;
  blast: { x: number; y: number; angle: number };
  nose: { x: number; y: number };
  angle: number;
  particles: Parcel[];
}
// Prepared source marks, not retained trail marks. History belongs to the shared FX surface.
let cloud: HTMLCanvasElement | undefined;
function stamp() {
  if (cloud) return cloud;
  cloud = document.createElement("canvas");
  cloud.width = cloud.height = 96;
  const c = cloud.getContext("2d");
  if (!c) throw new Error("Plasma source unavailable");
  const g = c.createRadialGradient(48, 48, 0, 48, 48, 48);
  g.addColorStop(0, "rgba(245,255,226,.85)");
  g.addColorStop(0.18, "rgba(185,247,102,.65)");
  g.addColorStop(0.48, "rgba(51,174,90,.26)");
  g.addColorStop(1, "rgba(10,72,60,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 96, 96);
  return cloud;
}
export function paintPlasma(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  s: State,
) {
  if (s.age < 0) return;
  const mark = (
    x: number,
    y: number,
    r: number,
    alpha: number,
    angle = 0,
    aspect = 1,
    essential = false,
  ) => {
    if (!pass.visible(x, y, r * aspect) || !pass.budget.take(essential)) return;
    const source = stamp();
    ctx.save();
    ctx.globalAlpha = alpha * pass.opacity;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(source, -r * aspect, -r, r * 2 * aspect, r * 2);
    ctx.restore();
  };
  if (s.age < 82 && s.fired < 0) {
    const q = Math.min(1, s.age / 54);
    mark(s.nose.x, s.nose.y, 4 + q * 8, 0.13 + q * 0.14, s.angle, 0.75, true);
    // Inward-moving eddies collapse onto the muzzle during preparation.
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + s.age * 0.09,
        r = (1 - (s.age % 18) / 18) * (15 + q * 7);
      mark(s.nose.x + Math.cos(a) * r, s.nose.y + Math.sin(a) * r, 3, 0.13);
    }
  }
  if (s.fired >= 0) {
    const t = (s.tick - s.fired) / 60;
    if (t < 0.32) {
      const envelope = (1 - t / 0.32) ** 0.7,
        angle = s.blast.angle;
      // Entire close volume ignites at once. Internal churn never advances a front.
      mark(s.blast.x, s.blast.y, 49, envelope * 0.85, angle, 1, true);
      for (let i = 0; i < 23; i++) {
        const a = i * 2.399 + s.tick * 0.04 * (i % 2 ? 1 : -1),
          r = 34 * Math.sqrt((i + 0.5) / 23);
        const x = s.blast.x + Math.cos(a) * r,
          y = s.blast.y + Math.sin(a) * r;
        mark(x, y, 9 + (i % 4) * 2, envelope * 0.85, a, 1.35, i < 3);
      }
    }
  }
  for (const p of s.particles) {
    const life = 1 - p.age / 1.05;
    mark(p.x, p.y, 4 + p.age * 8, 0.42 * life, Math.atan2(p.vy, p.vx), 1.65);
    if (p.seed % 3 === 0) mark(p.x, p.y, 2 + p.age * 2, 0.65 * life);
  }
}
