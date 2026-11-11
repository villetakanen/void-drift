const STEPS = 32;
const RADIUS = 32;
const SCALE = 4;
let stamps: HTMLCanvasElement[] | undefined;

/** Charge colours are cached; the changing radius is applied at draw time. */
function chargeStamps() {
  if (stamps) return stamps;
  stamps = Array.from({ length: STEPS + 1 }, (_, index) => {
    const charge = index / STEPS;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = RADIUS * 2 * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Plasma charge stamps require Canvas 2D");
    const center = canvas.width / 2;
    const gradient = ctx.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      center,
    );
    gradient.addColorStop(0, `rgba(255,244,214,${0.35 + 0.65 * charge})`);
    gradient.addColorStop(0.25 + 0.2 * charge, "rgba(255,181,46,0.55)");
    gradient.addColorStop(1, "rgba(255,112,30,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, center, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  });
  return stamps;
}

/** The live bead and persistent trace share the same cached definition. */
export function paintPlasmaCharge(
  ctx: CanvasRenderingContext2D,
  charge: number,
) {
  const progress = Math.max(0, Math.min(1, charge));
  const radius = RADIUS * (1 - progress / 2);
  const image = chargeStamps()[Math.round(progress * STEPS)];
  ctx.drawImage(image, -1 - radius, -radius, radius * 2, radius * 2);
}
