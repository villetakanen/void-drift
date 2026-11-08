import { Vec2 } from "@void-drift/core";
import { CHASSIS, engineImpulse } from "@void-drift/mode-a";
import { z } from "astro/zod";

export const BenchSettings = z.object({
  acceleration: z.number().finite().min(1).max(2000),
  maxSpeed: z.number().finite().min(10).max(3000),
});
export const DT = 1 / 60;
export const INPUT_SEQUENCE = [
  "LR",
  "LR",
  "–",
  "L",
  "–",
  "LR",
  "–",
  "R",
  "–",
  "R",
  "–",
  "LR",
  "LR",
  "LR",
] as const;
export const DURATION = INPUT_SEQUENCE.length;
export const TOTAL_TICKS = DURATION * 60;
export const variants = [
  { label: "1 aft", sides: false, aft: 1, color: "#5ce5e7" },
  { label: "2 side", sides: true, aft: 0, color: "#ffbd69" },
  { label: "2 aft + 2 side", sides: true, aft: 2, color: "#c8fa64" },
  { label: "Constant 75%", sides: false, aft: 0, color: "#c49bff" },
];
export type Sample = {
  vx?: number;
  vy?: number;
  emissions?: number[];
  ceiling?: number;
  spin?: number;
  stabilizer?: number;
  x: number;
  y: number;
  heading: number;
  speed: number;
  distance: number;
};
export function sequence(tick: number) {
  const input =
    INPUT_SEQUENCE[Math.min(DURATION - 1, Math.max(0, Math.floor(tick / 60)))];
  return {
    left: input === "LR" || input === "L",
    right: input === "LR" || input === "R",
  };
}
export function simulateBench(raw: unknown): Sample[][] {
  const settings = BenchSettings.parse(raw);
  const chassis = CHASSIS.fighter;
  const angle = (chassis.angle * Math.PI) / 180;
  const turnRate =
    (settings.acceleration *
      chassis.turnResponse *
      (Math.cos(angle) * chassis.arm + Math.sin(angle) * chassis.sideX)) /
    chassis.length ** 2;
  return variants.map((variant, index) => {
    const ship = {
      pos: new Vec2(0, 0),
      vel: new Vec2(index === 3 ? settings.maxSpeed * 0.75 : 0, 0),
      acc: new Vec2(0, 0),
      rotation: 0,
      radius: 1,
    };
    let distance = 0;
    const samples: Sample[] = [];
    const record = () =>
      samples.push({
        x: ship.pos.x,
        y: ship.pos.y,
        heading: ship.rotation,
        speed: ship.vel.mag(),
        distance,
      });
    record();
    for (let tick = 0; tick < TOTAL_TICKS; tick++) {
      const input = sequence(tick);
      for (let sub = 0; sub < 4; sub++) {
        const dt = DT / 4;
        const push = (direction: number, count: number) =>
          engineImpulse(
            ship,
            direction,
            settings.acceleration * count,
            settings.maxSpeed,
            dt,
          );
        if (variant.sides) {
          ship.rotation +=
            (Number(input.left) - Number(input.right)) * turnRate * dt;
          if (input.left && input.right)
            push(ship.rotation, 2 * Math.cos(angle));
          else if (input.left) push(ship.rotation + angle, 1);
          else if (input.right) push(ship.rotation - angle, 1);
        }
        if (variant.aft && input.left && input.right) {
          for (let engine = 0; engine < variant.aft; engine++)
            push(ship.rotation, 1);
        }
        ship.pos.x += ship.vel.x * dt;
        ship.pos.y += ship.vel.y * dt;
        distance += ship.vel.mag() * dt;
      }
      record();
    }
    return samples;
  });
}
