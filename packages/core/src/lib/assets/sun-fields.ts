import type { Star } from "../physics/Physics";
import { STANDARD_SUN } from "../solar";
import { COLOR } from "../ui/colors";

/** World-anchored geometry, with CSS-pixel stroke/dash/offset dimensions. */
export function drawSunFields(
  ctx: CanvasRenderingContext2D,
  star: Star,
  effects: { collecting: boolean; damaging: boolean },
  cssWidth = ctx.canvas.getBoundingClientRect().width,
) {
  const transform = ctx.getTransform();
  const pixelsPerUnit =
    (Math.hypot(transform.a, transform.b) * cssWidth) / ctx.canvas.width;
  if (!(pixelsPerUnit > 0)) return;
  const pixel = 1 / pixelsPerUnit;
  ctx.save();
  ctx.lineWidth = pixel;
  const circle = (
    radius: number,
    color: string,
    alpha: number,
    dash: number[],
    fill = 0,
  ) => {
    ctx.beginPath();
    ctx.arc(star.pos.x, star.pos.y, Math.max(0, radius), 0, Math.PI * 2);
    if (fill) {
      ctx.globalAlpha = fill;
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash.map((value) => value * pixel));
    ctx.stroke();
  };
  circle(star.influenceRadius, COLOR.countdown, 0.35, [5, 5]);
  circle(
    star.influenceRadius - 2 * pixel,
    COLOR.countdown,
    effects.collecting ? 1 : 0.35,
    [],
    effects.collecting ? 0.033 : 0,
  );
  ctx.lineCap = "round";
  circle(
    STANDARD_SUN.damageReach,
    effects.damaging ? COLOR.resourceDanger : COLOR.resourceWarning,
    effects.damaging ? 1 : 0.6,
    [1, 4],
    effects.damaging ? 0.11 : 0,
  );
  ctx.restore();
}
