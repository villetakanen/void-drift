import { Camera, Renderer } from "@void-drift/core";
import {
  drawFlightFrame,
  FlightFx,
  type FlightLayerContexts,
  type Loadout,
  resizeFlightLayers,
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
 * How the scene is looked at (02.2): the game camera, or the ship held at the
 * centre at a fixed zoom.
 */
export interface FlightSceneView {
  follow: number | null;
}
export const GAME_VIEW: FlightSceneView = { follow: null };

/** A production simulation replay drawn through the same layers as play. */
export class FlightScene {
  tick = 0;
  private sim!: Simulation;
  private burn: BurnId = "course";
  private readonly renderer: Renderer;
  private readonly camera = new Camera();
  private readonly fx = new FlightFx();
  private view = GAME_VIEW;

  constructor(
    private readonly layers: FlightLayerContexts,
    private readonly config: FlightSceneConfig,
  ) {
    this.renderer = new Renderer(layers.world.canvas);
    resizeFlightLayers(layers, this.renderer, 1920, 1080);
    this.restart("course");
  }
  get lost() {
    return this.sim.state.status === "PLAYING"
      ? null
      : { seconds: this.sim.ticks * STEP, cause: this.sim.state.deathCause };
  }
  /** The light surface follows the camera, so another view flies the burn again. */
  restart(burn: BurnId, view = this.view) {
    this.view = view;
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
    if (this.view.follow !== null) {
      this.camera.pos.set(this.sim.ship.pos.x, this.sim.ship.pos.y);
      this.camera.zoom = this.view.follow;
      return;
    }
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
      if (this.view.follow === null) this.camera.update(STEP);
      this.tick++;
      if (to - this.tick < history && this.tick < to) this.light();
    }
    this.draw();
  }
  /** One tick of light on the surface; what it composites is drawn over. */
  private light() {
    drawFlightFrame(
      {
        layers: this.layers,
        renderer: this.renderer,
        camera: this.camera,
        sim: this.sim,
        fx: this.fx,
      },
      { include: (pass) => pass.layer === "fx" },
    );
  }
  /** Uses the production layer stack and ordered frame passes. */
  draw() {
    drawFlightFrame({
      layers: this.layers,
      renderer: this.renderer,
      camera: this.camera,
      sim: this.sim,
      fx: this.fx,
      stockShip: undefined,
    });
  }
}
