import type { Star } from "../physics/Physics";
import { STANDARD_SUN } from "../solar";
import { COLOR } from "../ui/colors";
import { canvasFont } from "../ui/typography";
import { worldHudUserUnitsPerCssPixel } from "./world-hud";

/** World-anchored geometry, with CSS-pixel stroke/dash/offset dimensions. */
export function drawSunFields(
  ctx: CanvasRenderingContext2D,
  star: Star,
  effects: { collecting: boolean; damaging: boolean },
  cssWidth?: number,
  radii?: { hazard: number; gravity: number; collection: number },
  userUnitsPerCssPixel?: number,
) {
  const pixel =
    userUnitsPerCssPixel ?? worldHudUserUnitsPerCssPixel(ctx, cssWidth);
  if (!pixel) return;
  const pixelsPerUnit = 1 / pixel;
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
  const gravity = radii?.gravity ?? star.influenceRadius;
  const collection =
    radii?.collection ?? star.collectionField?.reach ?? star.influenceRadius;
  circle(gravity, COLOR.countdown, 0.35, [5, 5]);
  circle(
    collection - (Math.abs(collection - gravity) < 2 * pixel ? 2 * pixel : 0),
    COLOR.countdown,
    effects.collecting ? 1 : 0.35,
    [],
    effects.collecting ? 0.033 : 0,
  );
  ctx.lineCap = "round";
  circle(
    radii?.hazard ?? star.damageField?.reach ?? STANDARD_SUN.damageReach,
    effects.damaging ? COLOR.resourceDanger : COLOR.resourceWarning,
    effects.damaging ? 1 : 0.6,
    [1, 4],
    effects.damaging ? 0.11 : 0,
  );
  if (star.designation) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLOR.countdown;
    ctx.font = canvasFont(14 / pixelsPerUnit, 700);
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = COLOR.void;
    ctx.shadowBlur = 3 / pixelsPerUnit;
    ctx.fillText(
      star.designation,
      star.pos.x + star.radius + 6 / pixelsPerUnit,
      star.pos.y - star.radius - 4 / pixelsPerUnit,
    );
  }
  ctx.restore();
}
