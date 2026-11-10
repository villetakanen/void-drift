import { Camera, Renderer } from "@void-drift/core";
import {
  drawFlightFrame,
  type FlightFrameOptions,
  FlightFx,
  SALVAGE,
  Simulation,
  STEP,
  starterLoadout,
  stockSettings,
} from "@void-drift/mode-a";

/** Ticks the input program runs before the scene starts again. */
const PROGRAM_TICKS = 900;
/** Wrecks the page supplies, as distance ahead of and beside the ship's start. */
const WRECKS = [
  { ahead: 130, beside: 0 },
  { ahead: 260, beside: -70 },
  { ahead: 210, beside: 90 },
];

/**
 * The render model page's scene: one production simulation with an armed
 * build and supplied wrecks, flown by a fixed input program and drawn through
 * the game's own frame.
 */
export class RenderModelScene {
  private sim!: Simulation;
  private readonly renderer: Renderer;
  private readonly camera = new Camera();
  private readonly fx = new FlightFx();

  constructor(private readonly ctx: CanvasRenderingContext2D) {
    this.renderer = new Renderer(ctx.canvas);
    this.renderer.resize(1920, 1080);
    this.restart();
  }
  get ticks() {
    return this.sim.ticks;
  }
  restart() {
    const loadout = starterLoadout("fighter");
    loadout.hull.fill("gravity-coil");
    loadout.aft.fill("light-ion-cannon");
    this.sim = new Simulation({
      ...stockSettings("fighter"),
      loadout,
      mode: "derelicts",
    });
    const salvage = this.sim.salvage;
    if (salvage) {
      // The scene supplies its own targets instead of waiting for encounters.
      salvage.nextPass = Infinity;
      const { pos, rotation } = this.sim.ship;
      const cos = Math.cos(rotation),
        sin = Math.sin(rotation);
      for (const [index, { ahead, beside }] of WRECKS.entries()) {
        const x = pos.x + cos * ahead - sin * beside,
          y = pos.y + sin * ahead + cos * beside;
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
  /** One simulation tick of the input program; a finished run starts again. */
  step() {
    if (this.sim.state.status !== "PLAYING" || this.sim.ticks >= PROGRAM_TICKS)
      this.restart();
    const phase = this.sim.ticks % 240;
    const wraps = this.sim.wraps;
    this.sim.step({
      leftThruster: phase < 180,
      rightThruster: phase < 120,
      fire: false,
    });
    this.frameCamera(wraps !== this.sim.wraps);
    this.camera.update(STEP);
  }
  /** Draws the frame; `onVoid` clears first, for a pass shown without the Void pass. */
  draw(options: FlightFrameOptions, onVoid = false) {
    if (onVoid) this.renderer.clear();
    drawFlightFrame(
      {
        ctx: this.ctx,
        renderer: this.renderer,
        camera: this.camera,
        sim: this.sim,
        fx: this.fx,
      },
      options,
    );
  }
}
