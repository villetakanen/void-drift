import {
  FX_INK,
  type FxPass,
  FxSparks,
  FxSurface,
  type GameObject,
  type Planet,
  paintArc,
  paintSpeedLine,
  type Star,
} from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  type BuildMount,
  buildMounts,
  weaponPose,
} from "./build-renderer";
import type { SalvageSystem } from "./salvage";
import {
  drawIonBeamMark,
  drawIonCannonLight,
  stampWeaponLight,
} from "./salvage-renderer";
import type { Loadout } from "./schemas/loadout";
import { ION_CANNON, POINT_DEFENCE } from "./schemas/salvage";
import type { Simulation } from "./simulation";

// Parsed loadouts are stable during a run. Mount geometry is shared with drawing.
const coilMounts = new WeakMap<Loadout, readonly BuildMount[]>();
function collectors(loadout: Loadout) {
  let mounts = coilMounts.get(loadout);
  if (!mounts) {
    mounts = buildMounts(loadout).filter((m) => m.part === "gravity-coil");
    coilMounts.set(loadout, mounts);
  }
  return mounts;
}

/** Phase waves stamp fresh light into the shared surface without particle history. */
export function drawGravityFold(
  ctx: CanvasRenderingContext2D,
  loadout: Loadout,
  ship: GameObject,
  time: number,
  opacity: number,
  direction: number,
  pass?: FxPass,
) {
  if (!(opacity > 0)) return;
  const cos = Math.cos(ship.rotation),
    sin = Math.sin(ship.rotation);
  let index = 0;
  for (const mount of collectors(loadout)) {
    const x = ship.pos.x + (mount.x * cos - mount.y * sin) * BUILD_FLIGHT_SCALE;
    const y = ship.pos.y + (mount.x * sin + mount.y * cos) * BUILD_FLIGHT_SCALE;
    if (pass && (!pass.visible(x, y, 48) || !pass.budget.take(true))) continue;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(direction);
    ctx.strokeStyle = FX_INK.gravity;
    ctx.lineWidth = 1;
    ctx.globalAlpha = opacity * (pass?.opacity ?? 1);
    paintArc(ctx, 5, 0);
    for (let wave = 0; wave < 4; wave++) {
      if (pass && !pass.budget.take()) break;
      const phase = (time * 1.25 + wave / 4 + index * 0.19) % 1;
      ctx.save();
      ctx.translate(phase * 14, 0);
      ctx.globalAlpha = opacity * (1 - phase) * 0.8 * (pass?.opacity ?? 1);
      paintArc(ctx, 6 + phase * 24, Math.sin(time * 3 + wave) * 0.16);
      ctx.restore();
    }
    ctx.restore();
    index++;
  }
}

