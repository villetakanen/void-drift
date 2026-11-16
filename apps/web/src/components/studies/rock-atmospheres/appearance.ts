import { RockBodyPainter, SphericalSurface } from "@void-drift/core";
import { PRACTICE_VENUS_RADIUS } from "@void-drift/mode-a";
import {
  atmosphereSample,
  type PlanetAppearance,
} from "../../../lib/flight-scene";
import {
  AIR_BOUNDARIES,
  AIR_DEPTH,
  type AirBoundary,
  type AirLighting,
  ATMOSPHERE_TREATMENTS,
  type AtmosphereTreatment,
  isRimLight,
  makeEnvelope,
  makeRimLight,
  RIM_LIGHTS,
  SPIN_SECONDS,
} from "./atmosphere";
import type { CloudFields } from "./cloud-materials";
import {
  type CloudCoverage,
  type CloudOpacity,
  makeCloudPainter,
} from "./clouds";
import { makeSunlightPainter } from "./sunlight";

export function makeRockAppearances(
  materials: HTMLCanvasElement[],
  shadowIntensity: () => number = () => 1,
  treatment: () => AtmosphereTreatment = () => "Limb haze",
  lighting: () => AirLighting = () => "02.4 light",
  coverage: () => CloudCoverage = () => "02.5",
  opacity: () => CloudOpacity = () => "Thin",
  boundary: () => AirBoundary = () => "Current line",
  rimTint: () => string = () => "#ffffff",
  sharedSunlight: () => boolean = () => false,
  cloudShadow: () => number = () => 0.42,
  cloudFields: CloudFields = new Map(),
  cloudMaterial: () => string = () => "Procedural",
  brightCloudFace: () => boolean = () => false,
  cloudDayBrightness: () => number = () => 1,
  showAirflow: () => boolean = () => true,
) {
  const envelopeSet = (scatter: boolean) =>
    new Map(
      ATMOSPHERE_TREATMENTS.flatMap((name) =>
        AIR_BOUNDARIES.map(
          (edge) =>
            [
              `${name}:${edge}`,
              makeEnvelope(PRACTICE_VENUS_RADIUS, name, scatter, edge),
            ] as const,
        ),
      ),
    );
  const envelopes = envelopeSet(false);
  const scatteringEnvelopes = envelopeSet(true);
  const rimLights = new Map<string, ReturnType<typeof makeRimLight>>(
    RIM_LIGHTS.map((kind) => [kind, makeRimLight(PRACTICE_VENUS_RADIUS, kind)]),
  );
  let tintedRim:
    | { key: string; value: ReturnType<typeof makeRimLight> }
    | undefined;
  const clouds = makeCloudPainter(cloudFields, cloudMaterial);
  const sunlight = makeSunlightPainter(cloudFields, cloudMaterial);
  const names = ["Mineral mosaic", "Ancient highlands", "Impact palimpsest"];
  return materials.map((material, index) => {
    const surface = new SphericalSurface(material, "tile");
    const painter = new RockBodyPainter([surface.canvas]);
    // Study-local composition: the same shared rock light applied only to rock.
    // Do not let its hard-light mask shade the air/cloud material a second time.
    const litRock = document.createElement("canvas");
    litRock.width = litRock.height = 192;
    const rockCtx = litRock.getContext("2d");
    if (!rockCtx) throw new Error("Lit rock canvas unavailable");
    return [false, true].map(
      (air): PlanetAppearance => ({
        label: `${names[index]} · ${air ? "air + drag" : "bare rock"}`,
        world(ctx, { planet: p, ship, sun, seconds }) {
          surface.draw((seconds * 2 * Math.PI) / SPIN_SECONDS);
          if (air && lighting() !== "02.4 light") {
            rockCtx.clearRect(0, 0, 192, 192);
            painter.body(rockCtx, 0, 96, 96, 96);
            rockCtx.save();
            rockCtx.globalCompositeOperation = "hard-light";
            painter.light(
              rockCtx,
              96,
              96,
              96,
              96 + sun.pos.x - p.pos.x,
              96 + sun.pos.y - p.pos.y,
              shadowIntensity(),
            );
            rockCtx.restore();
            ctx.drawImage(
              litRock,
              p.pos.x - p.radius,
              p.pos.y - p.radius,
              p.radius * 2,
              p.radius * 2,
            );
          } else painter.body(ctx, 0, p.pos.x, p.pos.y, p.radius);
          if (!air) return;
          const extent = p.radius + AIR_DEPTH;
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(
            Math.atan2(sun.pos.y - p.pos.y, sun.pos.x - p.pos.x) - Math.PI,
          );
          const envelope = (
            lighting() === "Face scatter" ? scatteringEnvelopes : envelopes
          ).get(`${treatment()}:${boundary()}`);
          if (!envelope) throw new Error("Atmosphere treatment unavailable");
          ctx.drawImage(envelope, -extent, -extent, extent * 2, extent * 2);
          ctx.restore();
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          clouds(
            ctx,
            p.radius + AIR_DEPTH * 0.42,
            treatment(),
            seconds,
            Math.atan2(sun.pos.y - p.pos.y, sun.pos.x - p.pos.x),
            coverage(),
            opacity(),
            cloudShadow(),
            brightCloudFace(),
            cloudDayBrightness(),
          );
          ctx.restore();
          if (!showAirflow()) return;
          const sample = atmosphereSample(ship, p, AIR_DEPTH);
          const vx = ship.vel.x - sample.vx,
            vy = ship.vel.y - sample.vy;
          const speed = Math.hypot(vx, vy);
          if (sample.density <= 0 || speed < 1) return;
          ctx.save();
          ctx.translate(ship.pos.x, ship.pos.y);
          ctx.rotate(Math.atan2(vy, vx));
          ctx.strokeStyle = `rgba(182,221,231,${sample.density * 0.85})`;
          ctx.lineWidth = 1;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(ship.radius + 2, side * 2);
            ctx.quadraticCurveTo(
              0,
              side * (ship.radius + 6),
              -ship.radius - Math.min(18, speed * 0.06),
              side * (ship.radius + 3),
            );
            ctx.stroke();
          }
          ctx.restore();
        },
        lfx(ctx, { planet: p, sun, seconds }) {
          if (!air || lighting() === "02.4 light")
            painter.light(
              ctx,
              p.pos.x,
              p.pos.y,
              p.radius,
              sun.pos.x,
              sun.pos.y,
              shadowIntensity(),
            );
          if (sharedSunlight())
            sunlight(
              ctx,
              p.radius,
              p.pos.x,
              p.pos.y,
              Math.atan2(sun.pos.y - p.pos.y, sun.pos.x - p.pos.x),
              sun.color,
              seconds,
              air ? treatment() : "Limb haze",
              coverage(),
              opacity(),
            );
          const kind = boundary();
          let rim = air ? rimLights.get(kind) : undefined;
          if (rim && isRimLight(kind) && rimTint() !== "#ffffff") {
            const key = `${kind}:${rimTint()}`;
            if (tintedRim?.key !== key)
              tintedRim = {
                key,
                value: makeRimLight(p.radius, kind, rimTint()),
              };
            rim = tintedRim.value;
          }
          if (rim) {
            ctx.save();
            ctx.translate(p.pos.x, p.pos.y);
            ctx.rotate(
              Math.atan2(sun.pos.y - p.pos.y, sun.pos.x - p.pos.x) - Math.PI,
            );
            ctx.drawImage(
              rim.canvas,
              -rim.extent,
              -rim.extent,
              rim.extent * 2,
              rim.extent * 2,
            );
            ctx.restore();
          }
        },
      }),
    );
  });
}
