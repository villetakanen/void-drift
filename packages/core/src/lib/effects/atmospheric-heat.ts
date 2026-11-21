import type { AirSample } from "../physics/atmosphere";
import type { FxPass } from "./arcade-fx";

/**
 * The atmospheric heat cue: a curved band stamped into FX and a soft contact
 * glow on LFX, both read from a ship's air sample. A display of air contact
 * only; nothing here feeds back into the simulation.
 * Spec: docs/specs/game/render/fx.md#atmospheric-heat.
 */

/** Relative speed, in world units per second, at which excitation saturates. */
export const HEAT_REFERENCE_SPEED = 300;

/** Visual excitation from density and squared relative speed, 0..1. */
export function heatExcitation(sample: AirSample | null): number {
  if (!sample || sample.density <= 0) return 0;
  const speed = Math.hypot(
    sample.relativeVelocity.x,
    sample.relativeVelocity.y,
  );
  return Math.min(1, sample.density * (speed / HEAT_REFERENCE_SPEED) ** 2);
}

/**
 * Cue strength, 0..1. Density alone gives a floor so a slow skim still reads;
 * speed lifts it from there. Rises with either until the cap.
 */
export function heatStrength(sample: AirSample | null): number {
  if (!sample || sample.density <= 0) return 0;
  return Math.min(
    1,
    0.4 * Math.sqrt(sample.density) + 0.6 * Math.sqrt(heatExcitation(sample)),
  );
}

interface HeatShip {
  readonly pos: { readonly x: number; readonly y: number };
  readonly radius: number;
}

// Band source in its own units: origin at the ship, travel along +x, the band's
// half on +y. Prepared at twice its nominal pixel size for close zoom.
const BAND = { width: 160, height: 128, x: 72, y: 64, radius: 28 } as const;
const BAND_RES = 2;
const BAND_HALF_WIDTH = 9;
const GLOW_SIZE = 64;

interface HeatStamps {
  band: HTMLCanvasElement;
  glow: HTMLCanvasElement;
}
let stamps: HeatStamps | undefined;

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Heat cue canvas unavailable");
  return ctx;
}

/** Builds the band and glow stamps once per page; drawing never rebuilds them. */
export function prepareAtmosphericHeat(): void {
  if (stamps || typeof document === "undefined") return;
  const band = document.createElement("canvas");
  band.width = BAND.width * BAND_RES;
  band.height = BAND.height * BAND_RES;
  const b = context(band);
  const pixels = b.createImageData(band.width, band.height);
  for (let y = 0; y < band.height; y++)
    for (let x = 0; x < band.width; x++) {
      const u = (x + 0.5) / BAND_RES - BAND.x;
      const v = (y + 0.5) / BAND_RES - BAND.y;
      const angle = Math.atan2(v, u);
      let strength = 0;
      // A curve from the nose round the side, thinning to nothing at the tail.
      if (angle > 0 && angle < Math.PI * 0.85) {
        const end = Math.sin(angle / 0.85);
        const width = BAND_HALF_WIDTH * Math.sqrt(end);
        strength =
          Math.max(0, 1 - ((Math.hypot(u, v) - BAND.radius) / width) ** 2) **
            2 *
          end;
      }
      // Pale gold at the leading edge, deep orange toward the tail.
      const warm = Math.max(0, Math.min(1, (u + 48) / 78));
      const i = (y * band.width + x) * 4;
      pixels.data[i] = 255;
      pixels.data[i + 1] = 56 + warm * 162;
      pixels.data[i + 2] = 12 + warm * 100;
      pixels.data[i + 3] = Math.round(strength * 242);
    }
  b.putImageData(pixels, 0, 0);

  const glow = document.createElement("canvas");
  glow.width = glow.height = GLOW_SIZE;
  const g = context(glow);
  const half = GLOW_SIZE / 2;
  const light = g.createRadialGradient(half, half, 0, half, half, half);
  light.addColorStop(0, "rgba(255,245,214,0.95)");
  light.addColorStop(0.25, "rgba(255,220,155,0.7)");
  light.addColorStop(0.65, "rgba(255,184,130,0.2)");
  light.addColorStop(1, "rgba(255,184,130,0)");
  g.fillStyle = light;
  g.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);

  stamps = { band, glow };
}

/**
 * Stamps fresh band light into the FX surface: mirrored around the ship's
 * velocity relative to the air, weighted toward the planet.
 */
export function stampHeatBand(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  ship: HeatShip,
  sample: AirSample | null,
): void {
  const strength = heatStrength(sample);
  if (!stamps || !sample || strength <= 0) return;
  const scale = ship.radius / 24;
  const reach = BAND.width * scale;
  if (!pass.visible(ship.pos.x, ship.pos.y, reach) || !pass.budget.take(true))
    return;
  const { x: vx, y: vy } = sample.relativeVelocity;
  // At rest in the air the band faces the planet.
  const angle =
    vx || vy
      ? Math.atan2(vy, vx)
      : Math.atan2(sample.towardPlanet.y, sample.towardPlanet.x);
  const inward =
    -Math.sin(angle) * sample.towardPlanet.x +
    Math.cos(angle) * sample.towardPlanet.y;
  ctx.save();
  ctx.translate(ship.pos.x, ship.pos.y);
  ctx.rotate(angle);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(1, side);
    const weight = 0.18 + 0.82 * (0.5 + 0.5 * inward * side);
    ctx.globalAlpha = pass.opacity * 0.95 * strength * weight;
    ctx.drawImage(
      stamps.band,
      -BAND.x * scale,
      -BAND.y * scale,
      BAND.width * scale,
      BAND.height * scale,
    );
    ctx.restore();
  }
  ctx.restore();
}

/** Draws the live contact glow on the ship's planet-facing side. */
export function drawHeatGlow(
  ctx: CanvasRenderingContext2D,
  ship: HeatShip,
  sample: AirSample | null,
): void {
  const strength = heatStrength(sample);
  if (!stamps || !sample || strength <= 0) return;
  const r = ship.radius;
  if (!inView(ctx, ship.pos.x, ship.pos.y, r * 2)) return;
  ctx.save();
  ctx.translate(ship.pos.x, ship.pos.y);
  ctx.rotate(Math.atan2(sample.towardPlanet.y, sample.towardPlanet.x));
  ctx.globalAlpha = 0.85 * strength;
  ctx.drawImage(stamps.glow, r * 0.15, -r * 1.1, r * 1.2, r * 2.2);
  ctx.restore();
}

function inView(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const t = ctx.getTransform();
  const px = t.a * x + t.c * y + t.e;
  const py = t.b * x + t.d * y + t.f;
  const rx = radius * (Math.abs(t.a) + Math.abs(t.c));
  const ry = radius * (Math.abs(t.b) + Math.abs(t.d));
  return (
    px + rx >= 0 &&
    py + ry >= 0 &&
    px - rx <= ctx.canvas.width &&
    py - ry <= ctx.canvas.height
  );
}
