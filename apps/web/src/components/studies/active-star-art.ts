/** Study-local proposals, shared by the 02.1 plates and 02.2 time comparison. */
export function activeSurface(
  ctx: CanvasRenderingContext2D,
  r: number,
  activity: number,
  time = 0,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#b33b22";
  ctx.fill();
  for (let i = 0; i < 180; i++) {
    const a = i * 2.39996,
      d = r * Math.sqrt((i + 0.5) / 180);
    const heat = 0.35 + activity * 0.4 + Math.sin(time * 0.8 + i) * 0.1;
    ctx.globalAlpha = heat;
    ctx.fillStyle = i % 4 === 0 ? "#8d2c25" : "#ff9c60";
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(a) * d,
      Math.sin(a) * d,
      r * (0.035 + (i % 3) * 0.012),
      r * 0.04,
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const [x, y, size] of [
    [-0.3, -0.4, 0.16],
    [0.15, 0.35, 0.12],
    [-0.25, -0.22, 0.09],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x * r, y * r, size * r, size * r * 0.65, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = "#55232c";
    ctx.fill();
  }
  // Several regions brighten together; the warning begins on the surface.
  ctx.globalAlpha = activity;
  for (let i = 0; i < 5; i++) {
    const a = i * 2.39996,
      d = r * (0.55 + (i % 2) * 0.2);
    ctx.beginPath();
    ctx.arc(
      Math.cos(a) * d,
      Math.sin(a) * d,
      r * (0.045 + activity * 0.035),
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#ffeac4";
    ctx.fill();
  }
  ctx.restore();
}

export function activeAtmosphere(
  ctx: CanvasRenderingContext2D,
  r: number,
  activity: number,
) {
  ctx.save();
  const reach = r * (1.65 + activity * 2.25);
  const g = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, reach);
  g.addColorStop(0, `rgba(255, 210, 160, ${0.12 + activity * 0.45})`);
  g.addColorStop(0.45, `rgba(255, 105, 55, ${0.03 + activity * 0.23})`);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(-reach, -reach, reach * 2, reach * 2);
  ctx.restore();
}

export function activeArcs(
  ctx: CanvasRenderingContext2D,
  r: number,
  activity: number,
  time = 0,
) {
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39996 + time * 0.08;
    const d = r * (1.04 + (i % 3) * 0.12 + activity * 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, d, a, a + 0.15 + activity * 0.35);
    ctx.strokeStyle = `rgba(255, 190, 140, ${0.2 + activity * 0.65})`;
    ctx.lineWidth = 0.75 + activity * 1.5;
    ctx.stroke();
  }
  ctx.restore();
}
