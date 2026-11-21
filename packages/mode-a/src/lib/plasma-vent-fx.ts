import { type FxPass, fxRetention } from "@void-drift/core";
import { PLASMA_RIFLE_PURGE_STRIPS } from "./plasma-rifle-art";
import type { SalvageSystem } from "./salvage";
import { PLASMA_RIFLE, type PlasmaVentEvent } from "./schemas/salvage";

const FUME_LIFETIME = 0.36;
const REFERENCE_OPACITY = 2.2 * (1 - fxRetention(1 / 60));
type SampleStyle = {
  emit: boolean;
  velocities: [{ vx: number; vy: number }, { vx: number; vy: number }];
};
const styles = new WeakMap<PlasmaVentEvent, SampleStyle>();

/** Replay the study's two emissions per tick per port from midpoint samples. */
export function drawPlasmaVent(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  combat: SalvageSystem,
  now: number,
) {
  const last = combat.plasmaVentEvents.at(-1);
  if (!last || now - last.time >= FUME_LIFETIME) return;
  // The prototype assigned alpha directly. This ratio matches it at 60 Hz
  // while the shared FX surface integrates equivalent light at other rates.
  const exposure = pass.opacity / REFERENCE_OPACITY;
  const cadence = new Map<string, { time: number; index: number }>();
  for (const sample of combat.plasmaVentEvents) {
    const previous = cadence.get(sample.mountKey);
    const index =
      previous && sample.time - previous.time <= 1 / 120 + 1e-7
        ? previous.index + 1
        : 0;
    cadence.set(sample.mountKey, { time: sample.time, index });
    let style = styles.get(sample);
    if (!style) {
      const substep = Math.floor(sample.time * 240 + 1e-7);
      const tick = Math.floor(substep / 4);
      const particle = Math.floor(index / 2) % 2;
      const [left, right] = sample.outlets;
      const mountAngle =
        Math.atan2(right.y - left.y, right.x - left.x) - Math.PI / 2;
      const velocities = sample.outlets.map((port, side) => {
        const strip = PLASMA_RIFLE_PURGE_STRIPS[side];
        const axis = mountAngle + strip.angle;
        const phase = tick * 11.7 + particle * 2.3 + strip.across;
        const jitter = Math.sin(phase) * 0.1;
        return {
          vx:
            port.vx +
            PLASMA_RIFLE.ventExhaustSpeed *
              (Math.cos(axis + jitter) - Math.cos(axis)),
          vy:
            port.vy +
            PLASMA_RIFLE.ventExhaustSpeed *
              (Math.sin(axis + jitter) - Math.sin(axis)),
        };
      }) as SampleStyle["velocities"];
      style = { emit: index % 2 === 0, velocities };
      styles.set(sample, style);
    }
    const age = now - sample.time;
    if (!style.emit || age < 0 || age >= FUME_LIFETIME) continue;
    const radius = 1.4 + age * 13;
    const heat = Math.min(1, sample.intensity + 0.2);
    for (const [side, port] of sample.outlets.entries()) {
      const velocity = style.velocities[side];
      const x = port.x + velocity.vx * age,
        y = port.y + velocity.vy * age;
      if (!pass.visible(x, y, radius) || !pass.budget.take()) continue;
      ctx.save();
      ctx.globalAlpha = (1 - age / FUME_LIFETIME) * heat * 0.12 * exposure;
      ctx.fillStyle = "#ff8c32";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
