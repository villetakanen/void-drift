export interface DrawStarOptions {
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  time: number; // millisecond timestamp to drive animation
  pulseSpeed?: number; // Optional scaling factor for speed (default 1)
  powerZoneRadius?: number; // Optional radius for power regen zone visualization
  appearance?: "standard" | "yellow-family";
  yellowPalette?: YellowStarPalette;
}

export interface YellowStarPalette {
  body: string;
  coronaInner: string;
  coronaOuter: string;
}

const YELLOW_PALETTE_ANCHORS = [
  {
    radius: 24,
    body: "#e88724",
    coronaInner: "#e88a38",
    coronaOuter: "#e46e26",
  },
  {
    radius: 70,
    body: "#ffaa00",
    coronaInner: "#ffb950",
    coronaOuter: "#ff9e30",
  },
  {
    radius: 190,
    body: "#ffe5a5",
    coronaInner: "#ffe8b5",
    coronaOuter: "#ffd076",
  },
] as const;

/** Accepted study palette, interpolated and clamped by surface radius. */
export function yellowStarPalette(radius: number): YellowStarPalette {
  const [small, reference, large] = YELLOW_PALETTE_ANCHORS;
  const lower = radius <= reference.radius ? small : reference;
  const upper = radius <= reference.radius ? reference : large;
  const ratio = Math.max(
    0,
    Math.min(1, (radius - lower.radius) / (upper.radius - lower.radius)),
  );
  return {
    body: mixHex(lower.body, upper.body, ratio),
    coronaInner: mixHex(lower.coronaInner, upper.coronaInner, ratio),
    coronaOuter: mixHex(lower.coronaOuter, upper.coronaOuter, ratio),
  };
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  options: DrawStarOptions,
): void {
  const {
    x,
    y,
    radius,
    color,
    glowColor,
    time,
    pulseSpeed = 1.0,
    powerZoneRadius,
    appearance = "standard",
    yellowPalette,
  } = options;

  if (appearance === "yellow-family") {
    drawYellowFamilyStar(ctx, {
      x,
      y,
      radius,
      time,
      palette: yellowPalette ?? yellowStarPalette(radius),
    });
    return;
  }

  const radiusScale = radius / 40;

  // Draw Power Regen Zone (Behind star)
  if (powerZoneRadius) {
    ctx.beginPath();
    ctx.arc(x, y, powerZoneRadius * radiusScale, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 200, 255, 0.2)"; // Power Color #00c8ff at 20% opacity
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line to differentiate from other visuals
    ctx.stroke();
    ctx.setLineDash([]); // Reset
  }

  // Draw Core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw Pulse Rings
  // We want the rings to expand moving away from the surface
  const maxDist = radius * 3.5; // Rings travel visual distance
  const speed = 0.05 * pulseSpeed; // Base speed tuned vs ms
  const numRings = 3;

  ctx.save();
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;

  for (let i = 0; i < numRings; i++) {
    // Calculate phase-shifted radius
    // We use (time * speed) to get total distance traveled
    // We add an offset based on ring index
    // We modulo by maxDist to loop

    const loopLength = maxDist - radius; // Distance from surface to fade out
    if (loopLength <= 0) continue;

    const totalDist = time * speed;
    const phaseOffset = (i / numRings) * loopLength;
    const currentPos = (totalDist + phaseOffset) % loopLength;

    const ringRadius = radius + currentPos;

    // Calculate opacity: 1 near surface, 0 at maxDist
    const alpha = 1 - currentPos / loopLength;

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.6)); // Max opacity 0.6
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawYellowFamilyStar(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    radius: number;
    time: number;
    palette: YellowStarPalette;
  },
): void {
  const { x, y, radius, time, palette } = options;
  ctx.save();

  // A warm, steady corona gives the accepted yellow family its larger presence.
  const corona = ctx.createRadialGradient(
    x,
    y,
    radius * 0.85,
    x,
    y,
    radius * 2.25,
  );
  corona.addColorStop(0, withAlpha(palette.coronaInner, 0.22));
  corona.addColorStop(0.48, withAlpha(palette.coronaOuter, 0.09));
  corona.addColorStop(1, withAlpha(palette.coronaOuter, 0));
  ctx.fillStyle = corona;
  ctx.fillRect(
    x - radius * 2.25,
    y - radius * 2.25,
    radius * 4.5,
    radius * 4.5,
  );

  // Three outward rings echo the study's LFX pass without adding field guides.
  const travel = radius * 1.4;
  const phase = ((time * 0.018) % travel) / travel;
  for (let i = 0; i < 3; i++) {
    const ringPhase = (phase + i / 3) % 1;
    ctx.globalAlpha = 0.3 * (1 - ringPhase);
    ctx.strokeStyle = palette.coronaInner;
    ctx.lineWidth = Math.max(0.8, radius / 90);
    ctx.beginPath();
    ctx.arc(x, y, radius * (1 + ringPhase * 1.4), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.body;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function mixHex(from: string, to: string, ratio: number): string {
  const fromChannels = hexChannels(from);
  const toChannels = hexChannels(to);
  return `#${fromChannels
    .map((channel, index) =>
      Math.round(channel + (toChannels[index] - channel) * ratio)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function hexChannels(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function withAlpha(hex: string, alpha: number): string {
  const [red, green, blue] = hexChannels(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
