import type { Camera } from "../physics/Camera";
import {
  getPlanetInfluenceRadius,
  type Planet,
  type Star,
} from "../physics/Physics";
import { COLOR } from "../ui/colors";
import { canvasFont } from "../ui/typography";

/** User-space units per CSS pixel for a uniformly displayed canvas transform. */
export function worldHudUserUnitsPerCssPixel(
  ctx: CanvasRenderingContext2D,
  cssWidth?: number,
): number | undefined {
  const { canvas } = ctx;
  if (!(canvas.width > 0) || !(canvas.height > 0)) return undefined;
  const transform = ctx.getTransform();
  if (cssWidth !== undefined) {
    if (!(cssWidth > 0)) return undefined;
    const scaleX =
      (Math.hypot(transform.a, transform.b) * cssWidth) / canvas.width;
    return Number.isFinite(scaleX) && scaleX > 0 ? 1 / scaleX : undefined;
  }
  const rect = canvas.getBoundingClientRect();
  if (!(rect.width > 0) || !(rect.height > 0)) return undefined;
  const scaleX =
    (Math.hypot(transform.a, transform.b) * rect.width) / canvas.width;
  const scaleY =
    (Math.hypot(transform.c, transform.d) * rect.height) / canvas.height;
  if (
    !Number.isFinite(scaleX) ||
    !Number.isFinite(scaleY) ||
    !(scaleX > 0) ||
    !(scaleY > 0)
  )
    return undefined;
  // Flight and Inspector stages preserve one uniform display scale. A hidden,
  // zero-sized, or stretched canvas cannot provide a meaningful HUD scale.
  if (Math.abs(scaleX - scaleY) > Math.max(scaleX, scaleY) * 0.01)
    return undefined;
  return 1 / scaleX;
}

/** Faint orbit path, 3/7 CSS-pixel dashes. */
export function drawWorldOrbit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pixel = 1,
) {
  ctx.save();
  ctx.strokeStyle = COLOR.countdown;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = pixel;
  ctx.setLineDash([3 * pixel, 7 * pixel]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Gravity cut-off boundary: same subdued 5/5 treatment as Sun gravity. */
export function drawWorldGravity(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pixel = 1,
) {
  ctx.save();
  ctx.strokeStyle = COLOR.countdown;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = pixel;
  ctx.setLineDash([5 * pixel, 5 * pixel]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawWorldLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  radius: number,
  angle: number,
  pixel = 1,
) {
  ctx.save();
  const nx = Math.cos(angle);
  const ny = Math.sin(angle);
  const side = nx >= 0 ? 1 : -1;
  const ax = x + nx * (radius + 4 * pixel);
  const ay = y + ny * (radius + 4 * pixel);
  const bx = x + nx * (radius + 17 * pixel);
  const by = y + ny * (radius + 17 * pixel);
  const end = bx + side * 14 * pixel;
  ctx.strokeStyle = COLOR.countdown;
  ctx.lineWidth = pixel;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(end, by);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = canvasFont(14 * pixel, 700);
  ctx.textAlign = side > 0 ? "left" : "right";
  ctx.textBaseline = "middle";
  // A 1 CSS-pixel void edge keeps the 14 CSS-pixel label readable on fields.
  ctx.strokeStyle = COLOR.void;
  ctx.lineWidth = pixel;
  ctx.lineJoin = "round";
  ctx.strokeText(text, end + side * 5 * pixel, by);
  ctx.fillStyle = COLOR.countdown;
  ctx.fillText(text, end + side * 5 * pixel, by);
  ctx.restore();
}

/** Draw one stage-coordinate HUD for every planet in the supplied full system. */
export function drawWorldHud(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  star: Star,
  planets: readonly Planet[],
) {
  const pixel = worldHudUserUnitsPerCssPixel(ctx);
  if (!pixel) return;
  const fallback = star.name ?? star.denomination ?? star.type;
  for (const planet of planets) {
    const position = camera.worldToScreen(planet.pos.x, planet.pos.y);
    const centre = camera.worldToScreen(
      planet.orbitCenter.x,
      planet.orbitCenter.y,
    );
    drawWorldOrbit(
      ctx,
      centre.x,
      centre.y,
      planet.orbitRadius * camera.zoom,
      pixel,
    );
    drawWorldGravity(
      ctx,
      position.x,
      position.y,
      getPlanetInfluenceRadius(planet) * camera.zoom,
      pixel,
    );
    const label =
      planet.displayName ??
      (planet.systemPosition === undefined
        ? undefined
        : `${fallback}.${planet.systemPosition}`);
    if (label) {
      drawWorldLabel(
        ctx,
        label,
        position.x,
        position.y,
        planet.radius * camera.zoom,
        Math.atan2(
          planet.pos.y - planet.orbitCenter.y,
          planet.pos.x - planet.orbitCenter.x,
        ),
        pixel,
      );
    }
  }
}
