import { Vec2 } from "@void-drift/core";
import {
  applyBuildEngines,
  buildDrain,
  buildStats,
  CHASSIS,
  defaultLoadout,
  type EngineTimers,
  LoadoutSchema,
  PARTS,
  stabilizerMount,
} from "@void-drift/mode-a";
import { z } from "astro/zod";
import {
  type BurnId,
  DT,
  inputAt,
  TOTAL_TICKS,
} from "../../../lib/instrument/burns";
import {
  type Sample,
  TRACK_COLORS,
  type Track,
  traces,
} from "../../../lib/instrument/calculate";

export const FittingTuning = z
  .object({
    push: z.number().min(10).max(250).default(78),
    interval: z.number().int().min(3).max(60).default(16),
    speedGain: z.number().int().min(12).max(60).default(42),
    mass: z.number().int().min(1).max(48).default(17),
    cost: z.number().min(0).max(50).default(0.5),
  })
  .strict();
const fighter = (
  aft: ("fusion" | "ion" | null)[],
  side: "ion" | "fusion" = "ion",
) => LoadoutSchema.parse({ ...defaultLoadout("fighter"), side, aft });
const wasp = (side: "fusion" | "ion") =>
  LoadoutSchema.parse({ ...defaultLoadout("wasp"), side });
const fittings = [
  { label: "Wasp · ion", build: wasp("ion") },
  { label: "Wasp · fission", build: wasp("fusion") },
  { label: "Fighter · aft ion", build: fighter(["ion", null]) },
  { label: "Fighter · aft fission", build: fighter(["fusion", null]) },
  { label: "Fighter · twin fission", build: fighter(["fusion", "fusion"]) },
  { label: "Fighter · side fission", build: fighter(["ion", null], "fusion") },
];
const referenceMass = buildStats(wasp("fusion")).mass;
export function fittingTracks(burn: BurnId, raw: unknown) {
  const tune = FittingTuning.parse(raw);
  const parts = {
    ...PARTS,
    fusion: {
      ...PARTS.fusion,
      thrust: 0,
      mass: tune.mass,
      speedContribution: tune.speedGain,
    },
  };
  return fittings.map(({ label, build }, index) => {
    const stats = buildStats(build, parts);
    const sideFission = build.chassis === "fighter" && build.side === "fusion";
    const chassis = CHASSIS[build.chassis];
    const angle = (chassis.angle * Math.PI) / 180;
    const lever =
      Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX;
    const inertia = stabilizerMount(build.chassis).inertiaPerMass;
    const fittedCount =
      stats.engineBreakdown.find((e) => e.id === "fusion")?.count ?? 0;
    const ship = {
      pos: new Vec2(0, 0),
      vel: new Vec2(0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 16,
    };
    const motion = { velocity: 0 };
    const timers: EngineTimers = {};
    const samples: Sample[] = [];
    const battery: number[] = [];
    const marks: number[] = [];
    let energy = stats.capacity;
    let ready = 0;
    function record() {
      samples.push({
        x: ship.pos.x,
        y: ship.pos.y,
        vx: ship.vel.x,
        vy: ship.vel.y,
        spin: (motion.velocity * 180) / Math.PI,
      });
      battery.push(energy);
    }
    record();
    for (let tick = 0; tick < TOTAL_TICKS; tick++) {
      const { left, right } = inputAt(burn, tick);
      const input = { leftThruster: left, rightThruster: right, fire: false };
      const held = left && right;
      const count = sideFission
        ? Number(left) + Number(right)
        : held
          ? fittedCount
          : 0;
      if (count && tick >= ready && energy >= count * tune.cost) {
        const gain = (tune.push * referenceMass) / stats.mass;
        const imbalance = sideFission ? Number(left) - Number(right) : 0;
        const forward = gain * count * (sideFission ? Math.cos(angle) : 1);
        const lateral = gain * imbalance * Math.sin(angle);
        const cos = Math.cos(ship.rotation),
          sin = Math.sin(ship.rotation);
        const next = new Vec2(
          ship.vel.x + forward * cos - lateral * sin,
          ship.vel.y + forward * sin + lateral * cos,
        );
        const speed = next.mag();
        if (speed > stats.poweredCruiseCeiling)
          next.mult(stats.poweredCruiseCeiling / speed);
        if (Math.hypot(next.x - ship.vel.x, next.y - ship.vel.y) > 1e-6) {
          ship.vel = next;
          motion.velocity += (gain * imbalance * lever) / inertia;
          energy -= count * tune.cost;
          ready = tick + tune.interval;
          marks.push(tick + 1);
        }
      }
      for (let sub = 0; sub < 4; sub++) {
        const dt = DT / 4;
        // Continuous draw excludes the catalogue pulse, paid above per ignition.
        const demand =
          (buildDrain(
            build,
            input,
            motion.velocity,
            dt,
            undefined,
            1,
            stats.mass,
          ) -
            count * PARTS.fusion.draw) *
          dt;
        const available = energy + 3 * dt;
        const fraction = Math.min(1, available / demand);
        energy = Math.max(0, Math.min(stats.capacity, available - demand));
        applyBuildEngines(
          ship,
          build,
          input,
          dt,
          true,
          timers,
          fraction,
          motion,
          undefined,
          parts,
          stats,
        );
        ship.pos.x += ship.vel.x * dt;
        ship.pos.y += ship.vel.y * dt;
      }
      record();
    }
    return {
      label,
      color: TRACK_COLORS[index],
      samples,
      traces: { ...traces(samples), battery },
      marks: { speed: marks },
      mass: stats.mass,
      ceiling: stats.poweredCruiseCeiling,
    } satisfies Track & { mass: number; ceiling: number };
  });
}
