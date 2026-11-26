import { type FxPass, paintBeam } from "@void-drift/core";
import { DRONE_NOZZLE } from "./drone-art";
import { DRONE_WAVE_SECONDS, droneWaveRadius } from "./drone-flight";
import { LIGHT_ION_BEAM, PARTS } from "./schemas/loadout";
import type { Simulation } from "./simulation";

const service = PARTS["service-ion"].ion?.beam;
if (!service) throw new Error("Missing Service ion beam");
const beam = {
  length: (service.length + LIGHT_ION_BEAM.length) / 2,
  width: (service.width + LIGHT_ION_BEAM.width) / 2,
  ink: "41,186,255",
};

type Brush = "track" | "tip" | "flash" | "liveFlash" | "frame" | "shell";
const profile: Record<Brush, readonly (readonly [number, string])[]> = {
  track: [
    [0, "#1e963000"],
    [0.32, "#60e04873"],
    [0.5, "#60e048"],
    [0.68, "#60e04873"],
    [1, "#1e963000"],
  ],
  tip: [
    [0, "#e4ffdf"],
    [0.55, "#e4ffdf"],
    [1, "#e4ffdf00"],
  ],
  shell: [
    [0, "#b0f0a400"],
    [0.93, "#b0f0a400"],
    [0.975, "#b0f0a4d9"],
    [1, "#b0f0a400"],
  ],
  // Pale source channels reproduce the greener fission ink on hard-light LFX.
  frame: [
    [0, "#e4ffdf"],
    [0.55, "#e4ffdfcc"],
    [0.9, "#b0f0a459"],
    [1, "#b0f0a400"],
  ],
  liveFlash: [
    [0, "#ffffff"],
    [0.18, "#ffffffe6"],
    [0.4, "#e4ffdf8c"],
    [0.62, "#b0f0a43d"],
    [1, "#b0f0a400"],
  ],
  flash: [
    [0, "#ffffff"],
    [0.18, "#ffffffe6"],
    [0.4, "#c8ffbe8c"],
    [0.62, "#60e0483d"],
    [1, "#60e04800"],
  ],
};
const brushes = new Map<Brush, HTMLCanvasElement>();
function brush(kind: Brush) {
  let image = brushes.get(kind);
  if (image) return image;
  image = document.createElement("canvas");
  image.width = kind === "track" ? 1 : 128;
  image.height = 128;
  const ctx = image.getContext("2d");
  if (!ctx) throw new Error("Fission light requires a 2D canvas");
  const ramp =
    kind === "track"
      ? ctx.createLinearGradient(0, 0, 0, 128)
      : ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [offset, color] of profile[kind]) ramp.addColorStop(offset, color);
  ctx.fillStyle = ramp;
  ctx.fillRect(0, 0, image.width, image.height);
  brushes.set(kind, image);
  return image;
}
const FLASH_REACH = 180;

