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
  variant: "standard" | "space-purple" = "standard",
) {
  if (time < 0 || time >= 3.4) return;
  const text =
    time < 3
      ? (String(3 - Math.floor(time)) as "1" | "2" | "3")
      : variant === "space-purple"
        ? "FIGHT"
        : "GO";
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
  const color =
    variant === "space-purple" ? COLOR.spacePurple : COLOR.countdown;
  const key = `${variant}:${text}`;
  let stamp = stamps.get(key);
  if (!stamp) {
    stamp = document.createElement("canvas");
    let path: Path2D | undefined;
    if (text !== "FIGHT") {
      const glyph = countdownGlyphs[text];
      const scale = 420 / glyph.em;
      stamp.width = Math.ceil(glyph.width * scale + 180);
      stamp.height = 600;
      path = new Path2D(glyph.path);
    } else {
      stamp.width = 1000;
      stamp.height = 600;
    }
    const c = stamp.getContext("2d");
    if (!c) return;
    c.fillStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 48;
    c.globalAlpha = 0.55;
    if (path) {
      const glyph = countdownGlyphs[text as "1" | "2" | "3" | "GO"];
      c.translate(90, 450);
      c.scale(420 / glyph.em, 420 / glyph.em);
      c.fill(path);
    } else {
      c.font = "700 180px 'B612 Mono', monospace";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 500, 300);
    }
    c.shadowBlur = 0;
    c.globalAlpha = 1;
    if (path) c.fill(path);
    else c.fillText(text, 500, 300);
    c.globalCompositeOperation = "lighter";
    c.fillStyle = COLOR.text;
    c.globalAlpha = 0.3;
    if (path) c.fill(path);
    else c.fillText(text, 500, 300);
    stamps.set(key, stamp);
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
