import {
  Camera,
  createCloudedWorld,
  createRockMaterial,
  type FxPass,
  PLANET_MAPS,
  type Planet,
  Renderer,
} from "@void-drift/core";
import {
  type BodyAppearance,
  BUILD_FLIGHT_SCALE,
  buildMounts,
  drawBuild,
  drawFlightFrame,
  FLIGHT_PASSES,
  type FlightFrame,
  FlightFx,
  type FlightLayerContexts,
  type FlightPass,
  resizeFlightLayers,
  STEP,
} from "@void-drift/mode-a";
import { HabitableMaterials } from "../assets/habitable-materials";
import { planetAppearances } from "../assets/planet-appearances";
import { createPracticeVenus } from "../assets/practice-venus";
import { createOuterMercurialMaterial } from "../assets/rock-planets/authored-materials";
import {
  drawGameField,
  type FieldBackground,
  HISTORICAL_BACKGROUND,
  PRACTICE_BACKGROUND,
  systemBackground,
} from "../game-field";
import type { BurnId } from "../instrument/burns";
import {
  type FlightSceneDocument,
  type FlightView,
  type StarAppearance,
  StarAppearanceSchema,
} from "./config";
import type { FlightExperiment } from "./experiment";
import { defaultTargets, FlightRun, type TargetMode } from "./flight";
import { type PartTuning, type StudyLight, studyLightState } from "./light";
import type { PlanetAppearance, PlanetSceneState } from "./planet";
import { readOnlyCopy } from "./read-only";

