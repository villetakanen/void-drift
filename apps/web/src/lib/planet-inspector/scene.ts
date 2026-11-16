import {
  Camera,
  DEFAULT_ROCK_BODY_LIGHTING,
  type Planet,
  Renderer,
  type RockBodyLighting,
  RockBodyLightingSchema,
  StripSphericalSurface,
  updatePlanetOrbit,
} from "@void-drift/core";
import {
  drawFlightFrame,
  FlightFx,
  type FlightLayerContexts,
  PRACTICE_MERCURY_SPIN_SECONDS,
  PRACTICE_VENUS_SPIN_SECONDS,
  resizeFlightLayers,
  Simulation,
  STEP,
  stockSettings,
} from "@void-drift/mode-a";
import { createPracticeVenus } from "../assets/practice-venus";
import { createPracticeMercury } from "../assets/rock-planets/authored-materials";
import type { PlanetInspectorDocument } from "./config";

const references = {
  mercury: {
    id: "moon",
    label: "Mercury",
    spinSeconds: PRACTICE_MERCURY_SPIN_SECONDS,
  },
  venus: {
    id: "venus",
    label: "Venus",
    spinSeconds: PRACTICE_VENUS_SPIN_SECONDS,
  },
};
const INPUT = { leftThruster: false, rightThruster: false, fire: false };
const PASSES = new Set([
  "void",
  "starfield",
  "star",
  "sun-fields",
  "world-hud",
  "planets",
  "mercury-light",
  "venus-light",
]);
const HUD = new Set(["sun-fields", "world-hud"]);

/** The bench stages time; production owns simulation, passes and materials. */
export class PlanetInspectorScene {
  sim: Simulation;
  readonly camera = new Camera();
  readonly reference;
  private renderer: Renderer;
  private fx = new FlightFx();
  private mercury?: Awaited<ReturnType<typeof createPracticeMercury>>;
  private venus?: ReturnType<typeof createPracticeVenus>;
  private samples: { at: number; ms: number; redraws: number }[] = [];
  private measurementStart = performance.now();
  status: string;
  private disposed = false;
  private lighting: RockBodyLighting = DEFAULT_ROCK_BODY_LIGHTING;

  constructor(
    private layers: FlightLayerContexts,
    readonly doc: PlanetInspectorDocument,
    changed: () => void,
  ) {
    this.reference = references[doc.planet.name];
    this.sim = this.createSimulation();
    this.renderer = new Renderer(layers.world.canvas);
    this.seekRotation(doc.opening.rotationDegrees);
    if (doc.opening.orbitDegrees !== undefined)
      this.setOrbit(doc.opening.orbitDegrees);
    this.status = `Loading ${this.reference.label} material…`;
    void this.prepareMaterial(changed);
  }
  private createSimulation() {
    const sim = new Simulation({ ...stockSettings("wasp"), mode: "practice" });
    const planet = sim.planets.find((p) => p.id === this.reference.id);
    if (!planet)
      throw new Error(
        `Named ${this.reference.label} is unavailable in Practice`,
      );
    sim.planets.splice(0, sim.planets.length, planet);
    sim.start();
    return sim;
  }
  private async prepareMaterial(changed: () => void) {
    let pendingPainter: { dispose: () => void } | undefined;
    try {
      if (this.doc.planet.name === "mercury") {
        const material = await createPracticeMercury(true);
        pendingPainter = material.painter;
        if (this.disposed) {
          material.painter.dispose();
          pendingPainter = undefined;
          return;
        }
        material.painter.prepareLighting(this.lighting);
        this.mercury = material;
        pendingPainter = undefined;
      } else {
        const material = createPracticeVenus(true);
        pendingPainter = material.painter;
        if (this.disposed) {
          material.painter.dispose();
          pendingPainter = undefined;
          return;
        }
        material.painter.prepareLighting(this.lighting);
        this.venus = material;
        pendingPainter = undefined;
      }
      if (this.disposed) return;
      this.status = "";
    } catch {
      pendingPainter?.dispose();
      if (this.disposed) return;
      this.status = `${this.reference.label} material unavailable; using the production fallback.`;
    }
    changed();
  }
  get planet(): Planet {
    return this.sim.planets[0];
  }
  get spinTicks() {
    return Math.round(this.reference.spinSeconds / STEP);
  }
  get rotation() {
    return this.sim.ticks > 0 && this.sim.ticks % this.spinTicks === 0
      ? 360
      : ((this.sim.ticks % this.spinTicks) * 360) / this.spinTicks;
  }
  get orbit() {
    return ((((this.planet.orbitAngle * 180) / Math.PI) % 360) + 360) % 360;
  }
  seekRotation(value: number) {
    const orbit = this.orbit;
    const tick = Math.round((value / 360) * this.spinTicks);
    if (tick < this.sim.ticks) this.sim = this.createSimulation();
    while (this.sim.ticks < tick) this.step();
    this.setOrbit(orbit);
  }
  setOrbit(value: number) {
    this.planet.orbitAngle = (value * Math.PI) / 180;
    updatePlanetOrbit(this.planet, 0);
  }
  setLighting(input: unknown) {
    const next = RockBodyLightingSchema.parse(input);
    const painter = (this.mercury ?? this.venus)?.painter;
    painter?.prepareLighting(next);
    this.lighting = next;
  }
  resize(width: number, height: number) {
    resizeFlightLayers(this.layers, this.renderer, width, height);
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
  }
  step() {
    this.sim.step(INPUT);
  }
  private get surface() {
    const surface = (this.mercury ?? this.venus)?.surface;
    return surface instanceof StripSphericalSurface ? surface : undefined;
  }
  get passMilliseconds() {
    return this.samples.length
      ? this.samples.reduce((sum, s) => sum + s.ms, 0) / this.samples.length
      : 0;
  }
  get redrawsPerSecond() {
    const seconds = Math.min(
      1,
      (performance.now() - this.measurementStart) / 1000,
    );
    return seconds > 0
      ? this.samples.reduce((sum, s) => sum + s.redraws, 0) / seconds
      : 0;
  }
  draw(zoom: number, hud: boolean) {
    this.camera.zoom = zoom;
    this.camera.pos.set(this.planet.pos.x, this.planet.pos.y);
    const before = this.surface?.redrawCount ?? 0;
    let milliseconds = 0;
    drawFlightFrame(
      {
        layers: this.layers,
        renderer: this.renderer,
        camera: this.camera,
        sim: this.sim,
        fx: this.fx,
        mercury: this.mercury,
        venus: this.venus,
      },
      {
        include: (pass) => PASSES.has(pass.id) && (hud || !HUD.has(pass.id)),
        observe: (pass, ms) => {
          if (pass.id === "planets") milliseconds = ms;
        },
      },
    );
    const at = performance.now();
    this.samples.push({
      at,
      ms: milliseconds,
      redraws: (this.surface?.redrawCount ?? 0) - before,
    });
    while (this.samples.length && this.samples[0].at <= at - 1000)
      this.samples.shift();
  }
  dispose() {
    this.disposed = true;
    this.mercury?.painter.dispose();
    this.venus?.painter.dispose();
    this.mercury = undefined;
    this.venus = undefined;
    this.samples = [];
    this.fx.clear();
  }
}
