import { COLOR } from "../ui/colors";
import type { FxPass } from "./arcade-fx";
import { countdownGlyphs } from "./countdown-glyphs";

const stamps = new Map<string, HTMLCanvasElement>();
export function paintCountdown(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  time: number,
  x: number,
  y: number,
  zoom: number,
  reduced = false,
) {
  if (time < 0 || time >= 3.4) return;
  const text =
    time < 3 ? (String(3 - Math.floor(time)) as "1" | "2" | "3") : "GO";
  const local = time % 1;
  if (time < 3 && local >= 0.8) return;
  const hash = (Math.imul(Math.floor(local * 30) + 7, 2654435761) >>> 0) % 5;
  const on =
    reduced || time >= 3 || local > 0.28
      ? 1
      : hash < 2
        ? 0
        : hash === 4
          ? 0.5
          : 1;
  if (!on || !pass.budget.take(true)) return;
  let stamp = stamps.get(text);
  if (!stamp) {
    const glyph = countdownGlyphs[text];
    const scale = 420 / glyph.em;
    stamp = document.createElement("canvas");
    stamp.width = Math.ceil(glyph.width * scale + 180);
    stamp.height = 600;
    const c = stamp.getContext("2d");
    if (!c) return;
    const path = new Path2D(glyph.path);
    c.translate(90, 450);
    c.scale(scale, scale);
    c.fillStyle = COLOR.countdown;
    c.shadowColor = COLOR.countdown;
    c.shadowBlur = 48;
    c.globalAlpha = 0.55;
    c.fill(path);
    c.shadowBlur = 0;
    c.globalAlpha = 1;
    c.fill(path);
    c.globalCompositeOperation = "lighter";
    c.fillStyle = COLOR.text;
    c.globalAlpha = 0.3;
    c.fill(path);
    stamps.set(text, stamp);
  }
  ctx.save();
  ctx.globalAlpha = pass.opacity * on * (time < 3 ? 0.45 : 0.6);
  ctx.drawImage(
    stamp,
    x + (on === 0.5 ? 18 / zoom : 0) - stamp.width / zoom / 2,
    y - stamp.height / zoom / 2,
    stamp.width / zoom,
    stamp.height / zoom,
  );
  ctx.restore();
}