/** A production simulation replay drawn through the same layers as play. */
export class FlightScene {
  backgroundMode: "production" | "historical" = "production";
  get background(): FieldBackground {
    const draw = this.run.experimentRun?.drawSky;
    if (draw) return { kind: "experimental", draw };
    if (this.backgroundMode === "historical") return HISTORICAL_BACKGROUND;
    return this.skySeed === undefined
      ? PRACTICE_BACKGROUND
      : systemBackground(this.skySeed);
  }
  get skyCamera() {
    return this.camera.getViewCentre();
  }
  get skySeed() {
    return this.doc.system || this.doc.planet
      ? undefined
      : this.run.sim.settings.seed;
  }
  private starAppearance?: StarAppearance;
  setStarAppearance(appearance?: StarAppearance) {
    this.starAppearance = appearance
      ? StarAppearanceSchema.parse(appearance)
      : undefined;
  }
  private run: FlightRun;
  private readonly renderer: Renderer;
  private readonly camera = new Camera();
  private readonly fx = new FlightFx();
  private view: FlightView;
  private targets: TargetMode;
  private bodyAppearances?: ReadonlyMap<number, BodyAppearance>;
  private bodyAppearanceState?: PlanetSceneState;

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
    private experiment?: FlightExperiment,
  ) {
    this.targets = targets;
    this.view = doc.opening.view;
    this.renderer = new Renderer(layers.world.canvas);
    resizeFlightLayers(layers, this.renderer, width, 1080);
    this.camera.viewportWidth = width;
    this.run = this.fly(doc.opening.burn);
    this.restart(doc.opening.burn);
    this.setPlanetAppearance(this.planetAppearance);
  }
  loadPracticeMaterials(redraw: () => void) {
    let disposed = false;
    const materials: Parameters<typeof planetAppearances>[1] = {};
    const painters: Array<{ dispose(): void }> = [];
    const habitable = new HabitableMaterials();
    materials.habitable = habitable.materials;
    const load = async <K extends Exclude<keyof typeof materials, "habitable">>(
      key: K,
      create: () => Promise<NonNullable<(typeof materials)[K]>>,
    ) => {
      try {
        const material = await create();
        if (disposed) {
          material.painter.dispose();
          return;
        }
        painters.push(material.painter);
        materials[key] = material;
        this.bodyAppearances = planetAppearances(
          this.run.sim.planets,
          materials,
        );
        redraw();
      } catch {
        // The production body pass supplies a fallback for unavailable material.
      }
    };
    void habitable
      .prepare(this.run.sim.planets)
      .then(() => {
        if (disposed) return;
        this.bodyAppearances = planetAppearances(
          this.run.sim.planets,
          materials,
        );
        redraw();
      })
      .catch(() => {});
    void load("venus", async () => createPracticeVenus(true));
    void load("mercury", () => createRockMaterial(PLANET_MAPS.mercuryGround));
    void load("outerMercurial", () => createOuterMercurialMaterial());
    void load("cradle", () =>
      createCloudedWorld(PLANET_MAPS.cradleGround, PLANET_MAPS.cradleClouds),
    );
    return () => {
      disposed = true;
      habitable.dispose();
      for (const painter of painters) painter.dispose();
    };
  }
  private fly(burn: BurnId) {
    return new FlightRun(
      this.doc,
      burn,
      this.targets,
      this.studyLight?.replaces,
      this.tuning,
      this.experiment,
    );
  }
  /** Replacement creates fresh experimental state before replay. */
  setExperiment(experiment?: FlightExperiment) {
    this.experiment = experiment;
    this.restart(this.run.burn);
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
    if (this.doc.system === "practice") return;
    this.planetAppearance = appearance;
    const planet = this.doc.planet ? this.run.sim.planets[0] : undefined;
    if (!appearance || !planet) {
      this.bodyAppearances = undefined;
      this.bodyAppearanceState = undefined;
      return;
    }
    const position = planet.systemPosition;
    if (!Number.isInteger(position) || position === undefined || position <= 0)
      throw new Error(
        "Planet appearance requires a validated full-system position",
      );
    const state = () => {
      if (!this.bodyAppearanceState)
        throw new Error("Planet appearance state is unavailable while drawing");
      return this.bodyAppearanceState;
    };
    const descriptor: BodyAppearance = {
      worldBounds: (_frame, _planet) => appearance.worldBounds(state()),
      drawWorld: (_frame, ctx) => appearance.world(ctx, state()),
      ...(appearance.lfx
        ? {
            light: {
              bounds: (_frame: FlightFrame, _planet: Planet) =>
                appearance.lfxBounds(state()),
              draw: (_frame: FlightFrame, ctx: CanvasRenderingContext2D) =>
                appearance.lfx(ctx, state()),
            },
          }
        : {}),
    };
    this.bodyAppearances = new Map([[position, descriptor]]);
  }
  private get state() {
    return studyLightState(
      this.run.sim,
      this.doc.loadout,
      this.run.tick,
      this.doc.planet?.atmosphere?.depth,
    );
  }
  get tick() {
    return this.run.tick;
  }
  get lost() {
    return this.run.lost;
  }
  /** Hull at the currently selected time for a placed target. */
  targetHull(index: number) {
    return this.run.targetHull(index);
  }
  /** Another document or target choice flies the burn again from its start. */
  configure(doc: FlightSceneDocument, targets: TargetMode = this.targets) {
    this.doc = doc;
    this.targets = targets;
    this.restart(this.run.burn);
    this.setPlanetAppearance(this.planetAppearance);
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
      presentFx: false,
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
      bodyAppearances: this.bodyAppearances,
      stockShip: undefined,
      lightOverlay: (ctx: CanvasRenderingContext2D, pass: FxPass) => {
        paint?.(ctx, pass, this.state);
        this.run.experimentRun?.fx?.(ctx, pass);
      },
    };
  }
  /** Uses the production layer stack and ordered frame passes. */
  draw() {
    const appearance = this.planetAppearance;
    this.bodyAppearanceState = undefined;
    if (this.doc.planet && appearance) {
      const sim = this.run.sim;
      this.bodyAppearanceState = readOnlyCopy({
        planet: sim.planets[0],
        ship: sim.ship,
        sun: { ...sim.star, ...this.starAppearance },
        seconds: sim.ticks * STEP,
      });
    }
    let passes: readonly FlightPass[] | undefined;
    if (this.starAppearance) {
      const star = {
        ...this.run.sim.star,
        ...this.starAppearance,
        appearance: undefined,
      };
      passes = (passes ?? FLIGHT_PASSES).map((pass) =>
        pass.id === "star"
          ? {
              ...pass,
              source: "Flight scene star appearance",
              draw: ({ renderer, sim }) =>
                renderer.drawStar(star, sim.ticks * STEP * 1000),
            }
          : pass,
      );
    }
    const hidden = this.run.experimentRun?.hiddenMounts;
    const fittingPainter = this.run.experimentRun?.fittingPainter;
    if (hidden?.length || fittingPainter) {
      // The staged scene has no opponents; only the player's build is drawn.
      passes = (passes ?? FLIGHT_PASSES).map((pass) =>
        pass.id === "ship"
          ? {
              ...pass,
              source: "Flight scene experiment: fitting artwork",
              draw: ({ sim }, ctx) => {
                const loadout = sim.settings.loadout;
                if (!loadout) return;
                const mounts = buildMounts(loadout).map((mount) =>
                  hidden?.includes(mount.key)
                    ? { ...mount, part: null }
                    : mount,
                );
                drawBuild(
                  ctx,
                  loadout,
                  sim.ship.pos.x,
                  sim.ship.pos.y,
                  sim.ship.rotation,
                  BUILD_FLIGHT_SCALE,
                  "",
                  undefined,
                  mounts,
                  sim.salvage?.angles,
                  true,
                  fittingPainter,
                );
              },
            }
          : pass,
      );
    }
    const extra = this.run.experimentRun?.passes;
    if (extra) passes = [...(passes ?? FLIGHT_PASSES), ...extra];
    drawGameField(this.frame(), this.background, { passes });
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
