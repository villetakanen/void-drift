import { Camera, type FxPass, Renderer } from "@void-drift/core";
import {
  drawFlightFrame,
  FLIGHT_PASSES,
  FlightFx,
  type FlightLayerContexts,
  type FlightPass,
  resizeFlightLayers,
  STEP,
} from "@void-drift/mode-a";
import type { BurnId } from "../instrument/burns";
import type { FlightSceneDocument, FlightView } from "./config";
import { defaultTargets, FlightRun, type TargetMode } from "./flight";
import { type PartTuning, type StudyLight, studyLightState } from "./light";
import type { PlanetAppearance } from "./planet";
import { readOnlyCopy } from "./read-only";

/** A production simulation replay drawn through the same layers as play. */
export class FlightScene {
  private run: FlightRun;
  private readonly renderer: Renderer;
  private readonly camera = new Camera();
  private readonly fx = new FlightFx();
  private view: FlightView;
  private targets: TargetMode;

  constructor(
    private readonly layers: FlightLayerContexts,
    private doc: FlightSceneDocument,
    /** Render width at the game's 1080 height; the game varies it with the window. */
    width = 1920,
    targets: TargetMode = defaultTargets(doc),
    /** A study's own light for some engines; absent, every light is the game's. */
    private studyLight?: StudyLight,
    /** A study's tuning of the delayed and pulsed parts. */
    private tuning: PartTuning = {},
    private planetAppearance?: PlanetAppearance,
  ) {
    this.targets = targets;
    this.view = doc.opening.view;
    this.renderer = new Renderer(layers.world.canvas);
    resizeFlightLayers(layers, this.renderer, width, 1080);
    this.camera.viewportWidth = width;
    this.run = this.fly(doc.opening.burn);
    this.restart(doc.opening.burn);
  }
  private fly(burn: BurnId) {
    return new FlightRun(
      this.doc,
      burn,
      this.targets,
      this.studyLight?.replaces,
      this.tuning,
    );
  }
  /** Other part tuning flies the burn again from its start. */
  setTuning(tuning: PartTuning = {}) {
    this.tuning = tuning;
    this.restart(this.run.burn);
  }
  /** Another light, or none, flies the burn again from its start. */
  setLight(light?: StudyLight) {
    this.studyLight = light;
    this.restart(this.run.burn);
  }
  setPlanetAppearance(appearance?: PlanetAppearance) {
    this.planetAppearance = appearance;
  }
  private get state() {
    return studyLightState(this.run.sim, this.doc.loadout, this.run.tick);
  }
  get tick() {
    return this.run.tick;
  }
  get lost() {
    return this.run.lost;
  }
  /** Another document or target choice flies the burn again from its start. */
  configure(doc: FlightSceneDocument, targets: TargetMode = this.targets) {
    this.doc = doc;
    this.targets = targets;
    this.restart(this.run.burn);
  }
  /** Zoom of a view; null is the game's own camera. */
  private zoom(view: FlightView): number | null {
    if (view === "game") return null;
    return view === "follow" ? this.doc.follow.near : this.doc.follow.far;
  }
  /** The light surface follows the camera, so another view flies the burn again. */
  restart(burn: BurnId, view: FlightView = this.view) {
    this.view = view;
    this.run = this.fly(burn);
    this.fx.clear();
    this.frameCamera(true);
  }
  private frameCamera(snap = false) {
    const { ship } = this.run.sim;
    const zoom = this.zoom(this.view);
    if (zoom !== null) {
      this.camera.pos.set(ship.pos.x, ship.pos.y);
      this.camera.zoom = zoom;
      return;
    }
    const c = this.run.sim.settings.camera;
    this.camera.frame(
      ship.pos.x,
      ship.pos.y,
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
    if (burn !== this.run.burn || target < this.run.tick) this.restart(burn);
    this.run.seek(target, (wrapped, remaining) => {
      this.frameCamera(wrapped);
      if (this.zoom(this.view) === null) this.camera.update(STEP);
      if (remaining < history && remaining > 0) this.light();
    });
    this.draw();
  }
  /** One tick of light on the surface; what it composites is drawn over. */
  private light() {
    drawFlightFrame(this.frame(), {
      include: (pass) => pass.layer === "fx",
    });
  }
  /** The production frame; a study's FX light enters as the game's own overlay. */
  private frame() {
    const paint = this.studyLight?.fx;
    return {
      layers: this.layers,
      renderer: this.renderer,
      camera: this.camera,
      sim: this.run.sim,
      fx: this.fx,
      stockShip: undefined,
      lightOverlay: paint
        ? (ctx: CanvasRenderingContext2D, pass: FxPass) =>
            paint(ctx, pass, this.state)
        : undefined,
    };
  }
  /** Uses the production layer stack and ordered frame passes. */
  draw() {
    const appearance = this.planetAppearance;
    let passes: readonly FlightPass[] | undefined;
    if (this.doc.planet && appearance) {
      const sim = this.run.sim;
      const state = readOnlyCopy({
        planet: sim.planets[0],
        ship: sim.ship,
        sun: sim.star,
        seconds: sim.ticks * STEP,
      });
      passes = [
        ...FLIGHT_PASSES.filter(
          (pass) => !["venus-hud", "mercury-hud"].includes(pass.id),
        ).map(
          (pass): FlightPass =>
            pass.id === "planets"
              ? {
                  ...pass,
                  source: "study planet appearance",
                  draw: (_frame, ctx) => appearance.world(ctx, state),
                }
              : pass,
        ),
        {
          id: "staged-planet-light",
          name: appearance.label,
          layer: "lfx",
          space: "world",
          source: "study planet appearance",
          draws: "Staged planet lighting",
          draw: (_frame, ctx) => appearance.lfx?.(ctx, state),
        },
      ];
    }
    drawFlightFrame(this.frame(), { passes });
    const paint = this.studyLight?.lfx;
    if (!paint) return;
    // After the game's LFX pass, under the same camera transform.
    const ctx = this.layers.lfx;
    ctx.save();
    this.camera.applyTransform(ctx);
    paint(ctx, this.state);
    ctx.restore();
  }
}
