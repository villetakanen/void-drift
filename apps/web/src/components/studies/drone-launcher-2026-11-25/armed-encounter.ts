import type { FxPass } from "@void-drift/core";
import { defaultLoadout, type Simulation, STEP } from "@void-drift/mode-a";
import { z } from "zod";
import {
  FlightRun,
  FlightSceneDocumentSchema,
} from "../../../lib/flight-scene";
import {
  ACCEPTED_SPARKS,
  type Charge,
  DEFAULT_LIGHT,
  drawCharge,
  emitFlashSparks,
  emitShellSparks,
  FissionSparks,
  type Solid,
  shellRadius,
  stampCharge,
} from "./fission-light";
import type { DroneSample } from "./flight-motion";

export const HullResponse = z.enum([
  "Remove at detonation",
  "Coast through flash",
  "Coast for 0.2 s",
]);
export const EncounterSettings = z
  .object({ range: z.number().min(5).max(30), response: HullResponse })
  .strict();
export type EncounterSettings = z.infer<typeof EncounterSettings>;
const light = {
  ...DEFAULT_LIGHT,
  shell: { ...DEFAULT_LIGHT.shell, ring: true },
};
const scoutHeading = 0.4;
const targetScene = FlightSceneDocumentSchema.parse({
  loadout: defaultLoadout("scout"),
  start: {
    x: 200,
    y: 980,
    rotation: scoutHeading,
    velocity: {
      x: 40 * Math.cos(scoutHeading),
      y: 40 * Math.sin(scoutHeading),
    },
  },
});

export class ArmedEncounter {
  readonly target = new FlightRun(targetScene, "turn");
  readonly sparks = new FissionSparks(ACCEPTED_SPARKS);
  private charge?: Charge;
  private armed = false;
  private hull?: DroneSample;
  private solids: Solid[] = [];
  private hit = new Set<string>();
  private tick = 0;
  constructor(readonly settings: EncounterSettings) {
    this.target.sim.planets.length = 0;
  }
  get spent() {
    return !!this.charge;
  }
  get targetPose() {
    const { pos, vel } = this.target.sim.ship;
    return { x: pos.x, y: pos.y, vx: vel.x, vy: vel.y };
  }
  step(sim: Simulation, drone: DroneSample | undefined, tick: number) {
    this.tick = tick;
    const target = this.target.sim.ship;
    this.solids = [
      {
        name: "Carrier",
        x: sim.ship.pos.x,
        y: sim.ship.pos.y,
        radius: sim.ship.radius,
      },
      {
        name: "Scout",
        x: target.pos.x,
        y: target.pos.y,
        radius: target.radius,
      },
    ];
    const clearance = drone
      ? Math.hypot(drone.x - target.pos.x, drone.y - target.pos.y) -
        target.radius
      : Infinity;
    if (drone && drone.output > 0) this.armed = true;
    if (
      this.armed &&
      !this.charge &&
      drone &&
      clearance <= this.settings.range
    ) {
      this.charge = { x: drone.x, y: drone.y, tick, seed: 1 };
      this.hull = { ...drone, output: 0 };
      emitFlashSparks(this.sparks, this.charge, [], light);
    }
    this.sparks.step(STEP);
    if (!this.charge) return;
    const radius = shellRadius(light, tick - this.charge.tick);
    for (const solid of this.solids) {
      if (
        radius === null ||
        this.hit.has(solid.name) ||
        Math.hypot(solid.x - this.charge.x, solid.y - this.charge.y) > radius
      )
        continue;
      this.hit.add(solid.name);
      emitShellSparks(this.sparks, this.charge, solid, light, true);
    }
    return this.charge.tick;
  }
  visibleHull() {
    if (!this.charge || !this.hull) return [];
    const age = this.tick - this.charge.tick;
    const duration =
      this.settings.response === "Remove at detonation"
        ? 0
        : this.settings.response === "Coast through flash"
          ? light.flash.ticks
          : 12;
    if (age >= duration) return [];
    const h = this.hull;
    return [
      {
        ...h,
        x: h.x + h.vx * age * STEP,
        y: h.y + h.vy * age * STEP,
        angle: h.angle + h.angularVelocity * age * STEP,
      },
    ];
  }
  fx(ctx: CanvasRenderingContext2D, pass: FxPass) {
    this.target.sim.plume.stamp(ctx, pass);
    if (!this.charge) return;
    stampCharge(ctx, pass, this.charge, this.solids, light, this.tick);
    ctx.save();
    this.sparks.stamp(ctx, pass, light.ink, true);
    ctx.restore();
  }
  live(
    ctx: CanvasRenderingContext2D,
    view: { x: number; y: number; width: number; height: number },
  ) {
    if (!this.charge) return;
    const { x, y } = this.charge,
      r = light.reach.limit + 40;
    if (
      x + r >= view.x &&
      x - r <= view.x + view.width &&
      y + r >= view.y &&
      y - r <= view.y + view.height
    )
      drawCharge(ctx, this.charge, this.solids, light, this.tick);
    this.sparks.drawHeads(ctx, light.ink, view, true);
  }
}
