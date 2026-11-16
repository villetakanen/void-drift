export interface DrawPlanetOptions {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  options: DrawPlanetOptions,
) {
  const { x, y, radius, color } = options;

  ctx.save();
  ctx.translate(x, y);
  // Planet Body (flat vector fill)
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Crisp outline to match flat HUD/game shapes
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = Math.max(1, radius * 0.06);
  ctx.globalAlpha = 1;
  ctx.stroke();

  ctx.restore();
}
