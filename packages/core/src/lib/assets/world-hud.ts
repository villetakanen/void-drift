import { COLOR } from "../ui/colors";
import { canvasFont } from "../ui/typography";

/** Proposed world HUD primitives, drawn after projection in screen coordinates.
 * Text, dashes and leader lengths keep their screen size as the world zooms.
 */
export function drawWorldOrbit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  ctx.save();
  ctx.strokeStyle = COLOR.countdown;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 7]);
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
) {
  ctx.save();
  ctx.strokeStyle = COLOR.countdown;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
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
) {
  ctx.save();
  const nx = Math.cos(angle),
    ny = Math.sin(angle),
    side = nx >= 0 ? 1 : -1;
  const ax = x + nx * (radius + 4),
    ay = y + ny * (radius + 4);
  const bx = x + nx * (radius + 17),
    by = y + ny * (radius + 17);
  const end = bx + side * 14;
  ctx.strokeStyle = COLOR.countdown;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(end, by);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = canvasFont(12, 700);
  ctx.textAlign = side > 0 ? "left" : "right";
  ctx.textBaseline = "middle";
  // A narrow void halo keeps the label readable when a field marking crosses it.
  ctx.strokeStyle = COLOR.void;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.strokeText(text, end + side * 5, by);
  ctx.fillStyle = COLOR.countdown;
  ctx.fillText(text, end + side * 5, by);
  ctx.restore();
}