/** One persistent scene surface in play, Lab and multi-ship diagnostics. */
export class FlightFx {
  readonly surface = new FxSurface();
  private simulation?: Simulation;
  private readonly weaponSparks = new FxSparks();
  private weaponEvents = new WeakMap<Simulation, number>();
  private weaponTime = 0;
  get pass() {
    return this.surface.pass;
  }
  clear() {
    this.surface.clear();
    this.weaponSparks.clear();
    this.weaponEvents = new WeakMap();
    this.weaponTime = 0;
  }
  drawShip(ctx: CanvasRenderingContext2D, sim: Simulation, fold = true) {
    if (sim.settings.arrival && sim.settings.mode !== "practice") {
      const fade = Math.max(0, 1 - sim.ticks / 90);
      paintSpeedLine(
        ctx,
        this.pass,
        sim.ship.pos.x - Math.cos(sim.ship.rotation) * sim.ship.radius,
        sim.ship.pos.y - Math.sin(sim.ship.rotation) * sim.ship.radius,
        sim.ship.vel.x,
        sim.ship.vel.y,
        fade,
      );
    }
    sim.plume.stamp(ctx, this.pass);
    for (const opponent of sim.opponents)
      if (opponent.lifecycle !== "destroyed") {
        opponent.plume.stamp(ctx, this.pass);
        stampWeaponLight(ctx, opponent.combat, this.pass);
        this.drawActorIonCannonLight(
          ctx,
          opponent.ship,
          opponent.combat,
          sim.star,
          sim.planets,
        );
      }
    if (sim.salvage) {
      const salvage = sim.salvage;
      this.weaponSparks.step(Math.max(0, salvage.time - this.weaponTime));
      this.weaponTime = salvage.time;
      let seen = this.weaponEvents.get(sim) ?? 0;
      for (const event of salvage.events) {
        if (event.id <= seen) continue;
        if (
          event.kind === "break" ||
          event.kind === "impact" ||
          event.kind === "collision"
        )
          this.weaponSparks.burst(
            event.x,
            event.y,
            event.kind === "break" || event.kind === "collision" ? 16 : 4,
            event.id,
          );
        seen = event.id;
      }
      this.weaponEvents.set(sim, seen);
      stampWeaponLight(ctx, salvage, this.pass);
      drawIonCannonLight(ctx, sim, true, this.pass);
    }
    if (fold && sim.settings.loadout && sim.gravityCollectionRate > 0)
      drawGravityFold(
        ctx,
        sim.settings.loadout,
        sim.ship,
        sim.ticks / 60,
        sim.gravityFoldOpacity,
        sim.gravityFoldDirection,
        this.pass,
      );
  }
  private drawActorIonCannonLight(
    ctx: CanvasRenderingContext2D,
    ship: GameObject,
    combat: SalvageSystem,
    star: Star,
    planets: readonly Planet[],
  ) {
    for (const weapon of combat.weapons) {
      const turret = weapon.kind === "ion-point-defence";
      if (weapon.kind !== "light-ion-cannon" && !turret) continue;
      const kind = turret ? "point-defence" : "ion-cannon";
      const profile = turret ? POINT_DEFENCE : ION_CANNON;
      const reach = turret ? POINT_DEFENCE.reach : ION_CANNON.range;
      const event = [...combat.events]
        .reverse()
        .find(
          (item) =>
            (item.kind === "point-defence" || item.kind === "ion-cannon") &&
            item.kind === kind &&
            item.mountKey === weapon.mount.key,
        );
      if (
        (event?.kind !== "point-defence" && event?.kind !== "ion-cannon") ||
        combat.time - event.time >= profile.flashSeconds
      )
        continue;
      const pose = turret
        ? weaponPose(ship, weapon.mount, combat.angles[weapon.mount.key])
        : weaponPose(ship, weapon.mount);
      const distance = Math.min(
        event.distance,
        combat.ionContact(
          pose.muzzleX,
          pose.muzzleY,
          pose.angle,
          star,
          planets,
          reach,
        ).distance,
      );
      if (
        !this.pass.visible(pose.muzzleX, pose.muzzleY, reach) ||
        !this.pass.budget.take(true) ||
        !(distance > 0)
      )
        continue;
      ctx.save();
      ctx.translate(pose.muzzleX, pose.muzzleY);
      ctx.rotate(pose.angle);
      ctx.globalAlpha = this.pass.opacity;
      ctx.globalCompositeOperation = "lighter";
      drawIonBeamMark(ctx, reach, distance, false, turret);
      ctx.restore();
    }
  }
  drawLfx(ctx: CanvasRenderingContext2D, sim: Simulation) {
    sim.plume.drawCharge(ctx);
    drawIonCannonLight(ctx, sim);
    for (const opponent of sim.opponents)
      if (opponent.lifecycle !== "destroyed") opponent.plume.drawCharge(ctx);
  }
  drawParticles(ctx: CanvasRenderingContext2D) {
    this.weaponSparks.draw(ctx, this.pass);
  }
  draw(
    ctx: CanvasRenderingContext2D,
    sim: Simulation,
    fold = true,
    additive = true,
    presentationTime = sim.ticks / 60,
    overlay?: (ctx: CanvasRenderingContext2D, pass: FxPass) => void,
  ) {
    if (this.simulation !== sim) {
      this.clear();
      this.simulation = sim;
    }
    this.surface.draw(
      ctx,
      presentationTime,
      (light) => {
        this.drawShip(light, sim, fold);
        this.drawParticles(light);
        overlay?.(light, this.pass);
      },
      additive,
    );
  }
}
