import {
  FissionExhaust,
  FX_INK,
  FxPass,
  FxSparks,
  initializePlanets,
  paintArc,
} from "@void-drift/core";
import { BUILD_FLIGHT_SCALE, drawBuild } from "./build-renderer";
import { FlightFx } from "./gravity-fold-fx";
import type { SalvageBody } from "./salvage";
import { drawSalvage, drawSalvageApertures } from "./salvage-renderer";
import { type Loadout, starterLoadout } from "./schemas/loadout";
import { SALVAGE } from "./schemas/salvage";
import {
  planetMass,
  Simulation,
  STEP,
  setStarMassWell,
  stockSettings,
  tunedMassWell,
} from "./simulation";

export const FX_WORKLOADS = {
  baseline: "Baseline",
  mixed: "Mixed engines",
  "fission-heavy": "Fission-heavy",
  weapons: "Weapons",
} as const;
export type FxWorkload = keyof typeof FX_WORKLOADS;

/** Isolated diagnostic: real engines and collectors; extra entities are FX fixtures. */
export class FxBench {
  readonly fx = new FlightFx();
  readonly sparks = new FxSparks();
  // FlightFx owns a single simulation's Fission lifecycle. This fixture merges
  // the six simulations' tick events into one painter and one scene allowance.
  private readonly fission = new FissionExhaust();
  private readonly livePass = new FxPass();
  private readonly ignitions: Simulation["fissionIgnitions"][number][] = [];
  private readonly contacts: Simulation["fissionContacts"][number][] = [];
  private capacities: number[] = [];
  ships: Simulation[] = [];
  ticks = 0;
  overload = false;
  enabled = true;
  workload: FxWorkload;
  get weapons() {
    return this.workload === "weapons";
  }
  private get hasFission() {
    return this.workload === "mixed" || this.workload === "fission-heavy";
  }
  get ignitionCount() {
    return this.ignitions.length;
  }
  constructor(workload: FxWorkload = "baseline") {
    this.workload = workload;
    this.reset();
  }
  reset(workload = this.workload) {
    this.workload = workload;
    this.ticks = 0;
    this.fx.clear();
    this.sparks.clear();
    this.fission.clear();
    this.ignitions.length = this.contacts.length = 0;
    this.ships = Array.from({ length: 6 }, (_, i) => {
      const loadout = starterLoadout("fighter");
      loadout.hull.fill("gravity-coil");
      // Keep the reference hulls and mount count: add Plasma to the stock Ion mix.
      const aft: Loadout["aft"] = i % 2 ? ["ion", "plasma"] : ["ion", "ion"];
      if (this.workload === "mixed") {
        aft[0] = "fusion";
        aft[1] = "plasma";
      } else if (this.workload === "fission-heavy" && i < 4) {
        loadout.side = "fusion";
        aft.fill("fusion");
      }
      loadout.aft = aft;
      if (this.weapons) {
        // Twin cannons replace aft engines on four hulls; every hull keeps a collector.
        if (i < 4) loadout.aft.fill("light-ion-cannon");
        else loadout.hull[1] = "laser";
        // Point-defence turrets work beside the cannons on two of those ships.
        if (i === 1 || i === 3) loadout.hull[1] = "ion-point-defence";
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
      sim.start();
      return sim;
    });
    this.capacities = this.ships.map((sim) => sim.state.resources.power);
  }
  private stageWeaponTargets(sim: Simulation, index: number) {
    if (!sim.salvage) return;
    const { bodies } = sim.salvage;
    const { pos, vel, rotation } = sim.ship;
    const cos = Math.cos(rotation),
      sin = Math.sin(rotation);
    const stage = (
      id: number,
      forward: number,
      lateral: number,
      active: boolean,
    ) => {
      const existing = bodies.findIndex((body) => body.id === id);
      if (!active) {
        if (existing >= 0) bodies.splice(existing, 1);
        return;
      }
      const x = pos.x + forward * cos - lateral * sin;
      const y = pos.y + forward * sin + lateral * cos;
      let target: SalvageBody = bodies[existing];
      if (!target) {
        target = {
          id,
          group: id,
          kind: "fragment",
          x,
          y,
          previousX: x,
          previousY: y,
          vx: vel.x,
          vy: vel.y,
          radius: SALVAGE.fragment.radius,
          hull: SALVAGE.fragment.hull,
          rotation: 0,
        };
        bodies.push(target);
      }
      target.x = target.previousX = x;
      target.y = target.previousY = y;
      target.vx = vel.x;
      target.vy = vel.y;
    };
    // Stage fragments rather than wrecks so repeated impacts cannot make an
    // ever-growing debris workload. Alternate forward windows; keep turret lanes active.
    const cannons = this.ticks % 60 < 30;
    stage(10001, 130, 0, cannons === index < 4);
    if (index === 1 || index === 3) stage(10002, 20, -70, true);
  }
  burst() {
    this.sparks.burst(960, 540, this.overload ? 100000 : 96, this.ticks + 2026);
  }
  step() {
    if (this.ticks >= 480) this.reset();
    this.ignitions.length = this.contacts.length = 0;
    for (let i = 0; i < this.ships.length; i++) {
      const synchronized = this.workload === "fission-heavy" && i < 4;
      const phase = (this.ticks + (synchronized ? 0 : i * 13)) % 240;
      const sim = this.ships[i];
      if (this.weapons) {
        // Keep the rendering load alive; shots still use real funding and cooldowns.
        sim.state.resources.power = this.capacities[i];
        sim.state.resources.hull = 100;
        this.stageWeaponTargets(sim, i);
      }
      sim.step({
        leftThruster: phase < 180,
        rightThruster: phase < 120,
        fire: false,
      });
      if (this.enabled && this.hasFission) {
        this.ignitions.push(...sim.fissionIgnitions);
        this.contacts.push(...sim.fissionContacts);
      }
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
    if (this.enabled && this.hasFission)
      this.fission.capture(this.ticks, this.ignitions, this.contacts);
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
    if (this.weapons) {
      for (const sim of this.ships)
        if (sim.salvage) drawSalvageApertures(ctx, sim.salvage);
    }
  }
  drawFx(target: CanvasRenderingContext2D) {
    if (!this.enabled) {
      this.fx.clear();
      this.fission.clear();
      return;
    }
    this.fx.surface.draw(target, this.ticks * STEP, (ctx, pass) => {
      if (this.hasFission) this.fission.stamp(ctx, pass, this.ticks);
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
    if (this.weapons) {
      target.save();
      target.globalCompositeOperation = "destination-out";
      for (const sim of this.ships)
        if (sim.salvage) drawSalvageApertures(target, sim.salvage);
      target.restore();
    }
  }
  drawLfx(target: CanvasRenderingContext2D) {
    if (!this.enabled) return;
    for (const sim of this.ships) this.fx.drawLfx(target, sim);
    if (!this.hasFission) return;
    this.livePass.begin(target, false);
    try {
      this.fission.live(target, this.livePass, this.ticks);
    } finally {
      this.livePass.end(target);
    }
  }
}
