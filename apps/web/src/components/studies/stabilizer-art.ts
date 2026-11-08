import type { stabilizerGeometry } from "./rotation-bench";
export function drawStabilizerSlits(
  ctx: CanvasRenderingContext2D,
  geometry: Pick<
    ReturnType<typeof stabilizerGeometry>,
    "x" | "y" | "fx" | "fy"
  >,
) {
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(geometry.x, side * geometry.y);
    // Local +x is the force axis. Exhaust points backwards from the recessed slit.
    ctx.rotate(Math.atan2(-side * geometry.fy, geometry.fx));
    ctx.fillStyle = "#080b13";
    ctx.beginPath();
    ctx.moveTo(-1.2, -3.2);
    ctx.lineTo(1, -2.6);
    ctx.lineTo(1, 2.6);
    ctx.lineTo(-1.2, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#303d4c";
    ctx.fillRect(-0.45, -2.2, 0.9, 4.4);
    ctx.strokeStyle = "#718594";
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    ctx.moveTo(0.65, -2.5);
    ctx.lineTo(0.65, 2.5);
    ctx.stroke();
    ctx.strokeStyle = "#69cfff";
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(-0.7, -2.3);
    ctx.lineTo(-0.7, 2.3);
    ctx.stroke();

    ctx.restore();
  }
}