function lightHullFace(
  ctx: CanvasRenderingContext2D,
  pass: FxPass,
  source: { x: number; y: number },
  x: number,
  y: number,
  radius: number,
) {
  const dx = source.x - x;
  const dy = source.y - y;
  const distance = Math.hypot(dx, dy);
  const r = radius * 1.15;
  if (distance >= FLASH_REACH || !pass.visible(x, y, r * 2)) return;
  const dose =
    Math.min(1, (40 / Math.max(1, distance)) ** 2) *
    Math.min(1, (FLASH_REACH - distance) / (FLASH_REACH * 0.1));
  if (dose <= 0.01 || !pass.budget.take(true)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.globalAlpha = Math.min(1, dose * 1.8);
  ctx.drawImage(brush("liveFlash"), -r * 0.55, -r * 1.3, r * 1.9, r * 2.6);
  ctx.restore();
}

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  start: number;
  end: number;
  birth: number;
  life: number;
};
export class DroneLight {
  // An emitter has three straight legs: one parent and two diverging daughters.
  // Positions come from simulation time. Only the FX surface remembers old light.
  private readonly sparks: Spark[] = [];
  private seen = 0;
  private time = -1;
  clear() {
    this.sparks.length = 0;
    this.seen = 0;
    this.time = -1;
  }
  stamp(
    ctx: CanvasRenderingContext2D,
    pass: FxPass,
    sim: Simulation,
    time: number,
  ) {
    if (time < this.time) this.clear();
    const previous = this.time;
    this.time = time;
    for (const drone of sim.droneFlight.drones) {
      if (
        !(drone.thrust > 0) ||
        !pass.visible(drone.x, drone.y, 48) ||
        !pass.budget.take(true)
      )
        continue;
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.rotation);
      ctx.translate(-DRONE_NOZZLE, 0);
      ctx.globalAlpha = pass.opacity;
      paintBeam(ctx, Math.sqrt(Math.min(1, drone.thrust)), beam);
      ctx.restore();
    }
    for (const event of sim.droneFlight.events) {
      if (event.seq <= this.seen) continue;
      this.seen = event.seq;
      if (time - event.time > 0.1 || !pass.visible(event.x, event.y, 180))
        continue;
      const burst = event.kind === "detonation";
      const toward = Math.atan2(
        event.originY - event.y,
        event.originX - event.x,
      );
      const distance = Math.hypot(
        event.originX - event.x,
        event.originY - event.y,
      );
      const count = burst
        ? 12
        : Math.max(
            1,
            Math.round(8 * Math.min(1, (40 / Math.max(1, distance)) ** 2)),
          );
      this.emit(
        event.x,
        event.y,
        event.time,
        event.seq,
        toward,
        burst ? Math.PI : 0.9,
        count,
      );
      if (burst && pass.budget.take(true)) {
        ctx.save();
        ctx.globalAlpha = pass.opacity;
        ctx.drawImage(brush("flash"), event.x - 25, event.y - 25, 50, 50);
        ctx.restore();
      }
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      const start = Math.max(spark.start, previous, time - 0.1);
      const end = Math.min(spark.end, time);
      if (end > start) {
        const elapsed = end - spark.start;
        const x = spark.x + spark.vx * elapsed,
          y = spark.y + spark.vy * elapsed;
        const length = Math.hypot(spark.vx, spark.vy) * (end - start);
        if (pass.visible(x, y, length + 3) && pass.budget.take()) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.atan2(spark.vy, spark.vx));
          ctx.globalAlpha = Math.min(
            1,
            pass.opacity * 2.5 * (1 - (0.4 * (end - spark.birth)) / spark.life),
          );
          ctx.drawImage(brush("track"), -length, -2.25, length, 4.5);
          ctx.restore();
        }
      }
      if (time >= spark.end) this.sparks.splice(i, 1);
    }
  }
  private emit(
    x: number,
    y: number,
    birth: number,
    seed: number,
    angle: number,
    spread: number,
    count: number,
  ) {
    let state = seed >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const speed =
      (droneWaveRadius(DRONE_WAVE_SECONDS) - droneWaveRadius(0)) /
      DRONE_WAVE_SECONDS;
    for (let i = 0; i < count && this.sparks.length + 3 <= 768; i++) {
      const dir = angle + ((i + random()) / count - 0.5) * 2 * spread;
      const velocity = speed * (0.8 + 0.22 * random()),
        life = DRONE_WAVE_SECONDS * (0.45 + 0.5 * random());
      const forkAge = life * 0.32,
        fork = birth + forkAge;
      const vx = Math.cos(dir) * velocity,
        vy = Math.sin(dir) * velocity;
      this.sparks.push({ x, y, vx, vy, birth, start: birth, end: fork, life });
      const turn = (0.22 + 0.2 * random()) * 0.8;
      for (const slow of [false, true]) {
        const heading = dir + (slow ? -turn : turn);
        const rate = velocity * (slow ? 0.35 : 1.05);
        this.sparks.push({
          x: x + vx * forkAge,
          y: y + vy * forkAge,
          vx: Math.cos(heading) * rate,
          vy: Math.sin(heading) * rate,
          birth,
          start: fork,
          end: fork + (life - forkAge) * (slow ? 0.7 : 1),
          life,
        });
      }
    }
  }
  live(
    ctx: CanvasRenderingContext2D,
    pass: FxPass,
    sim: Simulation,
    time: number,
  ) {
    ctx.save();
    for (const event of sim.droneFlight.events) {
      const age = time - event.time;
      if (
        event.kind !== "detonation" ||
        age < 0 ||
        age >= DRONE_WAVE_SECONDS ||
        !pass.visible(event.x, event.y, 180) ||
        !pass.budget.take(true)
      )
        continue;
      const radius = droneWaveRadius(age);
      ctx.globalAlpha = 0.3 * (1 - age / DRONE_WAVE_SECONDS);
      ctx.drawImage(
        brush("shell"),
        event.x - radius,
        event.y - radius,
        2 * radius,
        2 * radius,
      );
      // Events can occur between ticks. The first render after that step
      // always presents the hard flash, even for a contact at the step start.
      const flashTick =
        sim.ticks - Math.round((event.time - event.offset) * 60) - 1;
      if (flashTick >= 0 && flashTick < 2) {
        ctx.globalAlpha = flashTick === 0 ? 0.3 : 0.12;
        ctx.drawImage(
          brush("frame"),
          event.x - FLASH_REACH,
          event.y - FLASH_REACH,
          FLASH_REACH * 2,
          FLASH_REACH * 2,
        );
        lightHullFace(
          ctx,
          pass,
          event,
          sim.ship.pos.x,
          sim.ship.pos.y,
          sim.ship.radius,
        );
        for (const actor of sim.opponents) {
          if (actor.lifecycle !== "destroyed")
            lightHullFace(
              ctx,
              pass,
              event,
              actor.ship.pos.x,
              actor.ship.pos.y,
              actor.ship.radius,
            );
        }
        if (sim.salvage)
          for (const body of sim.salvage.bodies)
            if (body.kind !== "cell" && body.hull > 0)
              lightHullFace(ctx, pass, event, body.x, body.y, body.radius);
        for (const drone of sim.droneFlight.drones)
          lightHullFace(ctx, pass, event, drone.x, drone.y, 3);
        const coreRadius = 14 * (1 + 0.35 * flashTick);
        ctx.globalAlpha = 1;
        ctx.drawImage(
          brush("liveFlash"),
          event.x - coreRadius,
          event.y - coreRadius,
          coreRadius * 2,
          coreRadius * 2,
        );
      }
    }
    for (const spark of this.sparks) {
      if (time < spark.start || time >= spark.end) continue;
      const elapsed = time - spark.start;
      const x = spark.x + spark.vx * elapsed,
        y = spark.y + spark.vy * elapsed;
      if (!pass.visible(x, y, 3) || !pass.budget.take()) continue;
      const phase = (time - spark.birth) / spark.life;
      const radius = 0.7 * (1 + 1.6 * (1 - phase));
      ctx.globalAlpha = 1 - phase ** 2;
      ctx.drawImage(
        brush("tip"),
        x - radius,
        y - radius,
        radius * 2,
        radius * 2,
      );
    }
    ctx.restore();
  }
}
