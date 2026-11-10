import { Camera, drawSunFields, Renderer } from "@void-drift/core";
import {
  BUILD_FLIGHT_SCALE,
  drawBuild,
  drawSalvage,
  drawSalvageApertures,
  FlightFx,
  type Loadout,
  SALVAGE,
  Simulation,
  STEP,
  stockSettings,
} from "@void-drift/mode-a";
import { type BurnId, inputAt, TOTAL_TICKS } from "../../lib/instrument";

/** What a study places in the scene. Targets are wrecks, in world units. */
export interface FlightSceneConfig {
  loadout: Loadout;
  targets: { x: number; y: number }[];
}

/**
 * Flight scene study, 02.1: a burn flown by the production simulation and drawn
 * in the game's order. An instant is only reachable by flying to it, so a jump
 * re-flies the burn from its start; `history` is how many of the last ticks
 * also paint their light.
 */
export class FlightScene {
  tick = 0;
  private sim!: Simulation;
  private burn: BurnId = "course";
  private readonly renderer: Renderer;
  private readonly camera = new Camera();
  private readonly fx = new FlightFx();

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly config: FlightSceneConfig,
  ) {
    this.renderer = new Renderer(ctx.canvas);
    this.renderer.resize(1920, 1080);
    this.restart("course");
  }
  get lost() {
    return this.sim.state.status === "PLAYING"
      ? null
      : { seconds: this.sim.ticks * STEP, cause: this.sim.state.deathCause };
  }
  restart(burn: BurnId) {
    this.burn = burn;
    this.tick = 0;
    this.sim = new Simulation({
      ...stockSettings(this.config.loadout.chassis),
      loadout: this.config.loadout,
      mode: "derelicts",
    });
    const salvage = this.sim.salvage;
    if (salvage) {
      // The scene supplies its own targets instead of waiting for encounters.
      salvage.nextPass = Infinity;
      for (const [index, { x, y }] of this.config.targets.entries())
        salvage.bodies.push({
          id: 101 + index,
          group: 101 + index,
          kind: "wreck",
          x,
          y,
          previousX: x,
          previousY: y,
          vx: 0,
          vy: 0,
          radius: SALVAGE.wreck.radius,
          hull: SALVAGE.wreck.hull,
          life: SALVAGE.wreck.life,
          rotation: 0,
        });
    }
    this.sim.start();
    this.fx.clear();
    this.frameCamera(true);
  }
  private frameCamera(snap = false) {
    const c = this.sim.settings.camera;
    this.camera.frame(
      this.sim.ship.pos.x,
      this.sim.ship.pos.y,
      960,
      540,
      c.padding,
      c.smoothing,
      snap,
      c.zoomSteps,
    );
  }
  /** Flies to `target`; a backward jump or another burn starts the flight again. */
  seek(burn: BurnId, target: number, history: number) {
    const to = Math.max(0, Math.min(TOTAL_TICKS, target));
    if (burn !== this.burn || to < this.tick) this.restart(burn);
    while (this.tick < to) {
      const input = inputAt(this.burn, this.tick);
      const wraps = this.sim.wraps;
      this.sim.step({
        leftThruster: input.left,
        rightThruster: input.right,
        fire: false,
      });
      this.frameCamera(wraps !== this.sim.wraps);
      this.camera.update(STEP);
      this.tick++;
      if (to - this.tick < history && this.tick < to) this.light();
    }
    this.draw();
  }
  /** One tick of light on the surface; what it composites is drawn over. */
  private light() {
    this.renderer.beginCamera(this.camera);
    this.fx.draw(this.ctx, this.sim);
    this.renderer.endCamera();
  }
  /** FlightDeck's in-flight draw order, without the countdown overlay. */
  draw() {
    const { ctx, sim, renderer, camera } = this;
    renderer.clear();
    renderer.beginCamera(camera);
    renderer.drawBackground(camera.getViewRect());
    renderer.drawArenaBoundary(1200);
    renderer.drawStar(sim.star, sim.ticks * STEP * 1000);
    drawSunFields(ctx, sim.star, {
      collecting: sim.solarCollectionRate > 0,
      damaging: sim.solarDamageRate > 0,
    });
    for (const planet of sim.planets) renderer.drawPlanet(planet);
    if (sim.salvage) drawSalvage(ctx, sim.salvage);
    drawBuild(
      ctx,
      this.config.loadout,
      sim.ship.pos.x,
      sim.ship.pos.y,
      sim.ship.rotation,
      BUILD_FLIGHT_SCALE,
      "",
      undefined,
      undefined,
      sim.salvage?.angles,
    );
    this.fx.draw(ctx, sim);
    if (sim.salvage) drawSalvageApertures(ctx, sim.salvage);
    this.fx.drawLfx(ctx, sim);
    renderer.endCamera();
  }
}
