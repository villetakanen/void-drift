import { loadPlanetMap, type PlanetMap } from "./planet-maps";
import { RockBodyPainter } from "./rock-body";
import { StripSphericalSurface } from "./strip-spherical-surface";

/**
 * Air drawn on World with native gradients, no light of its own: a soft haze
 * from the ground out to the air's edge, and a fixed blue rim at that edge on
 * the day side. Spec: docs/specs/game/world/planets/spec.md#practice-cradle.
 */
const HAZE = "150, 190, 235";
const RIM = "170, 210, 255";
/** Each rim arc peaks this far from its tangent, toward the star. */
const RIM_PEAK = Math.PI / 9;
/** Gaussian half-width of each arc, as an angle. */
const RIM_SPREAD = Math.PI / 10;
/** The rim's bright core sits this far inside the air's edge. */
const RIM_INSET = 0.7;
const RIM_CORE = 1.1;
const RIM_HALO = 3.3;

/** World-unit margin the rim's halo reaches beyond the air's edge. */
export const ATMOSPHERE_BOUNDS_MARGIN = RIM_HALO / 2;

function rimStops(gradient: CanvasGradient, alpha: number) {
  // Conic angle 0 faces the star; arcs centre 90° − 20° either side of it.
  const centre = Math.PI / 2 - RIM_PEAK;
  const tau = 2 * Math.PI;
  for (let i = 0; i <= 72; i++) {
    const angle = (i / 72) * tau;
    const fromAxis = Math.min(angle, tau - angle);
    const weight = Math.exp(-(((fromAxis - centre) / RIM_SPREAD) ** 2));
    gradient.addColorStop(
      i / 72,
      `rgba(${RIM}, ${(alpha * weight).toFixed(3)})`,
    );
  }
}

export function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  groundRadius: number,
  depth: number,
  sunX: number,
  sunY: number,
  zoom: number,
) {
  const edge = groundRadius + depth;
  const haze = ctx.createRadialGradient(x, y, 0, x, y, edge);
  const limb = groundRadius / edge;
  haze.addColorStop(0, `rgba(${HAZE}, 0.03)`);
  haze.addColorStop(limb * 0.85, `rgba(${HAZE}, 0.07)`);
  haze.addColorStop(limb, `rgba(${HAZE}, 0.22)`);
  haze.addColorStop(1, `rgba(${HAZE}, 0)`);
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, edge, 0, Math.PI * 2);
  ctx.fill();

  const toSun = Math.atan2(sunY - y, sunX - x);
  const rim = edge - RIM_INSET;
  for (const [width, alpha] of [
    [RIM_HALO, 0.18],
    [RIM_CORE, 0.85],
  ] as const) {
    const gradient = ctx.createConicGradient(toSun, x, y);
    rimStops(gradient, alpha);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(width, 1 / zoom);
    ctx.beginPath();
    ctx.arc(x, y, rim, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** A ground and a partly transparent cloud surface, turning independently. */
export async function createCloudedWorld(ground: PlanetMap, clouds: PlanetMap) {
  const [groundMap, cloudMap] = await Promise.all([
    loadPlanetMap(ground),
    loadPlanetMap(clouds),
  ]);
  const surface = new StripSphericalSurface(groundMap);
  return {
    painter: new RockBodyPainter([surface.canvas]),
    surface,
    clouds: new StripSphericalSurface(cloudMap),
  };
}
