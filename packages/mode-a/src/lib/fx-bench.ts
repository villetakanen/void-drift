import {
  FX_INK,
  FxSparks,
  initializePlanets,
  paintArc,
} from "@void-drift/core";
import { BUILD_FLIGHT_SCALE, drawBuild } from "./build-renderer";
import { FlightFx } from "./gravity-fold-fx";
import { drawSalvage, drawSalvageApertures } from "./salvage-renderer";
import { starterLoadout } from "./schemas/loadout";
import { SALVAGE } from "./schemas/salvage";
import {
  planetMass,
  Simulation,
  STEP,
  setStarMassWell,
  stockSettings,
  tunedMassWell,
} from "./simulation";

/** Isolated diagnostic: real engines and collectors; extra entities are FX fixtures. */
export class FxBench {
  readonly fx = new FlightFx();
  readonly sparks = new FxSparks();
  ships: Simulation[] = [];
  ticks = 0;
  overload = false;
  enabled = true;
  weapons = false;
  constructor() {
    this.reset();
  }
  reset() {
    this.ticks = 0;
    this.fx.clear();
    this.sparks.clear();
    this.ships = Array.from({ length: 6 }, (_, i) => {
      const loadout = starterLoadout("fighter");
      loadout.hull.fill("gravity-coil");
      if (this.weapons) {
        // Preserve collector and engines while twin cannons occupy existing universal slots.
        if (i < 4) loadout.aft.fill("light-ion-cannon");
        else loadout.hull[1] = i === 4 ? "laser" : "rail";
      }
      const sim = new Simulation({
        ...stockSettings("fighter"),
        loadout,
        mode: "derelicts",
      });
      // The diagnostic supplies its own targets instead of waiting for encounters.
      if (sim.salvage) sim.salvage.nextPass = Infinity;
      const x = 400 + (i % 3) * 500,
        y = 300 + Math.floor(i / 3) * 470;
      // Local test scene only: isolate six planetary passes from the central star.
      sim.planets.length = 0;
      if (sim.star.massWell)
        setStarMassWell(sim.star, {
          ...sim.star.massWell,
          mass: sim.star.massWell.mass * (12 / sim.star.radius) ** 2,
        });
      sim.star.radius = 12;
      sim.star.mass = 0;
      sim.star.powerMultiplier = 0;
      const planet = initializePlanets(960, 540)[0];
      planet.massWell = tunedMassWell(planetMass(planet.id));
      sim.planets.push(planet);
      planet.orbitRadius = 0;
      planet.orbitSpeed = 0;
      planet.orbitCenter.set(x + 100, y);
      planet.pos.set(x + 100, y);
      sim.ship.pos.set(x, y);
      sim.ship.rotation = -Math.PI / 2;
      if (this.weapons && sim.salvage) {
        const targetX = x,
          targetY = y - 130;
        sim.salvage.bodies.push({
          id: 1,
          group: 1,
          kind: "wreck",
          x: targetX,
          y: targetY,
          previousX: targetX,
          previousY: targetY,
          vx: 0,
          vy: 0,
          radius: SALVAGE.wreck.radius,
          hull: SALVAGE.wreck.hull,
          life: SALVAGE.wreck.life,
          rotation: 0,
        });
      }
      sim.start();
      return sim;
    });
  }
  burst() {
    this.sparks.burst(960, 540, this.overload ? 100000 : 96, this.ticks + 2026);
  }
  step() {
    if (this.ticks >= 480) this.reset();
    for (let i = 0; i < this.ships.length; i++) {
      const phase = (this.ticks + i * 13) % 240;
      this.ships[i].step({
        leftThruster: phase < 180,
        rightThruster: phase < 120,
        fire: false,
      });
      // Diagnostic-only lane wrap keeps all six moving ships in the viewport.
      const ship = this.ships[i].ship;
      const x = 400 + (i % 3) * 500,
        y = 300 + Math.floor(i / 3) * 470;
      if (Math.abs(ship.pos.x - x) > 180 || Math.abs(ship.pos.y - y) > 180) {
        ship.pos.set(x, y);
        this.ships[i].plume.clear();
      }
    }
    this.sparks.step(STEP);
    if (this.ticks % 12 === 0)
      for (let i = 0; i < 12; i++)
        this.sparks.burst(240 + i * 125, 900, 2, this.ticks + i * 71);
    if (this.ticks % 60 === 0) this.burst();
    this.ticks++;
  }
  drawWorld(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#070710";
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = "#222739";
    for (let x = 40; x < 1920; x += 80)
      for (let y = 40; y < 1080; y += 80) ctx.fillRect(x, y, 1, 1);
    ctx.strokeStyle = "#34344d";
    ctx.lineWidth = 1;
    for (const x of [700, 1220]) {
      ctx.strokeRect(x - 18, 522, 36, 36);
    }
    for (const sim of this.ships) {
      if (sim.salvage && this.weapons) drawSalvage(ctx, sim.salvage);
      if (sim.settings.loadout)
        drawBuild(
          ctx,
          sim.settings.loadout,
          sim.ship.pos.x,
          sim.ship.pos.y,
          sim.ship.rotation,
          BUILD_FLIGHT_SCALE,
          "",
          undefined,
          undefined,
          sim.salvage?.angles,
        );
    }
  }
  drawFx(target: CanvasRenderingContext2D) {
    if (!this.enabled) {
      this.fx.clear();
      return;
    }
    this.fx.surface.draw(target, this.ticks * STEP, (ctx, pass) => {
      for (const sim of this.ships) this.fx.drawShip(ctx, sim);
      this.fx.drawParticles(ctx);
      const time = this.ticks * STEP;
      ctx.strokeStyle = FX_INK.gravity;
      for (const x of [700, 1220])
        for (let wave = 0; wave < 8; wave++) {
          if (!this.fx.pass.budget.take()) break;
          const p = (time * 0.7 + wave / 8) % 1;
          ctx.save();
          ctx.translate(x, 540);
          ctx.globalAlpha = (1 - p) * pass.opacity;
          paintArc(ctx, 20 + p * 50, time * 0.3);
          ctx.restore();
        }
      ctx.strokeStyle = FX_INK.core;
      for (let i = 0; i < 16; i++) {
        if (!pass.budget.take()) break;
        const x = (time * 180 + i * 117) % 1920,
          y = 120 + i * 50;
        ctx.globalAlpha = pass.opacity;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 2);
        ctx.stroke();
      }
      this.sparks.draw(ctx, this.fx.pass);
      if (this.overload) {
        // A bounded stress request deliberately exhausts decoration, not activation.
        ctx.fillStyle = FX_INK.fire;
        ctx.globalAlpha = pass.opacity;
        for (let i = 0; i < 2048; i++) {
          if (!this.fx.pass.budget.take()) break;
          ctx.fillRect((i * 73) % 1920, (i * 37) % 1080, 1, 1);
        }
      }
    });
    for (const sim of this.ships)
      if (sim.salvage && this.weapons)
        drawSalvageApertures(target, sim.salvage);
    for (const sim of this.ships) this.fx.drawLfx(target, sim);
  }
}
