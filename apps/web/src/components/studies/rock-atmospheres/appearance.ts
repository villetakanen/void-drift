import { RockBodyPainter, SphericalSurface } from "@void-drift/core";
import { PRACTICE_VENUS_RADIUS } from "@void-drift/mode-a";
import {
  atmosphereSample,
  type PlanetAppearance,
} from "../../../lib/flight-scene";
import {
  AIR_DEPTH,
  ATMOSPHERE_TREATMENTS,
  type AtmosphereTreatment,
  makeEnvelope,
  SPIN_SECONDS,
} from "./atmosphere";

import { makeCloudPainter } from "./clouds";

export function makeRockAppearances(
  materials: HTMLCanvasElement[],
  shadowIntensity: () => number = () => 1,
  treatment: () => AtmosphereTreatment = () => "Limb haze",
) {
  const envelopes = new Map(
    ATMOSPHERE_TREATMENTS.map((name) => [
      name,
      makeEnvelope(PRACTICE_VENUS_RADIUS, name),
    ]),
  );
  const clouds = makeCloudPainter();
  const names = ["Mineral mosaic", "Ancient highlands", "Impact palimpsest"];
  return materials.map((material, index) => {
    const surface = new SphericalSurface(material, "tile");
    const painter = new RockBodyPainter([surface.canvas]);
    return [false, true].map(
      (air): PlanetAppearance => ({
        label: `${names[index]} · ${air ? "air + drag" : "bare rock"}`,
        world(ctx, { planet: p, ship, sun, seconds }) {
          surface.draw((seconds * 2 * Math.PI) / SPIN_SECONDS);
          painter.body(ctx, 0, p.pos.x, p.pos.y, p.radius);
          if (!air) return;
          const extent = p.radius + AIR_DEPTH;
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(
            Math.atan2(sun.pos.y - p.pos.y, sun.pos.x - p.pos.x) - Math.PI,
          );
          const envelope = envelopes.get(treatment());
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
          );
          ctx.restore();
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
        lfx(ctx, { planet: p, sun }) {
          painter.light(
            ctx,
            p.pos.x,
            p.pos.y,
            p.radius,
            sun.pos.x,
            sun.pos.y,
            shadowIntensity(),
          );
        },
      }),
    );
  });
}
